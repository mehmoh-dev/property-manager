import type { BuyerPreferences, Property } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

interface GeminiSchema {
  type: string;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  enum?: string[];
  description?: string;
  required?: string[];
  nullable?: boolean;
}

/**
 * Low-level call to the Gemini generateContent REST API with structured
 * (JSON schema) output. Returns the parsed JSON, or null on any failure so
 * callers can fall back to non-AI logic.
 */
async function callGemini<T>(
  prompt: string,
  schema: GeminiSchema,
  { timeoutMs = 20000 }: { timeoutMs?: number } = {}
): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
          // Disable "thinking" on 2.5-flash for faster, more predictable
          // latency on these structured tasks (ignored by models without it).
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("Gemini API non-OK", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    // Non-fatal: the caller falls back to the content-based algorithm.
    // Logged as a warning so it doesn't surface as an app error.
    const msg = (err as Error).name === "AbortError"
      ? `timed out after ${timeoutMs}ms`
      : (err as Error).message;
    console.warn("Gemini call skipped:", msg);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* --------------------- Natural-language search parsing ------------------ */

export interface ParsedSearch {
  city?: string;
  area?: string;
  type?: string;
  listingType?: "sale" | "rent";
  condition?: "new" | "under_construction" | "old" | "renovated";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  keywords?: string;
}

/**
 * Uses Gemini to turn a free-text query ("3 bed rented flat in Karachi under
 * 1 lakh") into structured filters. Prices are in PKR absolute rupees.
 */
export async function geminiParseSearch(
  query: string,
  cities: string[]
): Promise<ParsedSearch | null> {
  if (!query.trim()) return null;

  const prompt = `You are a real-estate search parser for a Pakistani property portal.
Convert the user's query into structured filters. Prices must be absolute PKR rupees
(1 lakh = 100000, 1 crore = 10000000). Known cities: ${cities.join(", ") || "any"}.
Property types: house, apartment, villa, plot, commercial, office.
listingType: "rent" for rentals/rent, "sale" for buy/purchase/on sale.
condition: "new" (new/newly built), "under_construction", "old" (old/resale), "renovated".
Only include fields you are confident about. Put any leftover descriptive words in "keywords".

User query: "${query}"`;

  return callGemini<ParsedSearch>(prompt, {
    type: "object",
    properties: {
      city: { type: "string" },
      area: { type: "string" },
      type: {
        type: "string",
        enum: ["house", "apartment", "villa", "plot", "commercial", "office"],
      },
      listingType: { type: "string", enum: ["sale", "rent"] },
      condition: {
        type: "string",
        enum: ["new", "under_construction", "old", "renovated"],
      },
      minPrice: { type: "number" },
      maxPrice: { type: "number" },
      minBedrooms: { type: "number" },
      keywords: { type: "string" },
    },
  });
}

/* ----------------------- Recommendation ranking ------------------------ */

export interface RankedItem {
  id: number;
  reason: string;
}

function compactProperty(p: Property): string {
  return [
    `id=${p.id}`,
    p.title,
    p.type,
    p.listing_type === "rent" ? "for-rent" : "for-sale",
    p.condition,
    `PKR ${p.price}`,
    [p.area, p.city].filter(Boolean).join(" "),
    `${p.bedrooms}bed`,
    `${p.area_sqft}sqft`,
    p.features.slice(0, 4).join("/"),
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * Asks Gemini to rank candidate properties for a buyer, given their stated
 * preferences and the properties they've viewed, returning an ordered list
 * with a short human reason for each. Returns null on failure (caller falls
 * back to the content-based scorer).
 */
export async function geminiRankRecommendations(args: {
  preferences?: BuyerPreferences | null;
  viewed: Property[];
  candidates: Property[];
  limit: number;
}): Promise<RankedItem[] | null> {
  const { preferences, viewed, candidates, limit } = args;
  if (candidates.length === 0) return [];

  const prefText = preferences
    ? JSON.stringify(preferences)
    : "none provided";
  const viewedText = viewed.length
    ? viewed.map(compactProperty).join("\n")
    : "none yet";
  const candidateText = candidates.map(compactProperty).join("\n");

  const prompt = `You are a real-estate recommendation engine. Rank the CANDIDATE
properties for this buyer from best to worst fit. Weigh their stated preferences and
the properties they have already viewed (similar type, location, price band, condition
and size indicate intent). Return at most ${limit} items, best first. For each, give a
short, specific one-sentence reason a buyer would find helpful.

BUYER PREFERENCES (JSON): ${prefText}

PROPERTIES THEY VIEWED:
${viewedText}

CANDIDATES (choose and rank only from these ids):
${candidateText}`;

  const result = await callGemini<{ items: RankedItem[] }>(prompt, {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            reason: { type: "string" },
          },
          required: ["id", "reason"],
        },
      },
    },
    required: ["items"],
  });

  return result?.items ?? null;
}
