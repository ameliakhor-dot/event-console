"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, ClipboardList } from "lucide-react";

import { storage } from "@/lib/storage/local";
import type { Event, Guest } from "@/types";
import { Button } from "@/components/ui/button";
import { GuestTable } from "@/components/guests/guest-table";
import { RsvpPasteModal } from "@/components/guests/rsvp-paste-modal";
import { PageTitle } from "@/components/shared/page-title";

type ParsedGuest = Omit<Guest, "id" | "position">;

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    storage.getEvent(params.id).then(setEvent);
  }, [params.id]);

  const saveGuests = useCallback(
    async (guests: Guest[]) => {
      if (!event) return;
      const updated = await storage.updateEvent(event.id, { guests });
      if (updated) {
        setEvent(updated);
        window.dispatchEvent(
          new CustomEvent("event-console:guests-changed", {
            detail: { eventId: event.id },
          }),
        );
      }
    },
    [event],
  );

  const handleParsed = useCallback(
    (parsed: ParsedGuest[]) => {
      if (!event) return;

      const existing = [...event.guests];
      let added = 0;
      let updated = 0;

      for (const p of parsed) {
        const emailKey = p.email?.toLowerCase().trim();
        const nameKey = p.name.toLowerCase().trim();

        const matchIdx = existing.findIndex((g) => {
          if (emailKey && g.email?.toLowerCase().trim() === emailKey)
            return true;
          return g.name.toLowerCase().trim() === nameKey;
        });

        if (matchIdx !== -1) {
          const old = existing[matchIdx];
          const mergedNotes =
            old.notes && p.notes
              ? `${old.notes}; ${p.notes}`
              : p.notes || old.notes;
          existing[matchIdx] = {
            ...old,
            name: p.name,
            company: p.company,
            role: p.role,
            status: p.status,
            email: p.email ?? old.email,
            notes: mergedNotes,
          };
          updated++;
        } else {
          existing.push({
            ...p,
            id: crypto.randomUUID(),
            position: null,
          });
          added++;
        }
      }

      saveGuests(existing);
      setShowPasteModal(false);
      toast.success(`Added ${added}, updated ${updated}.`);
    },
    [event, saveGuests],
  );

  if (!event) return null;

  return (
    <section className="border border-border bg-surface p-6">
      <PageTitle title={`${event.name} · Guests — Event Console`} />
      {/* Action bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg text-ink">
            {event.guests.length === 0
              ? "No guests yet."
              : `${event.guests.length} guest${event.guests.length === 1 ? "" : "s"}`}
          </h3>
          {event.guests.length === 0 && (
            <p className="text-sm text-graphite">Paste your RSVPs or add someone manually.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAddingNew(true);
              setShowPasteModal(false);
            }}
          >
            <UserPlus className="size-3.5" />
            Add guest
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowPasteModal(true);
              setAddingNew(false);
            }}
          >
            <ClipboardList className="size-3.5" />
            Paste RSVPs
          </Button>
        </div>
      </div>

      <GuestTable
        guests={event.guests}
        onUpdate={saveGuests}
        addingNew={addingNew}
        onNewRowDone={() => setAddingNew(false)}
      />

      <RsvpPasteModal
        open={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onParsed={handleParsed}
      />
    </section>
  );
}
