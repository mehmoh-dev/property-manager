import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see env.local for the Neon connection string)."
  );
}

/**
 * Neon serverless SQL tag. Usage:
 *   const rows = await sql`SELECT * FROM properties WHERE id = ${id}`;
 * Values interpolated via the tag are sent as parameters, so this is safe
 * against SQL injection.
 */
export const sql = neon(connectionString);
