"use client";

import { useState, useRef } from "react";
import type { Guest, GuestStatus } from "@/types";

const STATUS_LABELS: Record<GuestStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  declined: "Declined",
  tentative: "Tentative",
};

const STATUS_COLORS: Record<GuestStatus, string> = {
  confirmed: "text-[#2D7A3E] bg-[#2D7A3E]/8",
  pending: "text-[#B8860B] bg-[#B8860B]/8",
  declined: "text-[#888888] bg-[#888888]/10",
  tentative: "text-[#3B5998] bg-[#3B5998]/8",
};

const FILTER_OPTIONS: { label: string; value: GuestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Declined", value: "declined" },
  { label: "Tentative", value: "tentative" },
];

const VALID_STATUSES: GuestStatus[] = [
  "confirmed",
  "pending",
  "declined",
  "tentative",
];

type EditableTextField = "name" | "company" | "role" | "email" | "notes";
type EditableField = EditableTextField | "status";

const BLANK_NEW_GUEST = {
  name: "",
  company: "",
  role: "",
  email: "",
  notes: "",
  status: "pending" as GuestStatus,
};

interface Props {
  guests: Guest[];
  onUpdate: (updatedGuests: Guest[]) => void;
  addingNew: boolean;
  onNewRowDone: () => void;
}

