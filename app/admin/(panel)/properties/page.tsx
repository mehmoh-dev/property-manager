import Link from "next/link";
import { listProperties } from "@/lib/properties";
import { formatPrice, typeLabel, statusLabel, conditionLabel, listingTypeLabel } from "@/lib/format";
import { deletePropertyAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const properties = await listProperties({ limit: 200 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Properties</h1>
          <p className="text-sm text-slate-500">{properties.length} total</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Add property
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No properties yet. Add your first one.
                </td>
              </tr>
            )}
            {properties.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/properties/${p.id}`} className="hover:text-brand">
                    {p.title}
                  </Link>
                  {p.featured && (
                    <span className="ml-2 rounded bg-teal-100 px-1.5 py-0.5 text-xs text-teal-700">
                      Featured
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {typeLabel(p.type)}
                  <span className="block text-xs text-slate-400">
                    {listingTypeLabel(p.listing_type)} · {conditionLabel(p.condition)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.area}
                  {p.area && p.city ? ", " : ""}
                  {p.city}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatPrice(p.price, p.listing_type)}
                </td>
                <td className="px-4 py-3 text-slate-600">{statusLabel(p.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/properties/${p.id}/edit`}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </Link>
                    <form action={deletePropertyAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
