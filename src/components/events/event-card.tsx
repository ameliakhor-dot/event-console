import Link from "next/link";
import { format } from "date-fns";

import type { Event } from "@/types";
import { Button } from "@/components/ui/button";
import { HeadcountBar } from "@/components/events/headcount-bar";
import { StatusBadge } from "@/components/events/status-badge";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const confirmedCount = event.guests.filter((guest) => guest.status === "confirmed").length;

  return (
    <article className="border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-ink">{event.name}</h3>
          <p className="text-sm text-graphite">
            {format(new Date(event.date), "EEE, MMM d, yyyy • h:mm a")}
          </p>
          <p className="text-sm text-graphite">
            {event.venueName}, {event.city}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="mt-4">
        <HeadcountBar confirmedCount={confirmedCount} targetHeadcount={event.targetHeadcount} />
      </div>

      <div className="mt-5 flex justify-end">
        <Button asChild variant="outline">
          <Link href={`/events/${event.id}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}
