"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "@/components/icons";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 bg-ink text-slate-300">
      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
              <HomeIcon width={18} height={18} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Estate<span className="text-brand">ly</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Smarter property discovery. AI-matched listings, verified details and
            effortless visit scheduling.
          </p>
        </div>

        <FooterCol
          title="Explore"
          items={[
            { label: "All properties", href: "/properties" },
            { label: "For sale", href: "/properties?listingType=sale" },
            { label: "For rent", href: "/properties?listingType=rent" },
            { label: "How it works", href: "/#how-it-works" },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { label: "About us", href: "/#how-it-works" },
            { label: "Agent portal", href: "/admin" },
            { label: "Contact", href: "/properties" },
          ]}
        />
        <div>
          <h4 className="text-sm font-semibold text-white">Get in touch</h4>
          <p className="mt-4 text-sm text-slate-400">
            Have a question about a listing? Our agents typically respond within a
            few hours.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Estately. All rights reserved.</p>
          <p>AI recommendations · Verified listings · Visit scheduling</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            <Link href={i.href} className="text-slate-400 transition-colors hover:text-white">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
