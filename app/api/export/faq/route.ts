import { NextResponse } from "next/server";
import { buildFaqCsv } from "@/lib/export";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/export/faq — downloads the FAQ CSV (Question,Answer).
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csv = await buildFaqCsv();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="estately-faq.csv"',
    },
  });
}
