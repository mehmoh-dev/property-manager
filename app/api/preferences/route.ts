import { NextRequest, NextResponse } from "next/server";
import { readPreferences, savePreferences } from "@/lib/preferences";
import { upsertLead } from "@/lib/leads";
import { readSessionId } from "@/lib/session";
import { listCities } from "@/lib/properties";
import type { BuyerPreferences } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/preferences — returns saved preferences (or null) and city options.
export async function GET() {
  const [prefs, cities] = await Promise.all([readPreferences(), listCities()]);
  return NextResponse.json({ preferences: prefs, cities });
}

/**
 * POST /api/preferences — saves buyer preferences from the intro modal.
 * If contact details are included, also captures/qualifies a lead so agents
 * can follow up with serious buyers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const num = (v: unknown) =>
      v != null && v !== "" && Number.isFinite(Number(v))
        ? Number(v)
        : undefined;

    const prefs: BuyerPreferences = {
      city: body.city ? String(body.city) : undefined,
      area: body.area ? String(body.area) : undefined,
      listingType: body.listingType || undefined,
      type: body.type || undefined,
      condition: body.condition || undefined,
      budgetMin: num(body.budgetMin),
      budgetMax: num(body.budgetMax),
      minBedrooms: num(body.minBedrooms),
    };
    await savePreferences(prefs);

    // Optionally capture a lead when contact info is provided.
    if (body.name || body.phone || body.email) {
      const sessionId = (await readSessionId()) ?? null;
      await upsertLead({
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        phone: String(body.phone ?? ""),
        budget_min: prefs.budgetMin ?? null,
        budget_max: prefs.budgetMax ?? null,
        preferred_city: prefs.city ?? null,
        preferred_type: prefs.type ?? null,
        session_id: sessionId,
      });
    }

    return NextResponse.json({ ok: true, preferences: prefs });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
