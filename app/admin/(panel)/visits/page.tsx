import Link from "next/link";
import { listVisits } from "@/lib/leads";
import { updateVisitStatusAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-slate-200 text-slate-600",
};

export default async function AdminVisitsPage() {
  const visits = await listVisits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Visit requests</h1>
        <p className="text-sm text-slate-500">{visits.length} total</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Visitor</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Set status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No visit requests yet.
                </td>
              </tr>
            )}
            {visits.map((v) => (
              <tr key={v.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{v.name}</p>
                  <p className="text-xs text-slate-500">{v.phone}</p>
                  {v.email && <p className="text-xs text-slate-500">{v.email}</p>}
                  {v.notes && (
                    <p className="mt-1 text-xs text-slate-400">“{v.notes}”</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/properties/${v.property_id}`}
                    className="text-slate-700 hover:text-brand"
                  >
                    {v.property_title}
                  </Link>
                  <p className="text-xs text-slate-500">{v.property_city}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {v.visit_date}
                  {v.visit_time ? ` · ${v.visit_time}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[v.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateVisitStatusAction}
                    className="flex items-center justify-end gap-2"
                  >
                    <input type="hidden" name="id" value={v.id} />
                    <select
                      name="status"
                      defaultValue={v.status}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No show</option>
                    </select>
                    <button className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700">
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
