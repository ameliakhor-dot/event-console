"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Pencil } from "lucide-react";

import { storage } from "@/lib/storage/local";
import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { HeadcountBar } from "@/components/events/headcount-bar";

const tabs = ["Guests", "Briefing", "Seating", "Nudges", "Run of Show"];

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    storage.getEvent(params.id).then(setEvent);
  }, [params.id]);

  const counts = useMemo(() => {
    const guests = event?.guests ?? [];
    return {
      confirmed: guests.filter((guest) => guest.status === "confirmed").length,
      pending: guests.filter((guest) => guest.status === "pending").length,
      declined: guests.filter((guest) => guest.status === "declined").length,
    };
  }, [event]);

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-6xl border border-border bg-surface px-8 py-14 text-center">
        <h2 className="font-serif text-2xl text-ink">Event not found.</h2>
        <p className="mt-2 text-sm text-graphite">Try opening the event from the events list.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">{event.type}</p>
            <h2 className="font-serif text-3xl text-ink">{event.name}</h2>
            <p className="mt-1 text-sm text-graphite">
              {format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")} • {event.venueName}, {event.city}
            </p>
            <p className="text-sm text-graphite">Host: {event.hostName}</p>
          </div>
          <Button asChild variant="outline" size="icon-sm">
            <Link href={`/events/${event.id}/edit`} aria-label="Edit event">
              <Pencil className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm text-graphite">
            {counts.confirmed} confirmed • {counts.pending} pending • {counts.declined} declined
          </p>
          <HeadcountBar confirmedCount={counts.confirmed} targetHeadcount={event.targetHeadcount} />
        </div>
      </header>

      <div className="border-b border-border pb-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <span key={tab} className={`px-3 py-1 text-xs font-semibold tracking-[0.14em] uppercase ${tab === "Guests" ? "border border-border bg-surface text-ink" : "text-graphite"}`}>
              {tab}
            </span>
          ))}
        </div>
      </div>

      <section className="border border-border bg-surface px-8 py-14 text-center">
        <h3 className="font-serif text-2xl text-ink">Guests tab is next.</h3>
        <p className="mt-2 text-sm text-graphite">Phase 3 adds RSVP parsing and the guest table.</p>
      </section>
    </div>
  );
}
