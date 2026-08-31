import { sql } from "./db";
import { mapProperty } from "./properties";
import type { BuyerPreferences, Property } from "./types";
import { geminiRankRecommendations, isGeminiEnabled } from "./gemini";

/**
 * Records a property view for a session. This is the signal that powers
 * personalized recommendations ("recommend similar to what they viewed").
 */
export async function recordView(propertyId: number, sessionId: string) {
  if (!sessionId) return;
  await sql`
    INSERT INTO property_views (property_id, session_id)
    VALUES (${propertyId}, ${sessionId})
  `;
}

/** Returns the properties a session has viewed, most-recent first. */
export async function getViewedProperties(
  sessionId: string,
  limit = 20
): Promise<Property[]> {
  if (!sessionId) return [];
  const rows = await sql`
    SELECT p.*, MAX(v.created_at) AS last_viewed
    FROM property_views v
    JOIN properties p ON p.id = v.property_id
    WHERE v.session_id = ${sessionId}
    GROUP BY p.id
    ORDER BY last_viewed DESC
    LIMIT ${limit}
  `;
  return rows.map(mapProperty);
}

/**
 * Similarity score between two properties (0..1-ish). Higher = more similar.
 * Weighted by the attributes buyers care about most: type, location, price,
 * size, and shared features.
 */
export function similarityScore(a: Property, b: Property): number {
  let score = 0;

  // Property type is the strongest signal.
  if (a.type === b.type) score += 0.32;

  // Same listing intent (buy vs rent) matters a lot.
  if (a.listing_type === b.listing_type) score += 0.15;

  // Location: same city, extra for same area.
  if (a.city && a.city === b.city) score += 0.18;
  if (a.area && a.area === b.area) score += 0.08;

  // Price closeness (within a band relative to the reference price).
  if (a.price > 0 && b.price > 0) {
    const diff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
    score += Math.max(0, 0.15 * (1 - diff)); // full 0.15 when identical price
  }

  // Bedroom closeness.
  const bedDiff = Math.abs(a.bedrooms - b.bedrooms);
  score += Math.max(0, 0.06 * (1 - bedDiff / 3));

  // Size closeness.
  if (a.area_sqft > 0 && b.area_sqft > 0) {
    const diff =
      Math.abs(a.area_sqft - b.area_sqft) / Math.max(a.area_sqft, b.area_sqft);
    score += Math.max(0, 0.06 * (1 - diff));
  }

  // Shared features (Jaccard-ish).
  if (a.features.length && b.features.length) {
    const setB = new Set(b.features.map((f) => f.toLowerCase()));
    const shared = a.features.filter((f) => setB.has(f.toLowerCase())).length;
    const union = new Set([
      ...a.features.map((f) => f.toLowerCase()),
      ...b.features.map((f) => f.toLowerCase()),
    ]).size;
    if (union > 0) score += 0.1 * (shared / union);
  }

  return score;
}

/**
 * "Similar properties" for a single property (used on the detail page).
 */
export async function getSimilarProperties(
  property: Property,
  limit = 4
): Promise<Property[]> {
  const rows = await sql`
    SELECT * FROM properties
    WHERE id <> ${property.id} AND status = 'available'
  `;
  const candidates = rows.map(mapProperty);

  return candidates
    .map((c) => ({ c, s: similarityScore(property, c) }))
    .sort((x, y) => y.s - x.s)
    .slice(0, limit)
    .map((x) => x.c);
}

/**
 * Scores how well a candidate matches explicit buyer preferences (0..1-ish).
 * Used to bias both the AI and the fallback ranking.
 */
export function preferenceScore(
  pref: BuyerPreferences,
  p: Property
): number {
  let score = 0;
  if (pref.type && pref.type === p.type) score += 0.25;
  if (pref.listingType && pref.listingType === p.listing_type) score += 0.2;
  if (pref.condition && pref.condition === p.condition) score += 0.12;
  if (pref.city && p.city.toLowerCase().includes(pref.city.toLowerCase()))
    score += 0.18;
  if (pref.area && p.area.toLowerCase().includes(pref.area.toLowerCase()))
    score += 0.1;
  if (pref.minBedrooms && p.bedrooms >= pref.minBedrooms) score += 0.08;

  // Budget fit: full credit inside the band, partial just outside it.
  const min = pref.budgetMin ?? 0;
  const max = pref.budgetMax ?? Infinity;
  if (p.price >= min && p.price <= max) {
    score += 0.2;
  } else if (max !== Infinity && p.price > max) {
    const over = (p.price - max) / max;
    score += Math.max(0, 0.2 * (1 - over));
  }
  return score;
}

