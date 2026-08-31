"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, CloseIcon, HomeIcon } from "@/components/icons";

const links = [
  { href: "/properties", label: "Buy" },
  { href: "/properties?listingType=rent", label: "Rent" },
  { href: "/#how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hide the public header inside the admin panel.
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isAdmin) return null;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled
          ? "border-line bg-surface/95 backdrop-blur"
          : "border-transparent bg-surface/80 backdrop-blur"
      }`}
    >
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <HomeIcon width={18} height={18} />
          </span>
          <span className="text-[1.15rem] font-bold tracking-tight text-ink">
            Estate<span className="text-brand">ly</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 transition-colors hover:bg-brand-soft hover:text-brand-dark"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/admin" className="btn btn-ink ml-2">
            Agent Portal
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-brand-soft md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-line bg-surface md:hidden">
          <nav className="container-app flex flex-col gap-1 py-3 text-sm font-medium">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-2.5 text-foreground hover:bg-brand-soft"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/admin" className="btn btn-ink mt-1 w-full">
              Agent Portal
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
