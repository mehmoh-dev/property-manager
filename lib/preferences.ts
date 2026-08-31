import { cookies } from "next/headers";
import type { BuyerPreferences } from "./types";

const COOKIE = "pms_prefs";

/** Reads saved buyer preferences from the cookie (safe during render). */
export async function readPreferences(): Promise<BuyerPreferences | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BuyerPreferences;
  } catch {
    return null;
  }
}

/** Persists buyer preferences to the cookie. Call from a Route Handler/Action. */
export async function savePreferences(prefs: BuyerPreferences): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, JSON.stringify(prefs), {
    httpOnly: false, // readable client-side so the modal knows not to re-show
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export const PREFERENCES_COOKIE = COOKIE;
