import Link from "next/link";
import { listProperties, listCities } from "@/lib/properties";
import { PropertyCard } from "@/components/property-card";
import { SearchHero } from "@/components/search-hero";
import { RecommendationsSection } from "@/components/recommendations-section";
import {
  SparkleIcon,
  SearchIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, cities, totalCount] = await Promise.all([
    listProperties({ featuredOnly: true, limit: 6 }),
    listCities(),
    listProperties({ limit: 500 }),
  ]);

  return (
    <div>
      {/* ---------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-ink">
        {/* Ambient shapes */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="container-app relative py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl animate-fade-up">
            <span className="badge bg-white/10 text-brand-soft">
              <SparkleIcon width={14} height={14} />
              AI-matched property discovery
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find a home that fits
              <span className="block text-brand"> your life and budget.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Tell us your budget and location. Our AI learns from what you view
              and surfaces better matches, then books your visit in seconds.
            </p>
          </div>

          <div className="mt-8 animate-fade-up sm:mt-10">
            <SearchHero cities={cities} />
          </div>

          {/* Trust stats */}
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:max-w-xl">
            <Stat value={`${totalCount.length}+`} label="Active listings" />
            <Stat value={`${cities.length}`} label="Cities covered" />
            <Stat value="24h" label="Avg. agent reply" />
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------ Recommendations */}
      <RecommendationsSection />

      {/* ------------------------------------------------------ Featured */}
      <section className="border-t border-line bg-surface">
        <div className="container-app py-14">
          <SectionHead
            eyebrow="Hand-picked"
            title="Featured properties"
            subtitle="A curated selection of standout homes from our agents."
            href="/properties"
          />
          {featured.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------- How it works */}
      <section id="how-it-works" className="container-app py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Simple by design</span>
          <h2 className="mt-2 text-3xl font-bold text-ink">How Estately works</h2>
          <p className="mt-3 text-muted">
            Three steps from browsing to booking a visit — with AI doing the heavy lifting.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <SearchIcon />,
              title: "Tell us what you want",
              body: "Set your budget, location, type and condition. Serious buyers get matched faster.",
            },
            {
              icon: <SparkleIcon />,
              title: "Get smarter matches",
              body: "As you browse, our AI recommends similar and better-fit properties automatically.",
            },
            {
              icon: <CalendarIcon />,
              title: "Book a visit",
              body: "Schedule with an agent in seconds. We handle the follow-up for you.",
            },
          ].map((s, i) => (
            <div key={s.title} className="card relative p-6">
              <span className="absolute right-5 top-5 text-5xl font-bold text-slate-100">
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                {s.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- CTA */}
      <section className="container-app pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
            Ready to find your next place?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-brand-soft">
            Browse verified listings and let our AI do the matching.
          </p>
          <Link href="/properties" className="btn relative mt-6 bg-white text-brand-dark hover:bg-slate-100">
            Explore all properties
            <ArrowRightIcon width={18} height={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-bold text-white sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-slate-400 sm:text-sm">{label}</dd>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  href,
  aiBadge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  href?: string;
  aiBadge?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <div className="mt-1 flex items-center gap-2.5">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
          {aiBadge && (
            <span className="badge bg-brand-soft text-brand-dark">
              <SparkleIcon width={13} height={13} />
              AI
            </span>
          )}
        </div>
        <p className="mt-2 max-w-lg text-sm text-muted">{subtitle}</p>
      </div>
      {href && (
        <Link
          href={href}
          className="hidden items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark sm:flex"
        >
          View all
          <ArrowRightIcon width={16} height={16} />
        </Link>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
      <p className="font-medium text-foreground">No properties yet.</p>
      <p className="mt-1 text-sm text-muted">
        Run the database setup, then add properties from the{" "}
        <Link href="/admin" className="font-medium text-brand underline">
          agent portal
        </Link>
        .
      </p>
    </div>
  );
}
