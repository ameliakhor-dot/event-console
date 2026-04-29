"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

import { storage } from "@/lib/storage/local";
import type { Event, EventType, RunOfShowItem } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimelineEditor } from "@/components/run-of-show/timeline-editor";
import { PageTitle } from "@/components/shared/page-title";

// ── Templates ─────────────────────────────────────────────────────────────────

function makeItem(time: string, label: string, durationMinutes: number, notes?: string): RunOfShowItem {
  return { id: crypto.randomUUID(), time, label, durationMinutes, notes: notes ?? "" };
}

const TEMPLATES: Record<EventType, RunOfShowItem[]> = {
  dinner: [
    makeItem("6:30pm", "Arrivals + drinks", 30),
    makeItem("7:00pm", "Seated, host welcome", 15),
    makeItem("7:15pm", "Structured round (90 sec/guest)", 30),
    makeItem("7:45pm", "First course", 30),
    makeItem("8:15pm", "Outside voice (7 min)", 10),
    makeItem("8:25pm", "Main course", 50),
    makeItem("9:15pm", "Dessert + open conversation", 30),
    makeItem("9:45pm", "Wind down", 15),
  ],
  lunch: [
    makeItem("12:00pm", "Arrivals", 15),
    makeItem("12:15pm", "Seated, host welcome", 15),
    makeItem("12:30pm", "First course", 45),
    makeItem("1:15pm", "Second course", 45),
    makeItem("2:00pm", "Wind down", 15),
  ],
  reception: [
    makeItem("5:30pm", "Doors open", 30),
    makeItem("6:00pm", "Welcome remarks", 10),
    makeItem("6:15pm", "Speaker slot", 10),
    makeItem("6:30pm", "Open networking", 90),
    makeItem("8:00pm", "Soft close", 30),
    makeItem("8:30pm", "Doors close", 0),
  ],
  breakfast: [
    makeItem("8:00am", "Arrivals + coffee", 15),
    makeItem("8:15am", "Seated", 15),
    makeItem("8:30am", "Host opening", 30),
    makeItem("9:00am", "Course + discussion", 45),
    makeItem("9:45am", "Wind down", 15),
  ],
  other: [
    makeItem("", "", 0),
  ],
};

const TEMPLATE_LABELS: Record<EventType, string> = {
  dinner: "Dinner",
  lunch: "Lunch",
  reception: "Reception",
  breakfast: "Breakfast",
  other: "Custom",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RunOfShowPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<EventType | null>(null);

  useEffect(() => {
    if (!params.id) return;
    storage.getEvent(params.id).then(async (ev) => {
      if (!ev) return;
      // Auto-load template if run of show is empty
      if (ev.runOfShow.length === 0) {
        const template = TEMPLATES[ev.type];
        const updated = await storage.updateEvent(ev.id, { runOfShow: template });
        setEvent(updated ?? ev);
      } else {
        setEvent(ev);
      }
    });
  }, [params.id]);

  const handleItemsChange = useCallback(
    async (items: RunOfShowItem[]) => {
      if (!event) return;
      const updated = await storage.updateEvent(event.id, { runOfShow: items });
      if (updated) setEvent(updated);
    },
    [event],
  );

  function handleTemplateSelect(type: EventType) {
    if (!event) return;
    if (event.runOfShow.length > 0) {
      setPendingTemplate(type);
      setShowSwitchConfirm(true);
    } else {
      applyTemplate(type);
    }
  }

  async function applyTemplate(type: EventType) {
    if (!event) return;
    const template = TEMPLATES[type];
    const updated = await storage.updateEvent(event.id, { runOfShow: template });
    if (updated) setEvent(updated);
    setShowSwitchConfirm(false);
    setPendingTemplate(null);
  }

  if (!event) return null;

  return (
    <>
      <PageTitle title={`${event.name} · Run of Show — Event Console`} />
      {/* Action bar — hidden on print */}
      <div data-no-print className="flex flex-wrap items-center justify-between gap-4 border border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-graphite">Template</p>
          <div className="flex items-center">
            {(Object.keys(TEMPLATES) as EventType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTemplateSelect(type)}
                className={[
                  "border px-3 py-1.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors first:border-r-0 last:border-l-0 [&:not(:first-child):not(:last-child)]:border-x-0",
                  event.type === type
                    ? "border-ink bg-ink text-paper"
                    : "border-border text-graphite hover:border-ink hover:text-ink",
                ].join(" ")}
              >
                {TEMPLATE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-3.5" />
          Print
        </Button>
      </div>

      {/* Timeline */}
      <div className="run-of-show-content">
        <TimelineEditor items={event.runOfShow} onChange={handleItemsChange} />
      </div>

      {/* Template switch confirm */}
      <Dialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
        <DialogContent className="max-w-sm rounded-none border-border bg-surface p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="font-serif text-xl text-ink">
              Switch template?
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5">
            <p className="text-sm text-graphite">
              This will replace your current run of show. Continue?
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setPendingTemplate(null);
                setShowSwitchConfirm(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => pendingTemplate && applyTemplate(pendingTemplate)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
