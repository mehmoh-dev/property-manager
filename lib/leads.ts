import { sql } from "./db";
import type {
  Lead,
  LeadStatus,
  Visit,
  FollowUp,
} from "./types";

/* ----------------------------- Lead scoring ----------------------------- */

export interface LeadSignals {
  hasPhone: boolean;
  hasEmail: boolean;
  hasBudget: boolean;
  budgetRealistic: boolean;
  hasPreferences: boolean;
  viewCount: number;
  hasScheduledVisit: boolean;
}

/**
 * Scores a lead 0-100 to filter serious buyers from tyre-kickers.
 * Contact completeness + a realistic budget + real engagement (views and
 * booked visits) push a lead toward "qualified".
 */
export function scoreLead(signals: LeadSignals): number {
  let score = 0;
  if (signals.hasPhone) score += 20;
  if (signals.hasEmail) score += 12;
  if (signals.hasBudget) score += 20;
  if (signals.budgetRealistic) score += 10;
  if (signals.hasPreferences) score += 8;
  score += Math.min(signals.viewCount, 5) * 3; // up to 15
  if (signals.hasScheduledVisit) score += 20;
  return Math.min(score, 100);
}

export function statusFromScore(score: number): LeadStatus {
  if (score >= 60) return "qualified";
  if (score < 30) return "unqualified";
  return "new";
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    budget_min: row.budget_min == null ? null : Number(row.budget_min),
    budget_max: row.budget_max == null ? null : Number(row.budget_max),
    preferred_city: (row.preferred_city as string) ?? null,
    preferred_type: (row.preferred_type as Lead["preferred_type"]) ?? null,
    notes: (row.notes as string) ?? null,
    status: row.status as LeadStatus,
    score: Number(row.score ?? 0),
    session_id: (row.session_id as string) ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export interface LeadInput {
  name: string;
  email: string;
  phone: string;
  budget_min?: number | null;
  budget_max?: number | null;
  preferred_city?: string | null;
  preferred_type?: string | null;
  notes?: string | null;
  session_id?: string | null;
}

/** Cheapest available property price, used as a realism threshold. */
async function minMarketPrice(): Promise<number> {
  const rows = await sql`
    SELECT MIN(price)::bigint AS min FROM properties WHERE status = 'available'
  `;
  return rows[0]?.min ? Number(rows[0].min) : 0;
}

/**
 * Creates or updates a lead (deduped by email when provided), recomputes its
 * score from current signals, and sets qualification status.
 */
export async function upsertLead(input: LeadInput): Promise<Lead> {
  const marketMin = await minMarketPrice();

  // Engagement signals from the session (views + visits).
  let viewCount = 0;
  let hasScheduledVisit = false;
  if (input.session_id) {
    const vc = await sql`
      SELECT COUNT(DISTINCT property_id)::int AS c
      FROM property_views WHERE session_id = ${input.session_id}
    `;
    viewCount = Number(vc[0]?.c ?? 0);
  }
  if (input.email || input.phone) {
    const visitRows = await sql`
      SELECT COUNT(*)::int AS c FROM visits
      WHERE (email = ${input.email} AND ${input.email} <> '')
         OR (phone = ${input.phone} AND ${input.phone} <> '')
    `;
    hasScheduledVisit = Number(visitRows[0]?.c ?? 0) > 0;
  }

  const budgetMax = input.budget_max ?? null;
  const score = scoreLead({
    hasPhone: !!input.phone,
    hasEmail: !!input.email,
    hasBudget: input.budget_min != null || input.budget_max != null,
    budgetRealistic:
      budgetMax != null && (marketMin === 0 || budgetMax >= marketMin),
    hasPreferences: !!(input.preferred_city || input.preferred_type),
    viewCount,
    hasScheduledVisit,
  });
  const status = statusFromScore(score);

  // Try to find an existing lead by email (or phone).
  let existing: Record<string, unknown>[] = [];
  if (input.email) {
    existing = await sql`SELECT * FROM leads WHERE email = ${input.email} LIMIT 1`;
  }
  if (!existing.length && input.phone) {
    existing = await sql`SELECT * FROM leads WHERE phone = ${input.phone} LIMIT 1`;
  }

  if (existing.length) {
    const id = Number(existing[0].id);
    const rows = await sql`
      UPDATE leads SET
        name = COALESCE(NULLIF(${input.name}, ''), name),
        phone = COALESCE(NULLIF(${input.phone}, ''), phone),
        email = COALESCE(NULLIF(${input.email}, ''), email),
        budget_min = ${input.budget_min ?? null},
        budget_max = ${input.budget_max ?? null},
        preferred_city = ${input.preferred_city ?? null},
        preferred_type = ${input.preferred_type ?? null},
        notes = COALESCE(${input.notes ?? null}, notes),
        session_id = COALESCE(${input.session_id ?? null}, session_id),
        score = ${score},
        status = ${status},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return mapLead(rows[0]);
  }

  const rows = await sql`
    INSERT INTO leads
      (name, email, phone, budget_min, budget_max, preferred_city,
       preferred_type, notes, status, score, session_id)
    VALUES
      (${input.name}, ${input.email}, ${input.phone}, ${input.budget_min ?? null},
       ${input.budget_max ?? null}, ${input.preferred_city ?? null},
       ${input.preferred_type ?? null}, ${input.notes ?? null}, ${status},
       ${score}, ${input.session_id ?? null})
    RETURNING *
  `;
  return mapLead(rows[0]);
}

export async function listLeads(status?: LeadStatus): Promise<Lead[]> {
  const rows = await sql`
    SELECT * FROM leads
    WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
    ORDER BY score DESC, created_at DESC
  `;
  return rows.map(mapLead);
}

export async function getLead(id: number): Promise<Lead | null> {
  const rows = await sql`SELECT * FROM leads WHERE id = ${id}`;
  return rows.length ? mapLead(rows[0]) : null;
}

export async function setLeadStatus(
  id: number,
  status: LeadStatus
): Promise<void> {
  await sql`UPDATE leads SET status = ${status}, updated_at = now() WHERE id = ${id}`;
}

/* ------------------------------- Visits -------------------------------- */

function mapVisit(row: Record<string, unknown>): Visit {
  return {
    id: Number(row.id),
    property_id: Number(row.property_id),
    lead_id: row.lead_id == null ? null : Number(row.lead_id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    visit_date: String(row.visit_date ?? ""),
    visit_time: String(row.visit_time ?? ""),
    status: row.status as Visit["status"],
    notes: (row.notes as string) ?? null,
    created_at: String(row.created_at ?? ""),
    property_title: row.property_title ? String(row.property_title) : undefined,
    property_city: row.property_city ? String(row.property_city) : undefined,
  };
}

export interface VisitInput {
  property_id: number;
  name: string;
  email: string;
  phone: string;
  visit_date: string;
  visit_time: string;
  notes?: string | null;
  session_id?: string | null;
}

/**
 * Books a property visit and links/creates the associated lead. Booking a
 * visit is a strong buying signal, so the lead is (re)scored here too.
 */
export async function createVisit(input: VisitInput): Promise<Visit> {
  const lead = await upsertLead({
    name: input.name,
    email: input.email,
    phone: input.phone,
    session_id: input.session_id ?? null,
    notes: input.notes ?? null,
  });

  const rows = await sql`
    INSERT INTO visits
      (property_id, lead_id, name, email, phone, visit_date, visit_time, notes)
    VALUES
      (${input.property_id}, ${lead.id}, ${input.name}, ${input.email},
       ${input.phone}, ${input.visit_date}, ${input.visit_time}, ${input.notes ?? null})
    RETURNING *
  `;
  return mapVisit(rows[0]);
}

export async function listVisits(): Promise<Visit[]> {
  const rows = await sql`
    SELECT v.*, p.title AS property_title, p.city AS property_city
    FROM visits v
    JOIN properties p ON p.id = v.property_id
    ORDER BY v.visit_date DESC, v.created_at DESC
  `;
  return rows.map(mapVisit);
}

export async function setVisitStatus(
  id: number,
  status: Visit["status"]
): Promise<void> {
  await sql`UPDATE visits SET status = ${status} WHERE id = ${id}`;
}

/* ----------------------------- Follow-ups ------------------------------ */

function mapFollowUp(row: Record<string, unknown>): FollowUp {
  return {
    id: Number(row.id),
    lead_id: Number(row.lead_id),
    due_date: String(row.due_date ?? ""),
    channel: String(row.channel ?? "call"),
    note: (row.note as string) ?? null,
    status: row.status as FollowUp["status"],
    created_at: String(row.created_at ?? ""),
    lead_name: row.lead_name ? String(row.lead_name) : undefined,
    lead_email: row.lead_email ? String(row.lead_email) : undefined,
    lead_phone: row.lead_phone ? String(row.lead_phone) : undefined,
  };
}

export async function createFollowUp(input: {
  lead_id: number;
  due_date: string;
  channel: string;
  note?: string | null;
}): Promise<FollowUp> {
  const rows = await sql`
    INSERT INTO follow_ups (lead_id, due_date, channel, note)
    VALUES (${input.lead_id}, ${input.due_date}, ${input.channel}, ${input.note ?? null})
    RETURNING *
  `;
  return mapFollowUp(rows[0]);
}

export async function listFollowUps(): Promise<FollowUp[]> {
  const rows = await sql`
    SELECT f.*, l.name AS lead_name, l.email AS lead_email, l.phone AS lead_phone
    FROM follow_ups f
    JOIN leads l ON l.id = f.lead_id
    ORDER BY
      CASE WHEN f.status = 'pending' THEN 0 ELSE 1 END,
      f.due_date ASC
  `;
  return rows.map(mapFollowUp);
}

export async function setFollowUpStatus(
  id: number,
  status: FollowUp["status"]
): Promise<void> {
  await sql`UPDATE follow_ups SET status = ${status} WHERE id = ${id}`;
}
