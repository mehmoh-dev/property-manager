import Link from "next/link";
import { notFound } from "next/navigation";
import { getProperty } from "@/lib/properties";
import { getSimilarProperties } from "@/lib/recommendations";
import {
  formatPrice,
  typeLabel,
  statusLabel,
  conditionLabel,
} from "@/lib/format";
import { PropertyCard } from "@/components/property-card";
import { ViewTracker } from "@/components/view-tracker";
import { VisitForm } from "@/components/visit-form";
import { PropertyGallery } from "@/components/property-gallery";
import {
  BedIcon,
  BathIcon,
  RulerIcon,
  PinIcon,
  TagIcon,
  CheckIcon,
  SparkleIcon,
  ShieldIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const property = await getProperty(Number(id));
  if (!property) notFound();

  const similar = await getSimilarProperties(property, 4);

  const facts = [
    { icon: <TagIcon width={18} height={18} />, label: "Type", value: typeLabel(property.type) },
    { icon: <BedIcon width={18} height={18} />, label: "Bedrooms", value: property.bedrooms || "—" },
    { icon: <BathIcon width={18} height={18} />, label: "Bathrooms", value: property.bathrooms || "—" },
    { icon: <RulerIcon width={18} height={18} />, label: "Area", value: property.area_sqft ? `${property.area_sqft} sqft` : "—" },
  ];

  return (
    <div className="container-app py-6 sm:py-8">
      <ViewTracker propertyId={property.id} />

      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/properties" className="hover:text-brand">
          Properties
        </Link>
        <span className="text-slate-300">/</span>
        <span className="truncate font-medium text-foreground">{property.title}</span>
      </nav>

      <PropertyGallery images={property.images} title={property.title} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-brand-soft text-brand-dark">
              {property.listing_type === "rent" ? "For Rent" : "For Sale"}
            </span>
            <span className="badge bg-slate-100 text-foreground">
              {conditionLabel(property.condition)}
            </span>
            <span className="badge bg-emerald-100 text-emerald-700">
              {statusLabel(property.status)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
            {property.title}
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-muted">
            <PinIcon width={16} height={16} className="text-slate-400" />
            {property.address || `${property.area}, ${property.city}`}
          </p>
          <p className="mt-4 text-3xl font-bold text-brand-dark">
            {formatPrice(property.price, property.listing_type)}
          </p>

          {/* Facts */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="card flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  {f.icon}
                </span>
                <div>
                  <p className="text-xs text-muted">{f.label}</p>
                  <p className="font-semibold text-ink">{f.value}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Description</h2>
            <p className="mt-2.5 whitespace-pre-line leading-relaxed text-foreground/80">
              {property.description || "No description provided."}
            </p>
          </section>

          {property.features.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-ink">Features & amenities</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {property.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <CheckIcon width={13} height={13} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-brand-soft/60 p-5">
              <h2 className="text-lg font-semibold text-ink">Schedule a visit</h2>
              <p className="mt-1 text-sm text-muted">
                Pick a date and an agent will confirm your appointment.
              </p>
            </div>
            <div className="p-5">
              <VisitForm propertyId={property.id} />
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
                <ShieldIcon width={14} height={14} className="text-brand" />
                Your details are only shared with our agents.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <SparkleIcon width={18} height={18} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink">Similar properties</h2>
              <p className="text-sm text-muted">
                Matched by type, location, price and size.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
