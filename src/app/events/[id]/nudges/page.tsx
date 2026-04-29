"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { storage } from "@/lib/storage/local";
import type { Event, Nudge } from "@/types";
import { Button } from "@/components/ui/button";
import { NudgeVariants } from "@/components/nudges/nudge-variants";
import { TabProgressBar } from "@/components/shared/tab-progress-bar";
import { PageTitle } from "@/components/shared/page-title";

export default function NudgesPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [generating, setGenerating] = useState(false);
  // Track which guestIds are actively being generated (for per-row state)
  const [generatingIds, setGeneratingIds] = useState(new Set<string>());

  useEffect(() => {
    if (!params.id) return;
    storage.getEvent(params.id).then(setEvent);
  }, [params.id]);

  const pendingGuests = useMemo(
    () => event?.guests.filter((g) => g.status === "pending" || g.status === "tentative") ?? [],
    [event],
  );

  const generateForGuests = useCallback(
    async (guestIds: string[]) => {
      if (!event) return;
      const isAll = guestIds.length > 1;
      if (isAll) setGenerating(true);
      setGeneratingIds(new Set(guestIds));

      try {
        const guests = guestIds
          .map((id) => event.guests.find((g) => g.id === id))
          .filter(Boolean)
          .map((g) => ({
            id: g!.id,
            name: g!.name,
            company: g!.company,
            status: g!.status,
            notes: g!.notes,
          }));

        const res = await fetch("/api/claude/nudges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: {
              id: event.id,
              name: event.name,
              type: event.type,
              date: event.date,
              venueName: event.venueName,
              city: event.city,
              hostName: event.hostName,
              hostContext: event.hostContext,
            },
            guests,
          }),
        });

        const data = (await res.json()) as { nudges?: Nudge[]; error?: string };

        if (!res.ok || data.error || !data.nudges) {
          toast.error("Couldn't generate nudges. Try again.");
          return;
        }

        // Merge new nudges into existing, preserving any edits
        const updatedNudges = { ...event.nudges };
        for (const nudge of data.nudges) {
          updatedNudges[nudge.guestId] = {
            ...nudge,
            // Preserve any existing edits
            editedVariants: event.nudges[nudge.guestId]?.editedVariants,
          };
        }

        const updated = await storage.updateEvent(event.id, { nudges: updatedNudges });
        if (updated) {
          setEvent(updated);
          toast.success(
            isAll
              ? `Generated nudges for ${data.nudges.length} guest${data.nudges.length === 1 ? "" : "s"}.`
              : "Nudge generated.",
          );
        }
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setGenerating(false);
        setGeneratingIds(new Set());
      }
    },
    [event],
  );

  const handleUpdateNudge = useCallback(
    async (guestId: string, patch: Partial<Nudge>) => {
      if (!event) return;
      const existing = event.nudges[guestId];
      if (!existing) return;
      const updatedNudges = {
        ...event.nudges,
        [guestId]: { ...existing, ...patch },
      };
      const updated = await storage.updateEvent(event.id, { nudges: updatedNudges });
      if (updated) setEvent(updated);
    },
    [event],
  );

  if (!event) return null;

  // All guests have responded
  if (pendingGuests.length === 0) {
    return (
      <section className="border border-border bg-surface px-8 py-14 text-center">
        <PageTitle title={`${event.name} · Nudges — Event Console`} />
        <h3 className="font-serif text-2xl text-ink">All guests have responded.</h3>
        <p className="mt-2 text-sm text-graphite">Nothing to nudge.</p>
      </section>
    );
  }

  const allGenerated = pendingGuests.every((g) => event.nudges[g.id]);

  return (
    <div className="relative">
      <PageTitle title={`${event.name} · Nudges — Event Console`} />
      <TabProgressBar loading={generating} />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4 border border-border bg-surface px-6 py-4">
        <p className="text-sm text-graphite">
          {pendingGuests.length} pending or tentative guest{pendingGuests.length === 1 ? "" : "s"}
        </p>
        <Button
          size="sm"
          onClick={() => generateForGuests(pendingGuests.map((g) => g.id))}
          disabled={generating}
          variant={allGenerated ? "outline" : "default"}
        >
          {generating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Generating...
            </>
          ) : allGenerated ? (
            "Regenerate all"
          ) : (
            "Generate nudges for all"
          )}
        </Button>
      </div>

      {/* Guest list */}
      <div className="divide-y divide-border">
        {pendingGuests.map((guest) => (
          <NudgeVariants
            key={guest.id}
            guest={guest}
            nudge={event.nudges[guest.id] ?? null}
            onGenerate={(id) => generateForGuests([id])}
            onUpdate={handleUpdateNudge}
            generating={generatingIds.has(guest.id)}
          />
        ))}
      </div>
    </div>
  );
}
