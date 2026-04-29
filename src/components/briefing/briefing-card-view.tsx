"use client";

import { useState } from "react";
import { format } from "date-fns";

import type { BriefingCard, BriefingCardGuest, Event as AppEvent } from "@/types";

// ── Editable field ─────────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

function EditableField({ label, value, onSave, placeholder = "—" }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <p className="mb-1 font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-graphite">
        {label}
      </p>
      {editing ? (
        <input
          autoFocus
          defaultValue={value}
          onBlur={(e) => {
            onSave(e.target.value.trim());
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(false);
            } else if (e.key === "Enter") {
              onSave((e.target as HTMLInputElement).value.trim());
              setEditing(false);
            }
          }}
          className="w-full border-b border-ink bg-transparent py-0.5 font-sans text-sm text-ink outline-none"
        />
      ) : (
        <p
          className="cursor-text py-0.5 font-sans text-sm text-ink"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {value || <span className="text-graphite/40">{placeholder}</span>}
        </p>
      )}
    </div>
  );
}

// ── Guest card ────────────────────────────────────────────────────────────

interface GuestCardProps {
  guest: BriefingCardGuest;
  onUpdate: (updated: BriefingCardGuest) => void;
}

function GuestCard({ guest, onUpdate }: GuestCardProps) {
  function save(field: "bioLine" | "workingOn" | "askThemAbout", value: string) {
    onUpdate({ ...guest, [field]: value });
  }

  return (
    <div className="briefing-guest-card space-y-4 border border-border bg-white p-5">
      <div>
        <h3 className="font-serif text-xl text-ink">{guest.name}</h3>
        {(guest.role || guest.company) && (
          <p className="mt-0.5 font-sans text-xs text-graphite">
            {[guest.role, guest.company].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <EditableField
        label="Background"
        value={guest.bioLine}
        onSave={(v) => save("bioLine", v)}
      />
      <EditableField
        label="Working on"
        value={guest.workingOn}
        onSave={(v) => save("workingOn", v)}
      />
      <EditableField
        label="Ask them about"
        value={guest.askThemAbout}
        onSave={(v) => save("askThemAbout", v)}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface Props {
  card: BriefingCard;
  event: AppEvent;
  onUpdate: (card: BriefingCard) => void;
}

export function BriefingCardView({ card, event, onUpdate }: Props) {
  const [editingSummary, setEditingSummary] = useState(false);

  function saveSummary(value: string) {
    onUpdate({ ...card, eventSummary: value });
    setEditingSummary(false);
  }

  function saveGuestField(guestId: string, updated: BriefingCardGuest) {
    onUpdate({
      ...card,
      guests: card.guests.map((g) => (g.guestId === guestId ? updated : g)),
    });
  }

  return (
    <div className="bg-white border border-border">
      {/* ── Card header ── */}
      <div className="border-b border-border p-8">
        <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-graphite">
          {event.type} · Host briefing
        </p>
        <h1 className="mt-1 font-serif text-4xl text-ink">{event.name}</h1>
        <p className="mt-2 font-sans text-sm text-graphite">
          {format(new Date(event.date), "EEEE, MMMM d, yyyy · h:mm a")} ·{" "}
          {event.venueName}, {event.city}
        </p>
        <p className="font-sans text-sm text-graphite">Host: {event.hostName}</p>

        <div className="mt-5">
          <p className="mb-1 font-sans text-[10px] font-semibold tracking-[0.14em] uppercase text-graphite">
            Dinner summary
          </p>
          {editingSummary ? (
            <input
              autoFocus
              defaultValue={card.eventSummary}
              onBlur={(e) => saveSummary(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingSummary(false);
                else if (e.key === "Enter")
                  saveSummary((e.target as HTMLInputElement).value.trim());
              }}
              className="w-full border-b border-ink bg-transparent py-0.5 font-sans text-sm text-ink outline-none"
            />
          ) : (
            <p
              className="cursor-text py-0.5 font-sans text-sm text-ink"
              onClick={() => setEditingSummary(true)}
              title="Click to edit"
            >
              {card.eventSummary || (
                <span className="text-graphite/40">Click to add summary</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ── Guest grid ── */}
      <div className="p-8">
        <div className="grid gap-5 lg:grid-cols-2 briefing-guest-grid">
          {card.guests.map((guest) => (
            <GuestCard
              key={guest.guestId}
              guest={guest}
              onUpdate={(updated) => saveGuestField(guest.guestId, updated)}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border px-8 py-5">
        <p className="font-sans text-xs text-graphite">
          Prepared for {event.hostName} ·{" "}
          {format(new Date(card.generatedAt), "MMM d, yyyy")}
        </p>
      </div>
    </div>
  );
}
