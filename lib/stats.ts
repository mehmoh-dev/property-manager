import { sql } from "./db";

export interface DashboardStats {
  totalProperties: number;
  availableProperties: number;
  totalLeads: number;
  qualifiedLeads: number;
  totalVisits: number;
  scheduledVisits: number;
  pendingFollowUps: number;
  totalViews: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [props, leads, visits, follow, views] = await Promise.all([
    sql`SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'available')::int AS available
        FROM properties`,
    sql`SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'qualified')::int AS qualified
        FROM leads`,
    sql`SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled
        FROM visits`,
    sql`SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
        FROM follow_ups`,
    sql`SELECT COUNT(*)::int AS total FROM property_views`,
  ]);

  return {
    totalProperties: Number(props[0].total),
    availableProperties: Number(props[0].available),
    totalLeads: Number(leads[0].total),
    qualifiedLeads: Number(leads[0].qualified),
    totalVisits: Number(visits[0].total),
    scheduledVisits: Number(visits[0].scheduled),
    pendingFollowUps: Number(follow[0].pending),
    totalViews: Number(views[0].total),
  };
}

/** Most-viewed properties, useful for spotting demand. */
export async function getMostViewed(limit = 5) {
  const rows = await sql`
    SELECT p.id, p.title, p.city, COUNT(v.id)::int AS views
    FROM properties p
    LEFT JOIN property_views v ON v.property_id = p.id
    GROUP BY p.id
    ORDER BY views DESC, p.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    city: String(r.city),
    views: Number(r.views),
  }));
}
