import { cookies } from "next/headers";

const COOKIE = "pms_sid";

/**
 * Returns the anonymous visitor session id, creating one if needed.
 * Used to attribute property views for personalized recommendations.
 * Safe to call in Server Components and Server Actions.
 */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  // May throw if called from a context that can't set cookies (e.g. during
  // render of a Server Component); callers handle that by reading only.
  try {
    store.set(COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180, // 180 days
    });
  } catch {
    /* read-only context */
  }
  return id;
}

/** Reads the session id without creating one (safe during render). */
export async function readSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export const SESSION_COOKIE = COOKIE;
