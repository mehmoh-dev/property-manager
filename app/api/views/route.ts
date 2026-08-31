import { NextRequest, NextResponse } from "next/server";
import { recordView } from "@/lib/recommendations";
import { getOrCreateSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/views  { propertyId }  — records a view for the current session.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId = Number(body.propertyId);
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }
    const sessionId = await getOrCreateSessionId();
    await recordView(propertyId, sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
