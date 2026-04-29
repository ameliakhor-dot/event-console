"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/events/new", label: "New Event" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface px-5 py-8">
      <p className="mb-8 font-serif text-xl text-ink">Event Console</p>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block border border-transparent px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                active
                  ? "border-border bg-paper text-ink"
                  : "text-graphite hover:border-border hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
