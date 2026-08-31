import Link from "next/link";
import type { Property } from "@/lib/types";
import {
  formatPrice,
  typeLabel,
  statusLabel,
  conditionLabel,
} from "@/lib/format";
import { BedIcon, BathIcon, RulerIcon, PinIcon } from "@/components/icons";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  under_offer: "bg-amber-100 text-amber-700",
  sold: "bg-slate-200 text-slate-600",
  rented: "bg-slate-200 text-slate-600",
};

export function PropertyCard({ property }: { property: Property }) {
  const img = property.images[0];
  const isInactive = property.status === "sold" || property.status === "rented";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="card group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            No image
          </div>
        )}

        {/* gradient for label legibility */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="badge bg-white/95 text-ink shadow-sm">
            {property.listing_type === "rent" ? "For Rent" : "For Sale"}
          </span>
          {property.featured && (
            <span className="badge bg-accent text-white shadow-sm">Featured</span>
          )}
        </div>

        {isInactive && (
          <span
            className={`badge absolute right-3 top-3 shadow-sm ${
              statusStyles[property.status] ?? "bg-slate-200 text-slate-600"
            }`}
          >
            {statusLabel(property.status)}
          </span>
        )}

        {/* Price chip */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-brand-dark shadow-sm backdrop-blur">
            {formatPrice(property.price, property.listing_type)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-brand-dark">
            {typeLabel(property.type)}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5">
            {conditionLabel(property.condition)}
          </span>
        </div>

        <h3 className="line-clamp-2 font-semibold leading-snug text-ink">
          {property.title}
        </h3>

        <p className="flex items-center gap-1 text-sm text-muted">
          <PinIcon width={15} height={15} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {[property.area, property.city].filter(Boolean).join(", ")}
          </span>
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-line pt-3 text-sm text-foreground">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BedIcon width={17} height={17} className="text-brand" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1.5">
              <BathIcon width={17} height={17} className="text-brand" />
              {property.bathrooms}
            </span>
          )}
          {property.area_sqft > 0 && (
            <span className="flex items-center gap-1.5">
              <RulerIcon width={17} height={17} className="text-brand" />
              {property.area_sqft} sqft
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
