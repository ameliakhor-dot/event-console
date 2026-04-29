"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import type { Guest, Nudge, NudgeVariants as NudgeVariantsType } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Tone = keyof NudgeVariantsType;
const TONES: { key: Tone; label: string }[] = [
  { key: "warm", label: "Warm" },
  { key: "neutral", label: "Neutral" },
  { key: "urgent", label: "Urgent" },
];

interface Props {
  guest: Guest;
  nudge: Nudge | null;
  onGenerate: (guestId: string) => Promise<void>;
  onUpdate: (guestId: string, patch: Partial<Nudge>) => Promise<void>;
  generating: boolean;
}

export function NudgeVariants({ guest, nudge, onGenerate, onUpdate, generating }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeTone, setActiveTone] = useState<Tone>("warm");
  const [editingTone, setEditingTone] = useState<Tone | null>(null);
  const [editValue, setEditValue] = useState("");

  const effectiveVariants: NudgeVariantsType | null = nudge
    ? {
        warm: nudge.editedVariants?.warm ?? nudge.variants.warm,
        neutral: nudge.editedVariants?.neutral ?? nudge.variants.neutral,
        urgent: nudge.editedVariants?.urgent ?? nudge.variants.urgent,
      }
    : null;

  function handleCopy(tone: Tone) {
    if (!effectiveVariants) return;
    navigator.clipboard.writeText(effectiveVariants[tone]);
    toast.success(`${tone.charAt(0).toUpperCase() + tone.slice(1)} variant copied.`);
  }

  function startEdit(tone: Tone) {
    if (!effectiveVariants) return;
    setEditingTone(tone);
    setEditValue(effectiveVariants[tone]);
  }

  async function saveEdit() {
    if (!editingTone || !nudge) return;
    await onUpdate(guest.id, {
      editedVariants: {
        ...(nudge.editedVariants ?? {}),
        [editingTone]: editValue,
      },
    });
    setEditingTone(null);
  }

  async function handleMarkSent() {
    await onUpdate(guest.id, { sentAt: new Date().toISOString() });
  }

  const isSent = !!nudge?.sentAt;
  const isEdited = (tone: Tone) => !!nudge?.editedVariants?.[tone];

  return (
    <div className={cn("border border-border bg-surface", isSent && "opacity-60")}>
      {/* Guest row header — div instead of button to allow nested Button */}
      <div
        role="button"
        tabIndex={0}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left hover:bg-paper transition-colors"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((v) => !v); } }}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-graphite" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-graphite" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">{guest.name}</p>
            {(guest.company || guest.role) && (
              <p className="text-xs text-graphite">
                {[guest.role, guest.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSent && nudge?.sentAt && (
            <span className="text-xs text-graphite">
              Sent {format(new Date(nudge.sentAt), "MMM d")}
            </span>
          )}
          {!nudge && !generating && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onGenerate(guest.id);
              }}
            >
              Generate
            </Button>
          )}
          {nudge && (
            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
              {TONES.filter((t) => isEdited(t.key)).length > 0 ? "Edited" : "Ready"}
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && nudge && effectiveVariants && (
        <div className="border-t border-border">
          {/* Tone tabs */}
          <div className="flex border-b border-border">
            {TONES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTone(key);
                  setEditingTone(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                  activeTone === key
                    ? "border-b-2 border-ink text-ink"
                    : "text-graphite hover:text-ink",
                )}
              >
                {label}
                {isEdited(key) && (
                  <span className="text-[9px] text-graphite">Edited</span>
                )}
              </button>
            ))}
          </div>

          {/* Variant body */}
          <div className="px-5 py-4 space-y-3">
            {editingTone === activeTone ? (
              <>
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-32 resize-y rounded-none border-border bg-paper font-sans text-sm text-ink"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    <Check className="size-3.5" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingTone(null)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap font-sans text-sm text-ink leading-relaxed">
                  {effectiveVariants[activeTone]}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(activeTone)}
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(activeTone)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mark as sent */}
          {!isSent && (
            <div className="border-t border-border px-5 py-3">
              <Button size="sm" variant="outline" onClick={handleMarkSent}>
                Mark as sent
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Expanded but no nudge yet (generating) */}
      {expanded && !nudge && generating && (
        <div className="border-t border-border px-5 py-6 text-center">
          <p className="text-sm text-graphite">Generating nudge...</p>
        </div>
      )}

      {/* Expanded but no nudge and not generating */}
      {expanded && !nudge && !generating && (
        <div className="border-t border-border px-5 py-4 text-center">
          <p className="text-sm text-graphite">No nudge generated yet.</p>
        </div>
      )}
    </div>
  );
}
