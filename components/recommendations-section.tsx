"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { PropertyCard } from "@/components/property-card";
import { SparkleIcon, ArrowRightIcon } from "@/components/icons";

interface RecResponse {
  properties: Property[];
  basis: "ai" | "personalized" | "preferences" | "popular";
  reasons: Record<number, string>;
  poweredByAI: boolean;
}

/**
 * Loads personalized recommendations on the client so the homepage renders
 * instantly and any AI latency happens in the background (never blocks SSR).
 */
export function RecommendationsSection() {
  const [data, setData] = useState<RecResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/recommendations?limit=3")
      .then((r) => r.json())
      .then((d: RecResponse) => {
        if (alive) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Nothing to show once loaded and empty.
  if (!loading && (!data || data.properties.length === 0)) return null;

  const title = data?.basis === "popular" ? "Popular right now" : "Recommended for you";
  const subtitle =
    data?.basis === "ai"
      ? "Ranked by AI from your preferences and the homes you've viewed."
      : data?.basis === "personalized"
        ? "Based on the properties you've been viewing."
        : data?.basis === "preferences"
          ? "Based on the preferences you shared."
          : "Browse a few listings and we'll tailor these to you.";

  return (
    <section className="container-app py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">
            {data?.poweredByAI ? "Powered by Gemini" : "For you"}
          </span>
          <div className="mt-1 flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              {loading ? "Finding your matches…" : title}
            </h2>
            {data?.poweredByAI && (
              <span className="badge bg-brand-soft text-brand-dark">
                <SparkleIcon width={13} height={13} />
                AI
              </span>
            )}
          </div>
          <p className="mt-2 max-w-lg text-sm text-muted">
            {loading ? "Personalizing based on your activity." : subtitle}
          </p>
        </div>
        <Link
          href="/properties"
          className="hidden items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark sm:flex"
        >
          View all
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [0, 1, 2].map((i) => <CardSkeleton key={i} />)
          : data!.properties.map((p) => (
              <div key={p.id} className="flex flex-col gap-2.5">
                <PropertyCard property={p} />
                {data!.reasons[p.id] && (
                  <p className="flex gap-1.5 rounded-xl bg-brand-soft px-3 py-2 text-xs leading-relaxed text-brand-dark">
                    <SparkleIcon width={14} height={14} className="mt-0.5 shrink-0" />
                    <span>{data!.reasons[p.id]}</span>
                  </p>
                )}
              </div>
            ))}
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
