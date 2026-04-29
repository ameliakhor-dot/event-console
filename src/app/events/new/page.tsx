"use client";

import { useRouter } from "next/navigation";

import { EventForm } from "@/components/events/event-form";
import { storage } from "@/lib/storage/local";
import { PageTitle } from "@/components/shared/page-title";
import type { Event } from "@/types";

export default function NewEventPage() {
  const router = useRouter();

  const handleCreate = async (draft: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
    const created = await storage.createEvent(draft);
    router.push(`/events/${created.id}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageTitle title="New Event — Event Console" />
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-graphite uppercase">Create event</p>
        <h2 className="font-serif text-3xl text-ink">New event</h2>
      </div>
      <div className="border border-border bg-surface p-8">
        <EventForm mode="create" submitLabel="Create event" onSubmitEvent={handleCreate} />
      </div>
    </div>
  );
}
