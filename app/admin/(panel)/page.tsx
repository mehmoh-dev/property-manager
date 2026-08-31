import Link from "next/link";
import { getDashboardStats, getMostViewed } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, mostViewed] = await Promise.all([
    getDashboardStats(),
    getMostViewed(5),
  ]);

  const cards = [
    { label: "Properties", value: stats.totalProperties, sub: `${stats.availableProperties} available`, href: "/admin/properties" },
    { label: "Leads", value: stats.totalLeads, sub: `${stats.qualifiedLeads} qualified`, href: "/admin/leads" },
    { label: "Visits", value: stats.totalVisits, sub: `${stats.scheduledVisits} scheduled`, href: "/admin/visits" },
    { label: "Follow-ups", value: stats.pendingFollowUps, sub: "pending", href: "/admin/follow-ups" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="mt-1 text-2xl font-bold text-ink">Dashboard</h1>
        </div>
        <Link href="/admin/properties/new" className="btn btn-primary">
          + Add property
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-ink">{c.value}</p>
            <p className="text-xs text-slate-400">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-ink">Most viewed properties</h2>
          <p className="text-xs text-muted">
            Total tracked views: {stats.totalViews}
          </p>
          <ul className="mt-4 divide-y divide-line">
            {mostViewed.length === 0 && (
              <li className="py-3 text-sm text-muted">No views yet.</li>
            )}
            {mostViewed.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/properties/${p.id}`} className="truncate text-sm text-foreground hover:text-brand">
                  {p.title} <span className="text-slate-400">· {p.city}</span>
                </Link>
                <span className="badge shrink-0 bg-slate-100 text-muted">
                  {p.views} views
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Quick actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickLink href="/admin/properties/new" label="Add a property" />
            <QuickLink href="/admin/leads?status=qualified" label="View qualified leads" />
            <QuickLink href="/admin/visits" label="Manage visits" />
            <QuickLink href="/admin/export" label="Export for chatbot" />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line px-4 py-3 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand"
    >
      {label}
    </Link>
  );
}
