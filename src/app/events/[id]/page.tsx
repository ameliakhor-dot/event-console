"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, Loader2, UserPlus, X } from "lucide-react";

import { storage } from "@/lib/storage/local";
import type { Event, Guest } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GuestTable } from "@/components/guests/guest-table";
import { PageTitle } from "@/components/shared/page-title";

type ParsedGuest = Omit<Guest, "id" | "position">;

export default function GuestsPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [addingNew, setAddingNew] = useState(false);

  // Inline paste panel state
  const [showPastePanel, setShowPastePanel] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

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
          if (emailKey && g.email?.toLowerCase().trim() === emailKey) return true;
          return g.name.toLowerCase().trim() === nameKey;
        });

        if (matchIdx !== -1) {
          const old = existing[matchIdx];
          const mergedNotes =
            old.notes && p.notes ? `${old.notes}; ${p.notes}` : p.notes || old.notes;
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
          existing.push({ ...p, id: crypto.randomUUID(), position: null });
          added++;
        }
      }

      saveGuests(existing);
      setShowPastePanel(false);
      setPasteText("");
      setParseError(null);
      toast.success(`Added ${added}, updated ${updated}.`);
    },
    [event, saveGuests],
  );

  async function handleParse() {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError(null);

    try {
      const res = await fetch("/api/claude/parse-rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });

      const data = (await res.json()) as { guests?: ParsedGuest[]; error?: string };

      if (!res.ok || data.error) {
        setParseError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (!data.guests?.length) {
        setParseError("No guests found in that text. Try pasting email replies or a name list.");
        return;
      }

      handleParsed(data.guests);
    } catch {
      setParseError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setParsing(false);
    }
  }

  function closePanel() {
    setShowPastePanel(false);
    setPasteText("");
    setParseError(null);
  }

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
          {event.guests.length === 0 && !showPastePanel && (
            <p className="text-sm text-graphite">Paste your RSVPs or add someone manually.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAddingNew(true);
              closePanel();
            }}
          >
            <UserPlus className="size-3.5" />
            Add guest
          </Button>
          {showPastePanel ? (
            <Button variant="outline" size="sm" onClick={closePanel}>
              <X className="size-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setShowPastePanel(true);
                setAddingNew(false);
              }}
            >
              <ClipboardList className="size-3.5" />
              Paste RSVPs
            </Button>
          )}
        </div>
      </div>

      {/* Inline paste panel */}
      {showPastePanel && (
        <div className="mb-6 border border-border bg-paper p-5 space-y-4">
          <h4 className="font-serif text-lg text-ink">Paste RSVPs</h4>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Sarah Chen — confirmed, vegetarian\nMike Torres (Acme) — tentative\njohn@example.com — declined`}
            className="field-sizing-fixed min-h-[300px] max-h-[500px] resize-y rounded-none border-border bg-surface font-mono text-sm"
            disabled={parsing}
            autoFocus
          />
          <p className="text-xs text-graphite">
            Paste in any format — email replies, spreadsheet rows, or notes. We'll parse it into a clean list.
          </p>
          {parseError && <p className="text-sm text-[#B33A2E]">{parseError}</p>}
          <div className="flex items-center gap-2">
            <Button onClick={handleParse} disabled={parsing || !pasteText.trim()} size="sm">
              {parsing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse RSVPs"
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={closePanel} disabled={parsing}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <GuestTable
        guests={event.guests}
        onUpdate={saveGuests}
        addingNew={addingNew}
        onNewRowDone={() => setAddingNew(false)}
      />
    </section>
  );
}
