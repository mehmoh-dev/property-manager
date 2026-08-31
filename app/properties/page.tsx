import { listProperties, listCities } from "@/lib/properties";
import type { PropertyFilters } from "@/lib/types";
import { PropertyCard } from "@/components/property-card";
import { PropertyFilters as Filters } from "@/components/property-filters";

export const dynamic = "force-dynamic";

function toNum(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string" || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toStr(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function PropertiesPage({
  searchParams,
}: PageProps<"/properties">) {
  const sp = await searchParams;

  const filters: PropertyFilters = {
    q: toStr(sp.q),
    city: toStr(sp.city),
    type: toStr(sp.type) as PropertyFilters["type"],
    listingType: toStr(sp.listingType) as PropertyFilters["listingType"],
    condition: toStr(sp.condition) as PropertyFilters["condition"],
    minPrice: toNum(sp.minPrice),
    maxPrice: toNum(sp.maxPrice),
    minBedrooms: toNum(sp.minBedrooms),
    sort: (toStr(sp.sort) as PropertyFilters["sort"]) ?? "newest",
    limit: 60,
  };

  const [properties, cities] = await Promise.all([
    listProperties(filters),
    listCities(),
  ]);

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <span className="eyebrow">Browse</span>
        <h1 className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Properties</h1>
        <p className="mt-1 text-sm text-muted">
          {properties.length} propert{properties.length === 1 ? "y" : "ies"} found
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Filters cities={cities} />
        </aside>

        <div>
          {properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
              <p className="font-medium text-foreground">No matching properties</p>
              <p className="mt-1 text-sm text-muted">
                Try widening your search or resetting the filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
