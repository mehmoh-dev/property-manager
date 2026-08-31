import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loginAction } from "@/app/admin/actions";
import { HomeIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const sp = await searchParams;
  const hasError = sp.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      <div className="card animate-pop relative w-full max-w-md p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
            <HomeIcon width={18} height={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">
            Estately <span className="font-medium text-muted">Agent</span>
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to manage properties, leads and visits.
        </p>

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="field-label">Password</label>
            <input type="password" name="password" required autoFocus className="field mt-1.5" />
          </div>
          {hasError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              Incorrect password. Please try again.
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Password is set via <code>ADMIN_PASSWORD</code> in .env.local.
        </p>
      </div>
    </div>
  );
}
