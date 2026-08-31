import { NextResponse } from "next/server";
import { verifyEmail, isEmailEnabled } from "@/lib/email";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/email-test — admin only. Verifies Gmail SMTP credentials.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const error = await verifyEmail();
  return NextResponse.json({
    configured: isEmailEnabled(),
    ok: error === null,
    error,
    adminEmail: process.env.ADMIN_EMAIL || process.env.GMAIL_USER || null,
  });
}
