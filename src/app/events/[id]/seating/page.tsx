"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { storage } from "@/lib/storage/local";
import type { Event, PinnedSeatPosition, SeatingChart } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SeatingLayout } from "@/components/seating/seating-layout";
import { TabProgressBar } from "@/components/shared/tab-progress-bar";
import { PageTitle } from "@/components/shared/page-title";

type LayoutType = "long_table" | "rounds";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildPinnedPositionsPayload(
  pinnedSeats: Record<string, PinnedSeatPosition>,
) {
  return Object.entries(pinnedSeats).map(([guestId, pos]) =>
    typeof pos === "number"
      ? { guestId, position: pos }
      : { guestId, roundIndex: pos.roundIndex, seatIndex: pos.seatIndex },
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SeatingPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>("long_table");
  const [activeTab, setActiveTab] = useState(0);
  const [generating, setGenerating] = useState(false);
  // Per-option modified flags — resets on regenerate or lock
  const [modifiedOptions, setModifiedOptions] = useState(new Set<number>());
  // Regen confirm
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [skipRegenConfirm, setSkipRegenConfirm] = useState(false);
  // Layout switch confirm (when pins need clearing)
  const [showLayoutSwitchConfirm, setShowLayoutSwitchConfirm] = useState(false);
  const [pendingLayoutType, setPendingLayoutType] = useState<LayoutType | null>(null);

  useEffect(() => {
    if (!params.id) return;
    storage.getEvent(params.id).then((ev) => {
      setEvent(ev);
      if (ev?.seatingChart) {
        setLayoutType(ev.seatingChart.layoutType);
      }
    });
  }, [params.id]);

  const chart = event?.seatingChart ?? null;
  const confirmedGuests = useMemo(
    () => event?.guests.filter((g) => g.status === "confirmed") ?? [],
    [event],
  );
  const confirmedCount = confirmedGuests.length;
  const canGenerate = confirmedCount >= 4;

  const guestMap = useMemo(
    () => new Map(event?.guests.map((g) => [g.id, g]) ?? []),
    [event],
  );

  // ── Generate ─────────────────────────────────────────────────────────────

  const generate = useCallback(async () => {
    if (!event || !canGenerate) return;
    setGenerating(true);

    try {
      const existingPins = chart?.pinnedSeats ?? {};
      const res = await fetch("/api/claude/seating-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guests: confirmedGuests.map((g) => ({
            id: g.id,
            name: g.name,
            company: g.company,
            role: g.role,
            notes: g.notes,
          })),
          layoutType,
          pinnedPositions: buildPinnedPositionsPayload(existingPins),
        }),
      });

      const data = (await res.json()) as {
        seatingChart?: SeatingChart;
        error?: string;
      };

      if (!res.ok || data.error || !data.seatingChart) {
        toast.error("Couldn't generate the seating chart. Try again.");
        return;
      }

      // Preserve pins; clear lock on regenerate
      const newChart: SeatingChart = {
        ...data.seatingChart,
        pinnedSeats: existingPins,
        activeOptionIndex: null,
      };

      const updated = await storage.updateEvent(event.id, {
        seatingChart: newChart,
      });
      if (updated) {
        setEvent(updated);
        setActiveTab(0);
        setModifiedOptions(new Set());
        toast.success("Seating chart generated.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }, [event, canGenerate, confirmedGuests, layoutType, chart]);

  // ── Regen flow ────────────────────────────────────────────────────────────

  function handleRegenerateClick() {
    if (skipRegenConfirm) {
      generate();
    } else {
      setShowRegenConfirm(true);
    }
  }

  // ── Layout type toggle ────────────────────────────────────────────────────

  function handleLayoutTypeChange(newType: LayoutType) {
    if (newType === layoutType) return;
    const hasPins = Object.keys(chart?.pinnedSeats ?? {}).length > 0;
    if (hasPins) {
      setPendingLayoutType(newType);
      setShowLayoutSwitchConfirm(true);
    } else {
      setLayoutType(newType);
    }
  }

  async function confirmLayoutSwitch() {
    if (!event || !pendingLayoutType) return;
    const newType = pendingLayoutType;

    if (chart) {
      const updated = await storage.updateEvent(event.id, {
        seatingChart: { ...chart, pinnedSeats: {} },
      });
      if (updated) setEvent(updated);
    }

    setLayoutType(newType);
    setPendingLayoutType(null);
    setShowLayoutSwitchConfirm(false);
  }

  // ── Seats change (drag-drop) ───────────────────────────────────────────

  const handleSeatsChange = useCallback(
    async (newSeats: string[] | string[][]) => {
      if (!event?.seatingChart) return;
      const idx = activeTab;
      const newOptions = event.seatingChart.options.map((opt, i) =>
        i === idx ? { ...opt, seats: newSeats } : opt,
      );
      const updated = await storage.updateEvent(event.id, {
        seatingChart: { ...event.seatingChart, options: newOptions },
      });
      if (updated) {
        setEvent(updated);
        setModifiedOptions((prev) => new Set(prev).add(idx));
      }
    },
    [event, activeTab],
  );

  // ── Pin toggle ────────────────────────────────────────────────────────────

  const handlePinToggle = useCallback(
    async (guestId: string, position: PinnedSeatPosition) => {
      if (!event?.seatingChart) return;
      const current = { ...event.seatingChart.pinnedSeats };
      if (guestId in current) {
        delete current[guestId];
      } else {
        current[guestId] = position;
      }
      const updated = await storage.updateEvent(event.id, {
        seatingChart: { ...event.seatingChart, pinnedSeats: current },
      });
      if (updated) setEvent(updated);
    },
    [event],
  );

  // ── Lock ──────────────────────────────────────────────────────────────────

  async function handleLock() {
    if (!event?.seatingChart) return;
    const updated = await storage.updateEvent(event.id, {
      seatingChart: {
        ...event.seatingChart,
        activeOptionIndex: activeTab,
      },
    });
    if (updated) {
      setEvent(updated);
      setModifiedOptions(new Set());
      toast.success(
        `Option ${String.fromCharCode(65 + activeTab)} locked as your seating chart.`,
      );
    }
  }

  if (!event) return null;

  const hasPins = Object.keys(chart?.pinnedSeats ?? {}).length > 0;
  const pinCount = Object.keys(chart?.pinnedSeats ?? {}).length;
  const activeOption = chart?.options[activeTab];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <PageTitle title={`${event.name} · Seating — Event Console`} />
      <TabProgressBar loading={generating} />

      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center gap-3 border border-border bg-surface px-6 py-4">
        {/* Layout type toggle */}
        <div className="flex items-center">
          {(["long_table", "rounds"] as LayoutType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleLayoutTypeChange(type)}
              className={[
                "border px-4 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors first:border-r-0",
                layoutType === type
                  ? "border-ink bg-ink text-paper"
                  : "border-border text-graphite hover:border-ink hover:text-ink",
              ].join(" ")}
            >
              {type === "long_table" ? "Long table" : "Rounds"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!chart ? (
            canGenerate ? (
              <Button size="sm" onClick={generate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate seating chart"
                )}
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button size="sm" disabled>
                        Generate seating chart
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Add at least 4 confirmed guests to generate a seating chart.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateClick}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-3.5" />
                    Regenerate
                  </>
                )}
              </Button>
              <Button size="sm" onClick={handleLock} disabled={generating}>
                <Lock className="size-3.5" />
                Lock this layout
              </Button>
            </>
          )}
        </div>

      </div>

      {/* ── Empty state ── */}
      {!chart && !generating && (
        <div className="border border-border bg-surface px-8 py-14 text-center">
          <h3 className="font-serif text-2xl text-ink">
            {canGenerate ? "Ready to seat." : "Not enough confirmed guests."}
          </h3>
          <p className="mt-2 text-sm text-graphite">
            {canGenerate
              ? `${confirmedCount} confirmed guest${confirmedCount === 1 ? "" : "s"}. Generate a chart above.`
              : `${confirmedCount} confirmed so far. You need at least 4.`}
          </p>
        </div>
      )}

      {/* ── Chart view ── */}
      {chart && (
        <div className="space-y-0 border border-border bg-surface">
          {/* Option tabs */}
          <div className="flex border-b border-border">
            {chart.options.map((_, i) => {
              const label = `Option ${String.fromCharCode(65 + i)}`;
              const isActive = activeTab === i;
              const isLocked = chart.activeOptionIndex === i;
              const isModified = modifiedOptions.has(i);
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={[
                    "flex items-center gap-1.5 px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-colors",
                    isActive
                      ? "border-b-2 border-ink text-ink"
                      : "text-graphite hover:text-ink",
                  ].join(" ")}
                >
                  {label}
                  {isLocked && (
                    <span className="text-[9px] font-semibold tracking-wider text-navy">
                      LOCKED
                    </span>
                  )}
                  {isModified && !isLocked && (
                    <span className="text-[9px] font-normal tracking-wider text-graphite">
                      Modified
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active option layout */}
          {activeOption && (
            <>
              <div className="px-6">
                <SeatingLayout
                  option={activeOption}
                  guestMap={guestMap}
                  pinnedSeats={chart.pinnedSeats}
                  onSeatsChange={handleSeatsChange}
                  onPinToggle={handlePinToggle}
                />
              </div>

              {/* Rationale + key pairings */}
              <div className="border-t border-border px-6 py-5 space-y-4">
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] uppercase text-graphite">
                    Strategy
                  </p>
                  <p className="text-sm text-ink">{activeOption.rationale}</p>
                </div>

                {activeOption.keyPairings.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-graphite">
                      Key pairings
                    </p>
                    <ul className="space-y-1.5">
                      {activeOption.keyPairings.map((kp, i) => {
                        const nameA =
                          guestMap.get(kp.pair[0])?.name.split(" ")[0] ??
                          kp.pair[0];
                        const nameB =
                          guestMap.get(kp.pair[1])?.name.split(" ")[0] ??
                          kp.pair[1];
                        return (
                          <li key={i} className="text-sm text-ink">
                            <span className="font-medium">
                              {nameA} + {nameB}:
                            </span>{" "}
                            <span className="text-graphite">
                              {kp.reasoning}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {pinCount > 0 && (
                  <p className="text-xs text-graphite">
                    {pinCount} seat{pinCount === 1 ? "" : "s"} pinned. Right-click any seat to change.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Regenerate confirm dialog ── */}
      <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <DialogContent className="max-w-sm rounded-none border-border bg-surface p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif text-xl text-ink">
              Regenerate seating chart?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-graphite">
              {hasPins
                ? "Regenerate will replace the 3 options. Pinned guests stay in their positions. Continue?"
                : "Regenerate will replace the 3 options and lose any drag-and-drop edits. Continue?"}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-graphite">
              <input
                type="checkbox"
                checked={skipRegenConfirm}
                onChange={(e) => setSkipRegenConfirm(e.target.checked)}
              />
              Don't ask again this session
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowRegenConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRegenConfirm(false);
                generate();
              }}
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Layout switch confirm dialog (clears pins) ── */}
      <Dialog
        open={showLayoutSwitchConfirm}
        onOpenChange={setShowLayoutSwitchConfirm}
      >
        <DialogContent className="max-w-sm rounded-none border-border bg-surface p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif text-xl text-ink">
              Switch layout type?
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-graphite">
              Switching layout will clear{" "}
              {pinCount} pinned position{pinCount === 1 ? "" : "s"}. Continue?
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setPendingLayoutType(null);
                setShowLayoutSwitchConfirm(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmLayoutSwitch}>Continue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
