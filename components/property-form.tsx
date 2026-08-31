import Link from "next/link";
import type { Property } from "@/lib/types";
import {
  PROPERTY_TYPES,
  typeLabel,
  PROPERTY_CONDITIONS,
  conditionLabel,
} from "@/lib/format";

const LISTING_TYPES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];
const STATUSES = [
  { value: "available", label: "Available" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
];

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand";
const label = "text-sm font-medium text-slate-700";

/**
 * Shared create/edit form. `action` is a bound server action.
 * When `property` is provided the fields are pre-filled for editing.
 */
export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  property?: Property;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Basic details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={label}>Title *</label>
            <input name="title" required defaultValue={property?.title} className={field} placeholder="e.g. Modern 3-Bed House in DHA" />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea name="description" rows={4} defaultValue={property?.description} className={field} placeholder="Describe the property..." />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className={label}>Type</label>
              <select name="type" defaultValue={property?.type ?? "house"} className={field}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{typeLabel(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Purpose</label>
              <select name="listing_type" defaultValue={property?.listing_type ?? "sale"} className={field}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Condition</label>
              <select name="condition" defaultValue={property?.condition ?? "new"} className={field}>
                {PROPERTY_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{conditionLabel(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select name="status" defaultValue={property?.status ?? "available"} className={field}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Price (PKR)</label>
            <input name="price" type="number" min={0} defaultValue={property?.price} className={field} placeholder="e.g. 25000000" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Location & specs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>City</label>
            <input name="city" defaultValue={property?.city} className={field} placeholder="e.g. Karachi" />
          </div>
          <div>
            <label className={label}>Area / Locality</label>
            <input name="area" defaultValue={property?.area} className={field} placeholder="e.g. DHA Phase 6" />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Full address</label>
            <input name="address" defaultValue={property?.address} className={field} placeholder="Street, block, city" />
          </div>
          <div className="grid grid-cols-3 gap-4 sm:col-span-2">
            <div>
              <label className={label}>Bedrooms</label>
              <input name="bedrooms" type="number" min={0} defaultValue={property?.bedrooms} className={field} />
            </div>
            <div>
              <label className={label}>Bathrooms</label>
              <input name="bathrooms" type="number" min={0} defaultValue={property?.bathrooms} className={field} />
            </div>
            <div>
              <label className={label}>Area (sqft)</label>
              <input name="area_sqft" type="number" min={0} defaultValue={property?.area_sqft} className={field} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Media & features</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Image URLs</label>
            <textarea name="images" rows={3} defaultValue={property?.images.join("\n")} className={field} placeholder="One URL per line (or comma-separated)" />
            <p className="mt-1 text-xs text-slate-400">Paste direct image links. First image is used as the cover.</p>
          </div>
          <div>
            <label className={label}>Features</label>
            <textarea name="features" rows={2} defaultValue={property?.features.join(", ")} className={field} placeholder="Comma-separated, e.g. Garden, Garage, Backup Power" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="featured" defaultChecked={property?.featured} className="h-4 w-4 rounded border-slate-300" />
            Mark as featured (shown on homepage)
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          {submitLabel}
        </button>
        <Link href="/admin/properties" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
