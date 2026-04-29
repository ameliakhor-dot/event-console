"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil } from "lucide-react";

import { storage } from "@/lib/storage/local";
import type { Event as AppEvent } from "@/types";
import { Button } from "@/components/ui/button";
import { HeadcountBar } from "@/components/events/headcount-bar";
import { EventTabs } from "@/components/events/event-tabs";

interface Props {
  eventId: string;
}

export function EventDetailHeader({ eventId }: Props) {
  const [event, setEvent] = useState<AppEvent | null | undefined>(undefined);

  const load = useCallback(() => {
    storage.getEvent(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    load();

    const handler = (e: CustomEvent<{ eventId: string }>) => {
      if (e.detail?.eventId === eventId) load();
    };

    window.addEventListener(
      "event-console:guests-changed",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "event-console:guests-changed",
        handler as EventListener,
      );
  }, [load, eventId]);

  const counts = useMemo(() => {
    const guests = event?.guests ?? [];
    return {
      confirmed: guests.filter((g) => g.status === "confirmed").length,
      pending: guests.filter((g) => g.status === "pending").length,
      declined: guests.filter((g) => g.status === "declined").length,
    };
  }, [event]);

  // undefined = still loading, null = not found
  if (event === undefined) return null;

  if (event === null) {
    return (
      <div className="border border-border bg-surface px-8 py-14 text-center">
        <h2 className="font-serif text-2xl text-ink">Event not found.</h2>
        <p className="mt-2 text-sm text-graphite">
          Try opening the event from the events list.
        </p>
      </div>
    );
  }

  return (
    <div data-no-print>
      <header className="border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-graphite">
              {event.type}
            </p>
            <h2 className="font-serif text-3xl text-ink">{event.name}</h2>
            <p className="mt-1 text-sm text-graphite">
              {format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")} •{" "}
              {event.venueName}, {event.city}
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
            {counts.confirmed} confirmed • {counts.pending} pending •{" "}
            {counts.declined} declined
          </p>
          <HeadcountBar
            confirmedCount={counts.confirmed}
            targetHeadcount={event.targetHeadcount}
          />
        </div>
      </header>

      <EventTabs eventId={eventId} />
    </div>
  );
}
