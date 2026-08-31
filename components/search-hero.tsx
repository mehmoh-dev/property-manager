"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PROPERTY_TYPES,
  typeLabel,
  PROPERTY_CONDITIONS,
  conditionLabel,
} from "@/lib/format";
import type { PropertyFilters } from "@/lib/types";
import { SearchIcon, SparkleIcon } from "@/components/icons";

export function SearchHero({ cities }: { cities: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [listingType, setListingType] = useState("");
  const [condition, setCondition] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  function search() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (listingType) params.set("listingType", listingType);
    if (condition) params.set("condition", condition);
    if (maxPrice) params.set("maxPrice", maxPrice);
    router.push(`/properties?${params.toString()}`);
  }

  async function aiSearch() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ai-search?q=${encodeURIComponent(aiQuery)}`);
      const data = await res.json();
      const f: PropertyFilters = data.filters ?? {};
      const params = new URLSearchParams();
      if (f.city) params.set("city", f.city);
      if (f.type) params.set("type", f.type);
      if (f.listingType) params.set("listingType", f.listingType);
      if (f.condition) params.set("condition", f.condition);
      if (f.minPrice) params.set("minPrice", String(f.minPrice));
      if (f.maxPrice) params.set("maxPrice", String(f.maxPrice));
      if (f.minBedrooms) params.set("minBedrooms", String(f.minBedrooms));
      if (f.q) params.set("q", f.q);
      router.push(`/properties?${params.toString()}`);
    } catch {
      router.push(`/properties?q=${encodeURIComponent(aiQuery)}`);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="card p-4 shadow-lg sm:p-5">
      {/* AI natural-language search */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
       <div className="relative flex-1">
  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand">
    <SparkleIcon width={18} height={18} />
  </span>
  <input
    value={aiQuery}
    onChange={(e) => setAiQuery(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && aiSearch()}
    placeholder="Describe your ideal home, e.g. '2-bed rental in Karachi under 1 lakh'"
    className="field py-3 pl-10 pr-3"
  />
</div>
        <button onClick={aiSearch} disabled={aiLoading} className="btn btn-ink py-3">
          {aiLoading ? "Thinking…" : "Search with AI"}
        </button>
      </div>

      <div className="my-3.5 flex items-center gap-3 text-xs font-medium text-slate-400">
        <span className="h-px flex-1 bg-line" />
        or refine by filters
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Structured filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Location</label>
          <input list="hero-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" className="field" />
          <datalist id="hero-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="field">
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{typeLabel(t)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Purpose</label>
          <select value={listingType} onChange={(e) => setListingType(e.target.value)} className="field">
            <option value="">Buy or Rent</option>
            <option value="sale">Buy</option>
            <option value="rent">Rent</option>
          </select>
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
        <div className="flex flex-col gap-1.5">
          <label className="field-label">Max budget</label>
          <input type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="PKR" className="field" />
        </div>
        <div className="flex items-end">
          <button onClick={search} className="btn btn-primary w-full">
            <SearchIcon width={18} height={18} />
            Search
          </button>
        </div>
      </div>

      <div className="mt-3.5 text-center">
        <button
          onClick={() => window.dispatchEvent(new Event("open-preferences"))}
          className="text-xs font-semibold text-muted underline decoration-dotted underline-offset-4 hover:text-brand"
        >
          Personalize my recommendations
        </button>
      </div>
    </div>
  );
}
