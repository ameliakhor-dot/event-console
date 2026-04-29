"use client";

import { useEffect, useMemo, useState } from "react";
import { isFuture, isPast } from "date-fns";

import type { Event } from "@/types";
import { storage } from "@/lib/storage/local";
import { EventCard } from "@/components/events/event-card";
import { Input } from "@/components/ui/input";

type ActiveTab = "all" | "upcoming" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    storage.getEvents().then((allEvents) => {
      const sorted = [...allEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setEvents(sorted);
    });
  }, []);

  const cities = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.city.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [events],
  );

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const searchMatch =
        !searchTerm ||
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.hostName.toLowerCase().includes(searchTerm.toLowerCase());
      const cityMatch = cityFilter === "all" || event.city === cityFilter;
      const tabMatch =
        activeTab === "all" ||
        (activeTab === "upcoming" && !isPast(eventDate)) ||
        (activeTab === "past" && isPast(eventDate) && !isFuture(eventDate));

      return searchMatch && cityMatch && tabMatch;
    });
  }, [events, searchTerm, cityFilter, activeTab]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">Events</p>
          <h2 className="font-serif text-3xl text-ink">All events</h2>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs font-semibold tracking-[0.12em] text-graphite uppercase">Search</label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Name or host"
              className="w-56"
            />
          </div>
          <div>
            <label className="text-xs font-semibold tracking-[0.12em] text-graphite uppercase">City</label>
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
              className="h-10 w-44 border-b border-input bg-transparent text-sm outline-none focus:border-ring"
            >
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city} className="bg-surface">
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "upcoming", "past"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border px-3 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase ${
              activeTab === tab ? "border-border bg-surface text-ink" : "border-transparent text-graphite"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="border border-border bg-surface px-8 py-14 text-center">
          <h3 className="font-serif text-2xl text-ink">No events found.</h3>
          <p className="mt-2 text-sm text-graphite">Try changing search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
