"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Guests", slug: null },
  { label: "Briefing", slug: "briefing" },
  { label: "Seating", slug: "seating" },
  { label: "Nudges", slug: "nudges" },
  { label: "Run of Show", slug: "run-of-show" },
] as const;

interface Props {
  eventId: string;
}

export function EventTabs({ eventId }: Props) {
  const pathname = usePathname();

  return (
    <div className="border-b border-border">
      <div className="flex flex-wrap gap-0">
        {TABS.map((tab) => {
          const href = tab.slug
            ? `/events/${eventId}/${tab.slug}`
            : `/events/${eventId}`;
          const isActive = pathname === href;

          return (
            <Link
              key={tab.label}
              href={href}
              className={[
                "px-4 py-2.5 text-xs font-semibold tracking-[0.14em] uppercase transition-colors",
                isActive
                  ? "border-b-2 border-ink text-ink"
                  : "text-graphite hover:text-ink",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
