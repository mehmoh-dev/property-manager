"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/visits", label: "Visits" },
  { href: "/admin/follow-ups", label: "Follow-ups" },
  { href: "/admin/export", label: "Chatbot & Export" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="card flex gap-1 overflow-x-auto p-1.5 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:bg-brand-soft hover:text-brand-dark"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
