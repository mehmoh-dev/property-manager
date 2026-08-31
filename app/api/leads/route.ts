import { NextRequest, NextResponse } from "next/server";
import { upsertLead, listLeads } from "@/lib/leads";
import type { LeadStatus } from "@/lib/types";
import { readSessionId } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads — public. Captures a buyer enquiry and returns the computed
 * qualification (score + status), so the chatbot/UI can decide whether to
 * fast-track a serious buyer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = (await readSessionId()) ?? null;
    const lead = await upsertLead({
      name: String(body.name ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      budget_min: body.budget_min != null ? Number(body.budget_min) : null,
      budget_max: body.budget_max != null ? Number(body.budget_max) : null,
      preferred_city: body.preferred_city ? String(body.preferred_city) : null,
      preferred_type: body.preferred_type ? String(body.preferred_type) : null,
      notes: body.notes ? String(body.notes) : null,
      session_id: sessionId,
    });
    return NextResponse.json({
      lead,
      qualified: lead.status === "qualified",
      score: lead.score,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// GET /api/leads?status=qualified — admin only.
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status") as LeadStatus | null;
  const leads = await listLeads(status ?? undefined);
  return NextResponse.json({ leads });
}