export function GuestTable({ guests, onUpdate, addingNew, onNewRowDone }: Props) {
  const [filter, setFilter] = useState<GuestStatus | "all">("all");
  const [editingCell, setEditingCell] = useState<{
    guestId: string;
    field: EditableField;
  } | null>(null);
  const [newGuest, setNewGuest] = useState({ ...BLANK_NEW_GUEST });
  const newRowRef = useRef<HTMLTableRowElement>(null);

  const counts: Record<GuestStatus | "all", number> = {
    all: guests.length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    pending: guests.filter((g) => g.status === "pending").length,
    declined: guests.filter((g) => g.status === "declined").length,
    tentative: guests.filter((g) => g.status === "tentative").length,
  };

  const visible =
    filter === "all" ? guests : guests.filter((g) => g.status === filter);

  // ── Cell update helpers ──────────────────────────────────────────────────

  function updateGuestField(guestId: string, field: EditableTextField, value: string) {
    const updated = guests.map((g) =>
      g.id === guestId ? { ...g, [field]: value } : g,
    );
    onUpdate(updated);
  }

  function updateGuestStatus(guestId: string, status: GuestStatus) {
    const updated = guests.map((g) =>
      g.id === guestId ? { ...g, status } : g,
    );
    onUpdate(updated);
  }

  // ── New row handlers ─────────────────────────────────────────────────────

  function handleNewRowBlur(e: React.FocusEvent<HTMLTableRowElement>) {
    // If focus stays within the new row, don't act yet
    if (newRowRef.current?.contains(e.relatedTarget as Node)) return;

    if (newGuest.name.trim()) {
      const fresh: Guest = {
        ...newGuest,
        name: newGuest.name.trim(),
        company: newGuest.company.trim(),
        role: newGuest.role.trim(),
        email: newGuest.email.trim() || undefined,
        notes: newGuest.notes.trim(),
        id: crypto.randomUUID(),
        position: null,
      };
      onUpdate([...guests, fresh]);
    }

    setNewGuest({ ...BLANK_NEW_GUEST });
    onNewRowDone();
  }

  function handleNewRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setNewGuest({ ...BLANK_NEW_GUEST });
      onNewRowDone();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                active
                  ? "border border-ink bg-ink text-paper"
                  : "border border-border text-graphite hover:border-ink hover:text-ink",
              ].join(" ")}
            >
              {opt.label}
              <span
                className={[
                  "text-[10px] font-normal tabular-nums",
                  active ? "text-paper/70" : "text-graphite",
                ].join(" ")}
              >
                {counts[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Company", "Role", "Status", "Email", "Notes"].map(
                (col) => (
                  <th
                    key={col}
                    className="py-2 pr-4 text-left text-xs font-semibold tracking-[0.12em] uppercase text-graphite"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {/* New guest row */}
            {addingNew && (
              <tr
                ref={newRowRef}
                onBlur={handleNewRowBlur}
                onKeyDown={handleNewRowKeyDown}
                className="border-b border-border bg-[#FAFAF7]"
              >
                {(["name", "company", "role"] as const).map((field) => (
                  <td key={field} className="py-2 pr-4">
                    <input
                      autoFocus={field === "name"}
                      value={newGuest[field]}
                      onChange={(e) =>
                        setNewGuest((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      placeholder={
                        field === "name" ? "Name (required)" : field
                      }
                      className="w-full min-w-[80px] border-b border-border bg-transparent py-0.5 text-sm text-ink outline-none placeholder:text-graphite/50 focus:border-ink"
                    />
                  </td>
                ))}
                <td className="py-2 pr-4">
                  <select
                    value={newGuest.status}
                    onChange={(e) =>
                      setNewGuest((prev) => ({
                        ...prev,
                        status: e.target.value as GuestStatus,
                      }))
                    }
                    className="border-b border-border bg-transparent py-0.5 text-xs font-semibold tracking-wide uppercase text-ink outline-none focus:border-ink"
                  >
                    {VALID_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                {(["email", "notes"] as const).map((field) => (
                  <td key={field} className="py-2 pr-4">
                    <input
                      value={newGuest[field]}
                      onChange={(e) =>
                        setNewGuest((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      placeholder={field}
                      className="w-full min-w-[80px] border-b border-border bg-transparent py-0.5 text-sm text-ink outline-none placeholder:text-graphite/50 focus:border-ink"
                    />
                  </td>
                ))}
              </tr>
            )}

            {/* Existing guest rows */}
            {visible.map((guest) => (
              <tr
                key={guest.id}
                className="group border-b border-border last:border-0 hover:bg-paper/60"
              >
                {/* Editable text cells */}
                {(["name", "company", "role"] as EditableTextField[]).map(
                  (field) => {
                    const isEditing =
                      editingCell?.guestId === guest.id &&
                      editingCell.field === field;
                    return (
                      <td key={field} className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={String(guest[field] ?? "")}
                            onBlur={(e) => {
                              updateGuestField(
                                guest.id,
                                field,
                                e.target.value,
                              );
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              } else if (e.key === "Enter") {
                                updateGuestField(
                                  guest.id,
                                  field,
                                  (e.target as HTMLInputElement).value,
                                );
                                setEditingCell(null);
                              }
                            }}
                            className="w-full min-w-[80px] border-b border-ink bg-transparent py-0.5 text-sm text-ink outline-none"
                          />
                        ) : (
                          <span
                            onClick={() =>
                              setEditingCell({ guestId: guest.id, field })
                            }
                            className="block cursor-text py-0.5 text-ink group-hover:underline-offset-2"
                            title="Click to edit"
                          >
                            {String(guest[field] ?? "") || (
                              <span className="text-graphite/40">—</span>
                            )}
                          </span>
                        )}
                      </td>
                    );
                  },
                )}

                {/* Status cell */}
                <td className="py-2 pr-4">
                  {editingCell?.guestId === guest.id &&
                  editingCell.field === "status" ? (
                    <select
                      autoFocus
                      defaultValue={guest.status}
                      onChange={(e) => {
                        updateGuestStatus(
                          guest.id,
                          e.target.value as GuestStatus,
                        );
                        setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                      className="border-b border-ink bg-transparent text-xs font-semibold tracking-wide uppercase text-ink outline-none"
                    >
                      {VALID_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      onClick={() =>
                        setEditingCell({ guestId: guest.id, field: "status" })
                      }
                      className={[
                        "inline-block cursor-pointer px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
                        STATUS_COLORS[guest.status],
                      ].join(" ")}
                      title="Click to change status"
                    >
                      {STATUS_LABELS[guest.status]}
                    </span>
                  )}
                </td>

                {/* Email cell */}
                <td className="py-2 pr-4">
                  {editingCell?.guestId === guest.id &&
                  editingCell.field === "email" ? (
                    <input
                      autoFocus
                      defaultValue={guest.email ?? ""}
                      onBlur={(e) => {
                        updateGuestField(guest.id, "email", e.target.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCell(null);
                        else if (e.key === "Enter") {
                          updateGuestField(
                            guest.id,
                            "email",
                            (e.target as HTMLInputElement).value,
                          );
                          setEditingCell(null);
                        }
                      }}
                      className="w-full min-w-[120px] border-b border-ink bg-transparent py-0.5 text-sm text-ink outline-none"
                    />
                  ) : (
                    <span
                      onClick={() =>
                        setEditingCell({ guestId: guest.id, field: "email" })
                      }
                      className="block cursor-text py-0.5 text-sm text-ink"
                      title="Click to edit"
                    >
                      {guest.email || <span className="text-graphite/40">—</span>}
                    </span>
                  )}
                </td>

                {/* Notes cell */}
                <td className="py-2 pr-4 max-w-xs">
                  {editingCell?.guestId === guest.id &&
                  editingCell.field === "notes" ? (
                    <input
                      autoFocus
                      defaultValue={guest.notes}
                      onBlur={(e) => {
                        updateGuestField(guest.id, "notes", e.target.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingCell(null);
                        else if (e.key === "Enter") {
                          updateGuestField(
                            guest.id,
                            "notes",
                            (e.target as HTMLInputElement).value,
                          );
                          setEditingCell(null);
                        }
                      }}
                      className="w-full border-b border-ink bg-transparent py-0.5 text-sm text-ink outline-none"
                    />
                  ) : (
                    <span
                      onClick={() =>
                        setEditingCell({ guestId: guest.id, field: "notes" })
                      }
                      className="block cursor-text truncate py-0.5 text-sm text-graphite"
                      title={guest.notes || "Click to add notes"}
                    >
                      {guest.notes || <span className="text-graphite/40">—</span>}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty state */}
        {visible.length === 0 && !addingNew && (
          <div className="py-14 text-center">
            {guests.length === 0 ? (
              <>
                <p className="font-serif text-xl text-ink">No guests yet.</p>
                <p className="mt-1 text-sm text-graphite">
                  Paste some RSVPs or add a guest manually to get started.
                </p>
              </>
            ) : (
              <p className="text-sm text-graphite">
                No {filter} guests.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
