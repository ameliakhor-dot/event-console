"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addDays, differenceInHours, endOfWeek, format, isAfter, isBefore, startOfWeek } from "date-fns";

import type { Event } from "@/types";
import { storage } from "@/lib/storage/local";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { HeadcountBar } from "@/components/events/headcount-bar";
import { PageTitle } from "@/components/shared/page-title";

const byDateAsc = (a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime();

const getOnFireReason = (event: Event, now: Date): string | null => {
  const eventDate = new Date(event.date);
  const withinWeek = isAfter(eventDate, now) && isBefore(eventDate, addDays(now, 7));

  if (!withinWeek) {
    return null;
  }

  const confirmedCount = event.guests.filter((guest) => guest.status === "confirmed").length;
  if (confirmedCount < event.targetHeadcount * 0.8) {
    return `${confirmedCount} of ${event.targetHeadcount} confirmed, host expects update.`;
  }

  if (!event.briefingCard && differenceInHours(eventDate, now) < 48) {
    return "Briefing card still missing under 48 hours out.";
  }

  if (!event.seatingChart?.activeOptionIndex && differenceInHours(eventDate, now) < 24) {
    return "Seating chart isn't finalized and you're under 24 hours.";
  }

  return null;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    storage.getEvents().then((value) => setEvents([...value].sort(byDateAsc)));
  }, []);

  const now = useMemo(() => new Date(), []);
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const onFireEvents = useMemo(
    () =>
      events
        .map((event) => ({ event, reason: getOnFireReason(event, now) }))
        .filter((value): value is { event: Event; reason: string } => Boolean(value.reason)),
    [events, now],
  );

  const thisWeekEvents = useMemo(
    () =>
      events.filter((event) => {
        const date = new Date(event.date);
        return isAfter(date, thisWeekStart) && isBefore(date, thisWeekEnd);
      }),
    [events, thisWeekStart, thisWeekEnd],
  );

  const futureEvents = useMemo(
    () => events.filter((event) => isAfter(new Date(event.date), addDays(now, 14))),
    [events, now],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <PageTitle title="Dashboard — Event Console" />
      {events.length === 0 ? (
        <EmptyState
          title="No events yet."
          description="Let's start with one."
          actionLabel="Create your first event"
          actionHref="/events/new"
        />
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">On fire today</p>
          <h2 className="font-serif text-2xl text-ink">Needs your attention</h2>
        </div>
        {onFireEvents.length === 0 ? (
          <EmptyState
            title="Nothing on fire today."
            description="When events need attention, they'll show up here."
          />
        ) : (
          <div className="space-y-3">
            {onFireEvents.map(({ event, reason }) => (
              <article
                key={event.id}
                className="border border-fire/30 bg-surface p-5 shadow-[0_4px_14px_rgba(179,58,46,0.12)]"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-fire uppercase">On fire today</p>
                <h3 className="mt-2 font-serif text-xl text-ink">{event.name}</h3>
                <p className="text-sm text-graphite">{reason}</p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href={`/events/${event.id}`}>Open event</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">This week</p>
          <h2 className="font-serif text-2xl text-ink">Upcoming in the next seven days</h2>
        </div>
        {thisWeekEvents.length === 0 ? (
          <EmptyState title="No events this week." description="Create an event and it'll show up here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {thisWeekEvents.map((event) => {
              const confirmed = event.guests.filter((guest) => guest.status === "confirmed").length;
              return (
                <article key={event.id} className="border border-border bg-surface p-5">
                  <h3 className="font-serif text-xl text-ink">{event.name}</h3>
                  <p className="text-sm text-graphite">
                    {format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")}
                  </p>
                  <p className="text-sm text-graphite">
                    {event.venueName}, {event.city}
                  </p>
                  <div className="mt-4">
                    <HeadcountBar confirmedCount={confirmed} targetHeadcount={event.targetHeadcount} />
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href={`/events/${event.id}`}>Open</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">Future</p>
          <h2 className="font-serif text-2xl text-ink">Two weeks out and beyond</h2>
        </div>
        {futureEvents.length === 0 ? (
          <EmptyState
            title="Nothing in the future yet."
            description="Future events will appear once they're scheduled."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {futureEvents.map((event) => (
              <article key={event.id} className="border border-border bg-surface p-4">
                <h3 className="font-serif text-lg text-ink">{event.name}</h3>
                <p className="text-sm text-graphite">{format(new Date(event.date), "MMM d, yyyy • h:mm a")}</p>
                <p className="text-sm text-graphite">{event.city}</p>
                <Link href={`/events/${event.id}`} className="mt-3 inline-block text-xs tracking-[0.14em] uppercase text-navy">
                  Open
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
