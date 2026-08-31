import { listProperties } from "./properties";
import { formatPrice, typeLabel, statusLabel, conditionLabel } from "./format";
import type { Property } from "./types";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function propertyUrl(p: Property): string {
  return `${baseUrl()}/properties/${p.id}`;
}

function specLine(p: Property): string {
  const parts: string[] = [];
  parts.push(typeLabel(p.type));
  if (p.bedrooms) parts.push(`${p.bedrooms} bed`);
  if (p.bathrooms) parts.push(`${p.bathrooms} bath`);
  if (p.area_sqft) parts.push(`${p.area_sqft} sqft`);
  return parts.join(", ");
}

/**
 * Builds a plain-text knowledge document describing every property.
 * This is the format Kommunicate's "train AI on documents" feature accepts
 * (upload as a .txt file). Each property is a self-contained section so the
 * bot can answer questions about individual listings.
 */
export async function buildKnowledgeDocument(): Promise<string> {
  const properties = await listProperties({ limit: 1000 });
  const lines: string[] = [];

  lines.push("ESTATELY — PROPERTY KNOWLEDGE BASE");
  lines.push(
    "Use this document to answer customer questions about available properties, pricing, locations and how to schedule a visit."
  );
  lines.push(`Total properties: ${properties.length}`);
  lines.push(`Website: ${baseUrl()}`);
  lines.push("");
  lines.push(
    "To schedule a visit, a customer opens a property page and fills the 'Schedule a visit' form, or shares their name, phone, preferred date and the property they are interested in."
  );
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("");

  for (const p of properties) {
    lines.push(`PROPERTY #${p.id}: ${p.title}`);
    lines.push(
      `Purpose: ${p.listing_type === "rent" ? "For Rent" : "For Sale"}`
    );
    lines.push(`Status: ${statusLabel(p.status)}`);
    lines.push(`Type: ${typeLabel(p.type)}`);
    lines.push(`Condition: ${conditionLabel(p.condition)}`);
    lines.push(`Price: ${formatPrice(p.price, p.listing_type)}`);
    lines.push(
      `Location: ${[p.area, p.city].filter(Boolean).join(", ") || "N/A"}`
    );
    if (p.address) lines.push(`Address: ${p.address}`);
    lines.push(`Specifications: ${specLine(p)}`);
    if (p.features.length)
      lines.push(`Features: ${p.features.join(", ")}`);
    if (p.description) lines.push(`Description: ${p.description}`);
    lines.push(`Details / booking link: ${propertyUrl(p)}`);
    lines.push("");
    lines.push("-".repeat(60));
    lines.push("");
  }

  return lines.join("\n");
}

function csvCell(value: string): string {
  const v = value ?? "";
  return `"${v.replace(/"/g, '""')}"`;
}

/**
 * Builds a two-column FAQ CSV (Question, Answer) — the format accepted by
 * Kommunicate/Dialogflow FAQ knowledge bases. Generates targeted Q&A pairs
 * per property plus a few general questions.
 */
export async function buildFaqCsv(): Promise<string> {
  const properties = await listProperties({ limit: 1000 });
  const rows: [string, string][] = [];

  // General FAQs.
  rows.push([
    "How do I schedule a property visit?",
    `Open the property you're interested in on ${baseUrl()}/properties and use the 'Schedule a visit' form, or share your name, phone number, preferred date and the property name and our agent will confirm.`,
  ]);
  rows.push([
    "What areas do you have properties in?",
    `We currently list properties in ${
      [...new Set(properties.map((p) => p.city).filter(Boolean))].join(", ") ||
      "several cities"
    }.`,
  ]);
  rows.push([
    "Do you have properties for rent?",
    `Yes. You can browse rentals at ${baseUrl()}/properties?listingType=rent.`,
  ]);

  // Per-property FAQs.
  for (const p of properties) {
    const location = [p.area, p.city].filter(Boolean).join(", ");
    const summary = `${p.title} is a ${conditionLabel(
      p.condition
    ).toLowerCase()} ${typeLabel(p.type).toLowerCase()} ${
      p.listing_type === "rent" ? "for rent" : "for sale"
    } in ${location || "our listings"} priced at ${formatPrice(
      p.price,
      p.listing_type
    )}. ${specLine(p)}.${
      p.features.length ? ` Features: ${p.features.join(", ")}.` : ""
    } Details: ${propertyUrl(p)}`;

    rows.push([`Tell me about ${p.title}`, summary]);
    rows.push([
      `What is the price of ${p.title}?`,
      `${p.title} is priced at ${formatPrice(p.price, p.listing_type)}. See ${propertyUrl(
        p
      )}`,
    ]);
    if (location) {
      rows.push([
        `Where is ${p.title} located?`,
        `${p.title} is located in ${location}${
          p.address ? ` (${p.address})` : ""
        }. Details: ${propertyUrl(p)}`,
      ]);
    }
  }

  const header = "Question,Answer";
  const body = rows
    .map(([q, a]) => `${csvCell(q)},${csvCell(a)}`)
    .join("\n");
  return `${header}\n${body}\n`;
}
