import { NextRequest, NextResponse } from "next/server";
import { listProperties, createProperty } from "@/lib/properties";
import type { PropertyFilters } from "@/lib/types";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseFilters(sp: URLSearchParams): PropertyFilters {
  const num = (v: string | null) => (v != null && v !== "" ? Number(v) : undefined);
  return {
    city: sp.get("city") || undefined,
    type: (sp.get("type") as PropertyFilters["type"]) || undefined,
    listingType:
      (sp.get("listingType") as PropertyFilters["listingType"]) || undefined,
    condition: (sp.get("condition") as PropertyFilters["condition"]) || undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    minBedrooms: num(sp.get("minBedrooms")),
    status: (sp.get("status") as PropertyFilters["status"]) || undefined,
    q: sp.get("q") || undefined,
    featuredOnly: sp.get("featured") === "true" || undefined,
    sort: (sp.get("sort") as PropertyFilters["sort"]) || undefined,
    limit: num(sp.get("limit")),
    offset: num(sp.get("offset")),
  };
}

// GET /api/properties — public, filterable listing (also used by the bot).
export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  const properties = await listProperties(filters);
  return NextResponse.json({ properties, count: properties.length });
}

// POST /api/properties — admin only, create a property.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const property = await createProperty(normalizeInput(body));
    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

function normalizeInput(body: Record<string, unknown>) {
  const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string")
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [];
  };
  return {
    title: String(body.title ?? ""),
    description: String(body.description ?? ""),
    type: String(body.type ?? "house"),
    listing_type: String(body.listing_type ?? "sale"),
    condition: String(body.condition ?? "new"),
    status: String(body.status ?? "available"),
    price: Number(body.price ?? 0),
    city: String(body.city ?? ""),
    area: String(body.area ?? ""),
    address: String(body.address ?? ""),
    bedrooms: Number(body.bedrooms ?? 0),
    bathrooms: Number(body.bathrooms ?? 0),
    area_sqft: Number(body.area_sqft ?? 0),
    features: toArray(body.features),
    images: toArray(body.images),
    featured: Boolean(body.featured),
  };
}
