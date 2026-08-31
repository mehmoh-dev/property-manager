import { NextRequest, NextResponse } from "next/server";
import {
  getProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/properties";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/properties/[id]">
) {
  const { id } = await ctx.params;
  const property = await getProperty(Number(id));
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ property });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/properties/[id]">
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  const toArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map(String)
      : typeof v === "string"
        ? v.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

  const property = await updateProperty(Number(id), {
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
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ property });
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/properties/[id]">
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteProperty(Number(id));
  return NextResponse.json({ ok: true });
}