/**
 * AI-powered personalized recommendations. Uses Gemini to rank candidate
 * properties against the buyer's stated preferences and view history, with a
 * human-readable reason per property. Falls back to the content-based scorer
 * when Gemini is unavailable or errors.
 */
export async function getSmartRecommendations(args: {
  sessionId: string;
  preferences?: BuyerPreferences | null;
  limit?: number;
}): Promise<{
  properties: Property[];
  basis: "ai" | "personalized" | "preferences" | "popular";
  reasons: Record<number, string>;
  poweredByAI: boolean;
}> {
  const { sessionId, preferences, limit = 6 } = args;

  const viewed = await getViewedProperties(sessionId, 10);
  const allRows = await sql`SELECT * FROM properties WHERE status = 'available'`;
  const all = allRows.map(mapProperty);
  const viewedIds = new Set(viewed.map((v) => v.id));
  const candidates = all.filter((p) => !viewedIds.has(p.id));

  const hasSignal =
    viewed.length > 0 ||
    (preferences && Object.values(preferences).some((v) => v != null && v !== ""));

  // Cold start with no signal at all: featured/newest.
  if (!hasSignal || candidates.length === 0) {
    const fallback = (candidates.length ? candidates : all)
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.id - a.id;
      })
      .slice(0, limit);
    return { properties: fallback, basis: "popular", reasons: {}, poweredByAI: false };
  }

  // Primary path: Gemini ranking.
  if (isGeminiEnabled()) {
    const ranked = await geminiRankRecommendations({
      preferences,
      viewed,
      candidates,
      limit,
    });
    if (ranked && ranked.length) {
      const byId = new Map(candidates.map((p) => [p.id, p]));
      const properties: Property[] = [];
      const reasons: Record<number, string> = {};
      for (const item of ranked) {
        const prop = byId.get(item.id);
        if (prop) {
          properties.push(prop);
          reasons[prop.id] = item.reason;
        }
      }
      if (properties.length) {
        return { properties, basis: "ai", reasons, poweredByAI: true };
      }
    }
  }

  // Fallback: content-based scoring (views + preferences).
  const scored = candidates
    .map((candidate) => {
      let total = 0;
      viewed.forEach((v, index) => {
        total += similarityScore(v, candidate) * (1 / (1 + index));
      });
      if (preferences) total += preferenceScore(preferences, candidate) * 1.5;
      return { candidate, total };
    })
    .sort((a, b) => b.total - a.total);

  const properties = scored.slice(0, limit).map((s) => s.candidate);
  const basis = viewed.length > 0 ? "personalized" : "preferences";
  return { properties, basis, reasons: {}, poweredByAI: false };
}

/**
 * Personalized recommendations based on everything a session has viewed.
 * Aggregates similarity against each viewed property (recent views weighted
 * higher), excludes already-viewed items, and returns the top matches.
 *
 * Falls back to featured/newest available properties for new visitors with
 * no view history.
 */
export async function getRecommendationsForSession(
  sessionId: string,
  limit = 6
): Promise<{ properties: Property[]; basis: "personalized" | "popular" }> {
  const viewed = await getViewedProperties(sessionId, 10);

  const allRows = await sql`
    SELECT * FROM properties WHERE status = 'available'
  `;
  const all = allRows.map(mapProperty);

  if (viewed.length === 0) {
    // Cold start: featured first, then newest.
    const fallback = all
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.id - a.id;
      })
      .slice(0, limit);
    return { properties: fallback, basis: "popular" };
  }

  const viewedIds = new Set(viewed.map((v) => v.id));

  const scored = all
    .filter((p) => !viewedIds.has(p.id))
    .map((candidate) => {
      let total = 0;
      viewed.forEach((v, index) => {
        // Recency weight: most recently viewed gets the highest weight.
        const recencyWeight = 1 / (1 + index);
        total += similarityScore(v, candidate) * recencyWeight;
      });
      return { candidate, total };
    })
    .sort((a, b) => b.total - a.total);

  const properties = scored.slice(0, limit).map((s) => s.candidate);
  return { properties, basis: "personalized" };
}
