import Link from "next/link";
import { listLeads } from "@/lib/leads";
import type { LeadStatus } from "@/lib/types";
import { formatPrice, typeLabel } from "@/lib/format";
import {
  updateLeadStatusAction,
  createFollowUpAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  qualified: "bg-emerald-100 text-emerald-700",
  new: "bg-sky-100 text-sky-700",
  unqualified: "bg-slate-200 text-slate-600",
  converted: "bg-violet-100 text-violet-700",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "qualified", label: "Qualified" },
  { value: "new", label: "New" },
  { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
];

export default async function AdminLeadsPage({
  searchParams,
}: PageProps<"/admin/leads">) {
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "") as LeadStatus | "";
  const leads = await listLeads(status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500">
          Buyers are auto-scored. Qualified leads (score ≥ 60) are serious buyers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/leads?status=${f.value}` : "/admin/leads"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === f.value
                ? "bg-brand text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {leads.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No leads yet.
          </div>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {lead.name || "Unnamed lead"}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[lead.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.phone && lead.email ? " · " : ""}
                  {lead.email && <span>{lead.email}</span>}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {(lead.budget_min || lead.budget_max) && (
                    <span className="mr-3">
                      Budget:{" "}
                      {lead.budget_min ? formatPrice(lead.budget_min) : "—"} –{" "}
                      {lead.budget_max ? formatPrice(lead.budget_max) : "—"}
                    </span>
                  )}
                  {lead.preferred_city && (
                    <span className="mr-3">City: {lead.preferred_city}</span>
                  )}
                  {lead.preferred_type && (
                    <span>Type: {typeLabel(lead.preferred_type)}</span>
                  )}
                </p>
                {lead.notes && (
                  <p className="mt-2 text-sm text-slate-500">“{lead.notes}”</p>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Lead score</div>
                <div
                  className={`text-2xl font-bold ${
                    lead.score >= 60
                      ? "text-emerald-600"
                      : lead.score >= 30
                        ? "text-amber-600"
                        : "text-slate-400"
                  }`}
                >
                  {lead.score}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-slate-100 pt-4">
              <form action={updateLeadStatusAction} className="flex items-end gap-2">
                <input type="hidden" name="id" value={lead.id} />
                <div>
                  <label className="text-xs text-slate-400">Set status</label>
                  <select
                    name="status"
                    defaultValue={lead.status}
                    className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
                <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                  Update
                </button>
              </form>

              <form
                action={createFollowUpAction}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="lead_id" value={lead.id} />
                <div>
                  <label className="text-xs text-slate-400">Follow-up date</label>
                  <input
                    type="date"
                    name="due_date"
                    required
                    className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Channel</label>
                  <select
                    name="channel"
                    className="block rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    <option value="call">Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <button className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-teal-50">
                  Schedule follow-up
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
