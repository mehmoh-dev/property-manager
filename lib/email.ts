import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Property, Visit } from "./types";
import { formatPrice } from "./format";

let cached: Transporter | null = null;

export function isEmailEnabled(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter(): Transporter | null {
  if (!isEmailEnabled()) return null;
  if (cached) return cached;

  cached = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      // App passwords are displayed with spaces; SMTP wants them removed.
      pass: (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, ""),
    },
  });
  return cached;
}

function adminEmail(): string {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || "";
}

function fromAddress(): string {
  return `Estately <${process.env.GMAIL_USER}>`;
}

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** Verifies the SMTP connection/credentials. Returns an error message or null. */
export async function verifyEmail(): Promise<string | null> {
  const t = getTransporter();
  if (!t) return "Email not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing).";
  try {
    await t.verify();
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

const wrap = (title: string, inner: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e3e6e4;border-radius:14px;overflow:hidden">
  <div style="background:#0c1a17;padding:20px 24px">
    <span style="color:#fff;font-size:18px;font-weight:700">Estate<span style="color:#10715f">ly</span></span>
  </div>
  <div style="padding:24px">
    <h2 style="margin:0 0 12px;color:#12211d;font-size:20px">${title}</h2>
    ${inner}
  </div>
  <div style="padding:16px 24px;background:#f4f5f4;color:#5b6b66;font-size:12px">
    Estately · AI-matched property discovery
  </div>
</div>`;

function propertyBlock(property: Property): string {
  const location = [property.area, property.city].filter(Boolean).join(", ");
  return `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafa;border-radius:10px">
    <tr><td style="padding:14px 16px">
      <div style="font-weight:700;color:#12211d;font-size:15px">${property.title}</div>
      <div style="color:#5b6b66;font-size:13px;margin-top:4px">${location}</div>
      <div style="color:#0a5245;font-weight:700;font-size:15px;margin-top:8px">${formatPrice(
        property.price,
        property.listing_type
      )}</div>
      <a href="${baseUrl()}/properties/${property.id}"
         style="display:inline-block;margin-top:10px;color:#10715f;font-size:13px;font-weight:600;text-decoration:none">
        View property →
      </a>
    </td></tr>
  </table>`;
}

function detailRow(label: string, value: string): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 0;color:#5b6b66;font-size:13px;width:120px">${label}</td>
    <td style="padding:6px 0;color:#12211d;font-size:13px;font-weight:600">${value}</td>
  </tr>`;
}

/**
 * Sends visit-scheduling notifications:
 *  - a confirmation to the visitor (only if they supplied an email)
 *  - a lead alert to the agency admin (always)
 *
 * Best-effort: failures are logged and swallowed so booking still succeeds.
 * Returns which messages were sent.
 */
export async function sendVisitEmails(args: {
  visit: Visit;
  property: Property;
}): Promise<{ user: boolean; admin: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { user: false, admin: false, error: "email-disabled" };

  const { visit, property } = args;
  const when = `${visit.visit_date}${visit.visit_time ? ` at ${visit.visit_time}` : ""}`;
  let userSent = false;
  let adminSent = false;
  let error: string | undefined;

  // 1) Confirmation to the visitor.
  if (visit.email) {
    const inner = `
      <p style="color:#5b6b66;font-size:14px;line-height:1.6;margin:0 0 4px">
        Hi ${visit.name || "there"}, thanks for your interest! We've received your
        request to visit the property below. One of our agents will confirm your
        appointment shortly.
      </p>
      ${propertyBlock(property)}
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Requested", when)}
        ${detailRow("Your name", visit.name)}
        ${detailRow("Phone", visit.phone)}
        ${visit.notes ? detailRow("Notes", visit.notes) : ""}
      </table>`;
    try {
      await t.sendMail({
        from: fromAddress(),
        to: visit.email,
        subject: `Visit request received — ${property.title}`,
        html: wrap("Your visit request is in!", inner),
      });
      userSent = true;
    } catch (err) {
      error = (err as Error).message;
      console.error("visit user email failed", error);
    }
  }

  // 2) Alert to the admin/agency (always).
  const to = adminEmail();
  if (to) {
    const contactNote = visit.email
      ? ""
      : `<p style="background:#f6ecd6;color:#7a5a12;padding:10px 12px;border-radius:8px;font-size:13px;margin:0 0 12px">
           ⚠ The visitor did not provide an email. Please contact them by phone to confirm.
         </p>`;
    const inner = `
      <p style="color:#5b6b66;font-size:14px;line-height:1.6;margin:0 0 12px">
        A new visit request was submitted. Details below.
      </p>
      ${contactNote}
      ${propertyBlock(property)}
      <table style="width:100%;border-collapse:collapse">
        ${detailRow("Name", visit.name)}
        ${detailRow("Phone", visit.phone)}
        ${detailRow("Email", visit.email || "— not provided —")}
        ${detailRow("Preferred time", when)}
        ${visit.notes ? detailRow("Notes", visit.notes) : ""}
      </table>
      <a href="${baseUrl()}/admin/visits"
         style="display:inline-block;margin-top:16px;background:#10715f;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">
        Open in agent portal
      </a>`;
    try {
      await t.sendMail({
        from: fromAddress(),
        to,
        replyTo: visit.email || undefined,
        subject: `New visit request — ${property.title} (${visit.name || "lead"})`,
        html: wrap("New visit request", inner),
      });
      adminSent = true;
    } catch (err) {
      error = (err as Error).message;
      console.error("visit admin email failed", error);
    }
  }

  return { user: userSent, admin: adminSent, error };
}
