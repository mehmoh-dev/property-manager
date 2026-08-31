import { NextRequest, NextResponse } from "next/server";
import { createVisit, listVisits } from "@/lib/leads";
import { getProperty } from "@/lib/properties";
import { sendVisitEmails } from "@/lib/email";
import { readSessionId } from "@/lib/session";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/visits — public, book a property visit (also creates/scores lead
// and sends email notifications to the visitor and the agency admin).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.property_id || !body.name || !(body.phone || body.email)) {
      return NextResponse.json(
        { error: "property_id, name and a phone or email are required" },
        { status: 400 }
      );
    }
    const sessionId = (await readSessionId()) ?? null;
    const visit = await createVisit({
      property_id: Number(body.property_id),
      name: String(body.name),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      visit_date: String(body.visit_date ?? ""),
      visit_time: String(body.visit_time ?? ""),
      notes: body.notes ? String(body.notes) : null,
      session_id: sessionId,
    });

    // Fire off notifications. Best-effort — never block the booking on email.
    let notified = { user: false, admin: false };
    try {
      const property = await getProperty(visit.property_id);
      if (property) {
        notified = await sendVisitEmails({ visit, property });
      }
    } catch (err) {
      console.error("visit email dispatch failed", (err as Error).message);
    }

    return NextResponse.json({ visit, notified }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

// GET /api/visits — admin only.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const visits = await listVisits();
  return NextResponse.json({ visits });
}
