import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin-nav";
import { HomeIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <HomeIcon width={16} height={16} />
            </span>
            <span className="font-bold tracking-tight text-ink">
              Estately <span className="font-medium text-muted">Agent</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/" className="btn btn-ghost hidden sm:inline-flex">
              View site
            </Link>
            <form action={logoutAction}>
              <button className="btn btn-outline">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="container-app py-6 lg:grid lg:grid-cols-[210px_1fr] lg:gap-8">
        <aside className="mb-5 lg:mb-0 lg:sticky lg:top-[72px] lg:self-start">
          <AdminNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
