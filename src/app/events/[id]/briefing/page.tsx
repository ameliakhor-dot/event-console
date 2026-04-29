"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { storage } from "@/lib/storage/local";
import type { BriefingCard, Event } from "@/types";
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
import { BriefingCardView } from "@/components/briefing/briefing-card-view";
import { TabProgressBar } from "@/components/shared/tab-progress-bar";
import { PageTitle } from "@/components/shared/page-title";

export default function BriefingPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  // Session-only — resets on reload
  const [skipRegenConfirm, setSkipRegenConfirm] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    storage.getEvent(params.id).then(setEvent);
  }, [params.id]);

  const generate = useCallback(async () => {
    if (!event) return;

    const confirmed = event.guests.filter((g) => g.status === "confirmed");
    if (confirmed.length === 0) return;

    setGenerating(true);

    try {
      const res = await fetch("/api/claude/briefing-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            name: event.name,
            date: event.date,
            type: event.type,
            venueName: event.venueName,
            city: event.city,
            hostName: event.hostName,
            hostContext: event.hostContext,
            targetHeadcount: event.targetHeadcount,
          },
          guests: confirmed.map((g) => ({
            id: g.id,
            name: g.name,
            company: g.company,
            role: g.role,
            notes: g.notes,
          })),
        }),
      });

      const data = (await res.json()) as {
        briefingCard?: BriefingCard;
        error?: string;
      };

      if (!res.ok || data.error || !data.briefingCard) {
        toast.error("Couldn't generate the briefing card. Try again.");
        return;
      }

      const updated = await storage.updateEvent(event.id, {
        briefingCard: data.briefingCard,
      });
      if (updated) {
        setEvent(updated);
        toast.success("Briefing card generated.");
      }
    } catch {
      toast.error("Couldn't generate the briefing card. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }, [event]);

  const handleRegenerate = () => {
    if (skipRegenConfirm) {
      generate();
    } else {
      setShowRegenConfirm(true);
    }
  };

  const handleUpdateCard = useCallback(
    async (card: BriefingCard) => {
      if (!event) return;
      const updated = await storage.updateEvent(event.id, { briefingCard: card });
      if (updated) setEvent(updated);
    },
    [event],
  );

  if (!event) return null;

  const confirmedCount = event.guests.filter(
    (g) => g.status === "confirmed",
  ).length;
  const hasCard = !!event.briefingCard;
  const canGenerate = confirmedCount > 0;

  return (
    <div className="relative">
      <PageTitle title={`${event.name} · Briefing — Event Console`} />
      <TabProgressBar loading={generating} />

      {/* Action bar — hidden during print */}
      <div
        data-no-print
        className="flex items-center justify-between gap-4 border border-border bg-surface px-6 py-4"
      >
        <div className="flex items-center gap-2">
          {hasCard ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
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
            </>
          ) : canGenerate ? (
            <Button size="sm" onClick={generate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate briefing card"
              )}
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* span needed for tooltip on disabled button */}
                  <span tabIndex={0}>
                    <Button size="sm" disabled>
                      Generate briefing card
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Add at least one confirmed guest to generate a briefing card.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

      </div>

      {/* Empty state — hidden during print */}
      {!hasCard && !generating && (
        <div
          data-no-print
          className="border border-border bg-surface px-8 py-14 text-center"
        >
          <h3 className="font-serif text-2xl text-ink">
            {canGenerate ? "Ready to brief." : "No confirmed guests."}
          </h3>
          <p className="mt-2 font-sans text-sm text-graphite">
            {canGenerate
              ? `${confirmedCount} confirmed guest${confirmedCount === 1 ? "" : "s"} ready. Generate the card above.`
              : "Mark guests as confirmed on the Guests tab first."}
          </p>
        </div>
      )}

      {/* Briefing card — visible during print */}
      {hasCard && event.briefingCard && (
        <BriefingCardView
          card={event.briefingCard}
          event={event}
          onUpdate={handleUpdateCard}
        />
      )}

      <Dialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <DialogContent className="max-w-sm rounded-none border-border bg-surface p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif text-xl text-ink">
              Regenerate briefing card?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 py-5">
            <p className="font-sans text-sm text-graphite">
              Regenerating will overwrite your edits. Continue?
            </p>
            <label className="flex cursor-pointer items-center gap-2 font-sans text-sm text-graphite">
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
    </div>
  );
}
