"use client";

import { usePathname } from "next/navigation";

const getTitle = (pathname: string): string => {
  if (pathname === "/") {
    return "Dashboard";
  }
  if (pathname === "/events") {
    return "Events";
  }
  if (pathname === "/events/new") {
    return "New Event";
  }
  if (/^\/events\/[^/]+\/edit$/.test(pathname)) {
    return "Edit Event";
  }
  if (/^\/events\/[^/]+$/.test(pathname)) {
    return "Event Detail";
  }
  return "Event Console";
};

export function Topbar() {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">
          Operations Dashboard
        </p>
        <h1 className="font-serif text-xl text-ink">{getTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden text-xs text-graphite lg:block">
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          {" "}search
        </p>
        <p className="text-sm text-graphite">{today}</p>
      </div>
    </header>
  );
}
