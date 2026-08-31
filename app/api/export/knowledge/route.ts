import { NextResponse } from "next/server";
import { buildKnowledgeDocument } from "@/lib/export";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/export/knowledge — downloads the .txt knowledge document.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const text = await buildKnowledgeDocument();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="estately-knowledge.txt"',
    },
  });
}
