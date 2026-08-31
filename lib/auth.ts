import { cookies } from "next/headers";

const ADMIN_COOKIE = "pms_admin";

function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "admin123";
  // Simple deterministic token derived from the password. Good enough for a
  // hackathon; swap for real auth (NextAuth, etc.) before production.
  return Buffer.from(`admin:${pw}`).toString("base64");
}

/** Verifies a plaintext password against ADMIN_PASSWORD. */
export function checkPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD ?? "admin123");
}

/** Sets the admin auth cookie after a successful login. */
export async function signInAdmin(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function signOutAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** Returns true when the current request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === expectedToken();
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
