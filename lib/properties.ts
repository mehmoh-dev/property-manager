import { sql } from "./db";
import type { Property, PropertyFilters } from "./types";

/**
 * Normalizes a raw DB row into a typed Property.
 * BIGINT columns come back as strings from the driver, so we coerce numbers.
 */
function mapProperty(row: Record<string, unknown>): Property {
  return {
    id: Number(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    type: row.type as Property["type"],
    listing_type: row.listing_type as Property["listing_type"],
    condition: (row.condition ?? "new") as Property["condition"],
    status: row.status as Property["status"],
    price: Number(row.price ?? 0),
    city: String(row.city ?? ""),
    area: String(row.area ?? ""),
    address: String(row.address ?? ""),
    bedrooms: Number(row.bedrooms ?? 0),
    bathrooms: Number(row.bathrooms ?? 0),
    area_sqft: Number(row.area_sqft ?? 0),
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    featured: Boolean(row.featured),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export interface PropertyInput {
  title: string;
  description: string;
  type: string;
  listing_type: string;
  condition: string;
  status: string;
  price: number;
  city: string;
  area: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  features: string[];
  images: string[];
  featured: boolean;
}

/**
 * Lists properties applying dynamic filters. All filtering is done in SQL so
 * results always reflect current database data (no hardcoded lists).
 */
export async function listProperties(
  filters: PropertyFilters = {}
): Promise<Property[]> {
  const {
    city,
    type,
    listingType,
    condition,
    minPrice,
    maxPrice,
    minBedrooms,
    status,
    q,
    featuredOnly,
    limit = 60,
    offset = 0,
    sort = "newest",
  } = filters;

  const rows = await sql`
    SELECT * FROM properties
    WHERE
      (${city ?? null}::text IS NULL OR city ILIKE ${city ? `%${city}%` : null})
      AND (${type ?? null}::text IS NULL OR type = ${type ?? null})
      AND (${listingType ?? null}::text IS NULL OR listing_type = ${listingType ?? null})
      AND (${condition ?? null}::text IS NULL OR condition = ${condition ?? null})
      AND (${status ?? null}::text IS NULL OR status = ${status ?? null})
      AND (${minPrice ?? null}::bigint IS NULL OR price >= ${minPrice ?? null})
      AND (${maxPrice ?? null}::bigint IS NULL OR price <= ${maxPrice ?? null})
      AND (${minBedrooms ?? null}::int IS NULL OR bedrooms >= ${minBedrooms ?? null})
      AND (${featuredOnly ? true : null}::boolean IS NULL OR featured = true)
      AND (
        ${q ?? null}::text IS NULL
        OR title ILIKE ${q ? `%${q}%` : null}
        OR description ILIKE ${q ? `%${q}%` : null}
        OR area ILIKE ${q ? `%${q}%` : null}
        OR city ILIKE ${q ? `%${q}%` : null}
      )
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Sort in JS: the Neon serverless tagged template treats interpolations as
  // bound parameters, so a dynamic ORDER BY clause can't be injected safely.
  const properties = rows.map(mapProperty);
  properties.sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    // newest: by created_at desc, fall back to id
    const at = new Date(a.created_at).getTime() || 0;
    const bt = new Date(b.created_at).getTime() || 0;
    return bt - at || b.id - a.id;
  });
  return properties;
}

export async function getProperty(id: number): Promise<Property | null> {
  const rows = await sql`SELECT * FROM properties WHERE id = ${id}`;
  return rows.length ? mapProperty(rows[0]) : null;
}

export async function createProperty(input: PropertyInput): Promise<Property> {
  const rows = await sql`
    INSERT INTO properties
      (title, description, type, listing_type, condition, status, price, city, area, address,
       bedrooms, bathrooms, area_sqft, features, images, featured)
    VALUES
      (${input.title}, ${input.description}, ${input.type}, ${input.listing_type},
       ${input.condition}, ${input.status}, ${input.price}, ${input.city}, ${input.area},
       ${input.address}, ${input.bedrooms}, ${input.bathrooms}, ${input.area_sqft},
       ${JSON.stringify(input.features)}::jsonb, ${JSON.stringify(input.images)}::jsonb,
       ${input.featured})
    RETURNING *
  `;
  return mapProperty(rows[0]);
}

export async function updateProperty(
  id: number,
  input: PropertyInput
): Promise<Property | null> {
  const rows = await sql`
    UPDATE properties SET
      title = ${input.title},
      description = ${input.description},
      type = ${input.type},
      listing_type = ${input.listing_type},
      condition = ${input.condition},
      status = ${input.status},
      price = ${input.price},
      city = ${input.city},
      area = ${input.area},
      address = ${input.address},
      bedrooms = ${input.bedrooms},
      bathrooms = ${input.bathrooms},
      area_sqft = ${input.area_sqft},
      features = ${JSON.stringify(input.features)}::jsonb,
      images = ${JSON.stringify(input.images)}::jsonb,
      featured = ${input.featured},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows.length ? mapProperty(rows[0]) : null;
}

export async function deleteProperty(id: number): Promise<void> {
  await sql`DELETE FROM properties WHERE id = ${id}`;
}

/** Distinct city list for filter dropdowns (dynamic from data). */
export async function listCities(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT city FROM properties WHERE city <> '' ORDER BY city
  `;
  return rows.map((r) => String(r.city));
}

export { mapProperty };
