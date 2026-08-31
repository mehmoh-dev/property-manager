import { NextRequest, NextResponse } from "next/server";
import { createSchema, seedIfEmpty } from "@/lib/schema";

export const dynamic = "force-dynamic";

/**
 * One-time setup endpoint. Creates tables and seeds demo data.
 * Protected by INIT_SECRET to avoid accidental/public invocation.
 *
 *   GET /api/init?secret=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.INIT_SECRET || secret !== process.env.INIT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await createSchema();
    const inserted = await seedIfEmpty();
    return NextResponse.json({
      ok: true,
      message: "Schema ready.",
      seeded: inserted,
    });
  } catch (err) {
    console.error("init error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
