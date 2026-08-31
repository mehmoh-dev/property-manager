"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  PROPERTY_TYPES,
  typeLabel,
  PROPERTY_CONDITIONS,
  conditionLabel,
} from "@/lib/format";
import { SearchIcon, CloseIcon } from "@/components/icons";

export function PropertyFilters({ cities }: { cities: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [drawer, setDrawer] = useState(false);

  const [city, setCity] = useState(sp.get("city") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [listingType, setListingType] = useState(sp.get("listingType") ?? "");
  const [condition, setCondition] = useState(sp.get("condition") ?? "");
  const [minPrice, setMinPrice] = useState(sp.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(sp.get("maxPrice") ?? "");
  const [minBedrooms, setMinBedrooms] = useState(sp.get("minBedrooms") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "newest");

  const activeCount = [
    city,
    type,
    listingType,
    condition,
    minPrice,
    maxPrice,
    minBedrooms,
    q,
  ].filter(Boolean).length;

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (listingType) params.set("listingType", listingType);
    if (condition) params.set("condition", condition);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minBedrooms) params.set("minBedrooms", minBedrooms);
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/properties?${params.toString()}`);
    setDrawer(false);
  }

  function reset() {
    setCity("");
    setType("");
    setListingType("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setMinBedrooms("");
    setQ("");
    setSort("newest");
    router.push("/properties");
    setDrawer(false);
  }

  const panel = (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="field-label">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Keyword, area…"
          className="field"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">City</label>
        <input list="filter-cities" value={city} onChange={(e) => setCity(e.target.value)} className="field" placeholder="Any" />
        <datalist id="filter-cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="field">
            <option value="">Any</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{typeLabel(t)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Purpose</label>
          <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="field">
            <option value="">Any</option>
            <option value="sale">Buy</option>
            <option value="rent">Rent</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="field">
          <option value="">Any</option>
          {PROPERTY_CONDITIONS.map((c) => (
            <option key={c} value={c}>{conditionLabel(c)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Min price</label>
          <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="field" placeholder="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Max price</label>
          <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="field" placeholder="Any" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Min bedrooms</label>
        <select value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} className="field">
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="field-label">Sort by</label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={apply} className="btn btn-primary flex-1">
          <SearchIcon width={16} height={16} />
          Apply
        </button>
        <button onClick={reset} className="btn btn-outline">
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setDrawer(true)}
        className="btn btn-outline w-full lg:hidden"
      >
        <SearchIcon width={16} height={16} />
        Filters
        {activeCount > 0 && (
          <span className="badge bg-brand text-white">{activeCount}</span>
        )}
      </button>

      {/* Desktop panel */}
      <div className="card hidden p-4 lg:block">{panel}</div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-overlay absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <div className="animate-pop absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">Filters</h3>
              <button
                onClick={() => setDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100"
                aria-label="Close"
              >
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
