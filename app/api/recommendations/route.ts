import { NextRequest, NextResponse } from "next/server";
import {
  getSmartRecommendations,
  getSimilarProperties,
} from "@/lib/recommendations";
import { getProperty } from "@/lib/properties";
import { readSessionId } from "@/lib/session";
import { readPreferences } from "@/lib/preferences";

export const dynamic = "force-dynamic";

/**
 * GET /api/recommendations
 *   ?propertyId=123  -> "similar to this property" (content-based)
 *   (no params)      -> AI-powered, personalized to session views + preferences
 */
export async function GET(request: NextRequest) {
  const propertyIdParam = request.nextUrl.searchParams.get("propertyId");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 6);

  if (propertyIdParam) {
    const property = await getProperty(Number(propertyIdParam));
    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const properties = await getSimilarProperties(property, limit);
    return NextResponse.json({ properties, basis: "similar", reasons: {} });
  }

  const sessionId = (await readSessionId()) ?? "";
  const preferences = await readPreferences();
  const result = await getSmartRecommendations({ sessionId, preferences, limit });
  return NextResponse.json(result);
}
