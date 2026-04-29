"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { EventForm } from "@/components/events/event-form";
import { storage } from "@/lib/storage/local";
import type { Event } from "@/types";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!params.id) {
      return;
    }

    storage.getEvent(params.id).then(setEvent);
  }, [params.id]);

  const handleUpdate = async (draft: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    if (!params.id) {
      return;
    }

    await storage.updateEvent(params.id, draft);
    router.push(`/events/${params.id}`);
  };

  if (!event) {
    return (
      <div className="mx-auto w-full max-w-6xl border border-border bg-surface px-8 py-14 text-center">
        <h2 className="font-serif text-2xl text-ink">Loading event...</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">Edit event</p>
        <h2 className="font-serif text-3xl text-ink">{event.name}</h2>
      </div>
      <div className="border border-border bg-surface p-8">
        <EventForm
          mode="edit"
          initialEvent={event}
          submitLabel="Save changes"
          onSubmitEvent={handleUpdate}
          cancelHref={`/events/${params.id}`}
        />
      </div>
    </div>
  );
}
