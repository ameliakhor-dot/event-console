"use client";

import { usePathname } from "next/navigation";

const getTitle = (pathname: string): string => {
  if (pathname === "/events") {
    return "Events";
  }
  if (pathname === "/events/new") {
    return "New Event";
  }
  return "Dashboard";
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
      <p className="text-sm text-graphite">{today}</p>
    </header>
  );
}
