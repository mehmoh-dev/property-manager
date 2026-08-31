import { listFollowUps } from "@/lib/leads";
import { updateFollowUpStatusAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-200 text-slate-600",
};

export default async function AdminFollowUpsPage() {
  const followUps = await listFollowUps();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Follow-ups</h1>
        <p className="text-sm text-slate-500">
          Scheduled touchpoints with leads. Overdue items are highlighted.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {followUps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No follow-ups scheduled. Add one from the Leads page.
                </td>
              </tr>
            )}
            {followUps.map((f) => {
              const overdue = f.status === "pending" && f.due_date < today;
              return (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{f.lead_name}</p>
                    <p className="text-xs text-slate-500">
                      {f.lead_phone}
                      {f.lead_phone && f.lead_email ? " · " : ""}
                      {f.lead_email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={overdue ? "font-semibold text-red-600" : "text-slate-600"}>
                      {f.due_date}
                      {overdue ? " (overdue)" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{f.channel}</td>
                  <td className="px-4 py-3 text-slate-500">{f.note || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[f.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {f.status !== "done" && (
                        <form action={updateFollowUpStatusAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="status" value="done" />
                          <button className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                            Mark done
                          </button>
                        </form>
                      )}
                      {f.status === "pending" && (
                        <form action={updateFollowUpStatusAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <button className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
