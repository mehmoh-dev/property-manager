import { NextRequest, NextResponse } from "next/server";
import { listProperties, listCities } from "@/lib/properties";
import type { PropertyFilters } from "@/lib/types";
import { geminiParseSearch, isGeminiEnabled } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai-search?q=...
 * Uses Gemini to parse a natural-language query into filters, then returns the
 * matching properties. Falls back to a plain keyword search if Gemini is off.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const cities = await listCities();
  let filters: PropertyFilters = {};
  let ai = false;

  if (isGeminiEnabled()) {
    const parsed = await geminiParseSearch(q, cities);
    if (parsed) {
      ai = true;
      filters = {
        city: parsed.city,
        type: parsed.type as PropertyFilters["type"],
        listingType: parsed.listingType,
        condition: parsed.condition,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
        minBedrooms: parsed.minBedrooms,
        q: parsed.keywords || undefined,
      };
    }
  }

  // Fallback / when AI extracted nothing useful: keyword search.
  if (!ai) {
    filters = { q };
  }

  const properties = await listProperties({ ...filters, limit: 60 });
  return NextResponse.json({ properties, filters, ai, query: q });
}
