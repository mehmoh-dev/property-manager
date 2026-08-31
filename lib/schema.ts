import { sql } from "./db";

/**
 * Creates all tables if they don't exist. Idempotent.
 */
export async function createSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      type          TEXT NOT NULL DEFAULT 'house',
      listing_type  TEXT NOT NULL DEFAULT 'sale',
      condition     TEXT NOT NULL DEFAULT 'new',
      status        TEXT NOT NULL DEFAULT 'available',
      price         BIGINT NOT NULL DEFAULT 0,
      city          TEXT NOT NULL DEFAULT '',
      area          TEXT NOT NULL DEFAULT '',
      address       TEXT NOT NULL DEFAULT '',
      bedrooms      INTEGER NOT NULL DEFAULT 0,
      bathrooms     INTEGER NOT NULL DEFAULT 0,
      area_sqft     INTEGER NOT NULL DEFAULT 0,
      features      JSONB NOT NULL DEFAULT '[]'::jsonb,
      images        JSONB NOT NULL DEFAULT '[]'::jsonb,
      featured      BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id             SERIAL PRIMARY KEY,
      name           TEXT NOT NULL DEFAULT '',
      email          TEXT NOT NULL DEFAULT '',
      phone          TEXT NOT NULL DEFAULT '',
      budget_min     BIGINT,
      budget_max     BIGINT,
      preferred_city TEXT,
      preferred_type TEXT,
      notes          TEXT,
      status         TEXT NOT NULL DEFAULT 'new',
      score          INTEGER NOT NULL DEFAULT 0,
      session_id     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id           SERIAL PRIMARY KEY,
      property_id  INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      lead_id      INTEGER REFERENCES leads(id) ON DELETE SET NULL,
      name         TEXT NOT NULL DEFAULT '',
      email        TEXT NOT NULL DEFAULT '',
      phone        TEXT NOT NULL DEFAULT '',
      visit_date   DATE NOT NULL,
      visit_time   TEXT NOT NULL DEFAULT '',
      status       TEXT NOT NULL DEFAULT 'scheduled',
      notes        TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS property_views (
      id           SERIAL PRIMARY KEY,
      property_id  INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      session_id   TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id           SERIAL PRIMARY KEY,
      lead_id      INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      due_date     DATE NOT NULL,
      channel      TEXT NOT NULL DEFAULT 'call',
      note         TEXT,
      status       TEXT NOT NULL DEFAULT 'pending',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  // Migration for pre-existing databases: add `condition` if missing.
  await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'new';`;

  await sql`CREATE INDEX IF NOT EXISTS idx_views_session ON property_views(session_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_views_property ON property_views(property_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_props_city ON properties(city);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_props_type ON properties(type);`;
}

const SEED_PROPERTIES = [
  {
    title: "Modern 3-Bed Family House in DHA Phase 6",
    description:
      "A beautifully designed 3-bedroom family home in the heart of DHA Phase 6. Features an open-plan kitchen, spacious living area, landscaped garden and covered parking for two cars. Walking distance to schools and parks.",
    type: "house",
    listing_type: "sale",
    condition: "new",
    price: 42000000,
    city: "Karachi",
    area: "DHA Phase 6",
    address: "Street 12, DHA Phase 6, Karachi",
    bedrooms: 3,
    bathrooms: 4,
    area_sqft: 2700,
    features: ["Garden", "Covered Parking", "Backup Generator", "Modular Kitchen"],
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994"],
    featured: true,
  },
  {
    title: "Luxury 2-Bed Apartment with Sea View",
    description:
      "High-rise 2-bedroom apartment with a stunning sea view, floor-to-ceiling windows, gym and rooftop pool access. Ideal for young professionals and small families.",
    type: "apartment",
    listing_type: "sale",
    condition: "new",
    price: 28500000,
    city: "Karachi",
    area: "Clifton Block 2",
    address: "Emerald Tower, Clifton Block 2, Karachi",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1450,
    features: ["Sea View", "Gym", "Swimming Pool", "24/7 Security", "Elevator"],
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    featured: true,
  },
  {
    title: "5-Bed Villa in Bahria Town",
    description:
      "Expansive 5-bedroom villa in a gated community with premium finishes, home theatre, double-height lounge and private lawn. Perfect for large families seeking luxury and security.",
    type: "villa",
    listing_type: "sale",
    condition: "under_construction",
    price: 95000000,
    city: "Lahore",
    area: "Bahria Town Sector C",
    address: "Sector C, Bahria Town, Lahore",
    bedrooms: 5,
    bathrooms: 6,
    area_sqft: 5400,
    features: ["Home Theatre", "Private Lawn", "Servant Quarter", "Smart Home", "Double Garage"],
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811"],
    featured: true,
  },
  {
    title: "Cozy 1-Bed Apartment for Rent",
    description:
      "Fully furnished 1-bedroom apartment available for rent in a prime location. Includes utilities, high-speed internet and access to community facilities.",
    type: "apartment",
    listing_type: "rent",
    condition: "renovated",
    price: 85000,
    city: "Islamabad",
    area: "F-11 Markaz",
    address: "F-11 Markaz, Islamabad",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 750,
    features: ["Furnished", "Internet Included", "Elevator", "Backup Power"],
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
    featured: false,
  },
  {
    title: "Commercial Office Space in Blue Area",
    description:
      "Grade-A commercial office space on a prime floor with panoramic city views, dedicated parking, and 24/7 building management. Ready for immediate possession.",
    type: "office",
    listing_type: "rent",
    condition: "new",
    price: 350000,
    city: "Islamabad",
    area: "Blue Area",
    address: "Jinnah Avenue, Blue Area, Islamabad",
    bedrooms: 0,
    bathrooms: 2,
    area_sqft: 2200,
    features: ["Central AC", "Dedicated Parking", "Conference Room", "Fibre Internet"],
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c"],
    featured: false,
  },
  {
    title: "Residential Plot in Gulberg Greens",
    description:
      "1 Kanal residential plot in a fast-developing sector. Clear documentation, wide roads, and close to the main boulevard. A great investment opportunity.",
    type: "plot",
    listing_type: "sale",
    condition: "new",
    price: 18000000,
    city: "Islamabad",
    area: "Gulberg Greens",
    address: "Block B, Gulberg Greens, Islamabad",
    bedrooms: 0,
    bathrooms: 0,
    area_sqft: 4500,
    features: ["Corner Plot", "Clear Title", "Wide Road"],
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef"],
    featured: false,
  },
  {
    title: "Elegant 4-Bed House in Model Town",
    description:
      "A well-maintained 4-bedroom house in the prestigious Model Town. Spacious rooms, a formal drawing room, and a large terrace overlooking a quiet street.",
    type: "house",
    listing_type: "sale",
    condition: "old",
    price: 61000000,
    city: "Lahore",
    area: "Model Town Block J",
    address: "Block J, Model Town, Lahore",
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 3600,
    features: ["Terrace", "Drawing Room", "Store Room", "Covered Parking"],
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
    featured: true,
  },
  {
    title: "Studio Apartment for Rent Near Uni",
    description:
      "Compact and affordable studio apartment ideal for students or single professionals. Close to universities and public transport.",
    type: "apartment",
    listing_type: "rent",
    condition: "old",
    price: 45000,
    city: "Karachi",
    area: "Gulshan-e-Iqbal",
    address: "Block 10, Gulshan-e-Iqbal, Karachi",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 500,
    features: ["Furnished", "Near University", "Security"],
    images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb"],
    featured: false,
  },
];

/**
 * Seeds the properties table with demo data only if it is empty.
 * Returns the number of inserted rows.
 */
export async function seedIfEmpty(): Promise<number> {
  const existing = await sql`SELECT COUNT(*)::int AS count FROM properties`;
  if (existing[0].count > 0) return 0;

  let inserted = 0;
  for (const p of SEED_PROPERTIES) {
    await sql`
      INSERT INTO properties
        (title, description, type, listing_type, condition, status, price, city, area, address,
         bedrooms, bathrooms, area_sqft, features, images, featured)
      VALUES
        (${p.title}, ${p.description}, ${p.type}, ${p.listing_type}, ${p.condition}, 'available', ${p.price},
         ${p.city}, ${p.area}, ${p.address}, ${p.bedrooms}, ${p.bathrooms}, ${p.area_sqft},
         ${JSON.stringify(p.features)}::jsonb, ${JSON.stringify(p.images)}::jsonb, ${p.featured})
    `;
    inserted++;
  }
  return inserted;
}
