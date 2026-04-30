"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TabProgressBar } from "@/components/shared/tab-progress-bar";
import type { Guest } from "@/types";

type ParsedGuest = Omit<Guest, "id" | "position">;

interface Props {
  open: boolean;
  onClose: () => void;
  onParsed: (guests: ParsedGuest[]) => void;
}

export function RsvpPasteModal({ open, onClose, onParsed }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/claude/parse-rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json() as { guests?: ParsedGuest[]; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (!data.guests?.length) {
        setError("No guests found in that text. Try pasting email replies or a name list.");
        return;
      }

      onParsed(data.guests);
      setText("");
      setError(null);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setText("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="relative flex max-h-[85vh] max-w-2xl flex-col gap-0 rounded-none border-border bg-surface p-0">
        <TabProgressBar loading={loading} />

        {/* Header — shrink-0 so it never compresses */}
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="font-serif text-xl text-ink">
            Paste RSVPs
          </DialogTitle>
          <DialogDescription className="text-graphite">
            Any format works — email replies, a list of names, a spreadsheet
            paste. Claude will sort it out.
          </DialogDescription>
        </DialogHeader>

        {/* Body — flex-1 + min-h-0 required for overflow-y-auto to actually work */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Sarah Chen — confirmed, vegetarian\nMike Torres (Acme) — tentative\njohn@example.com — declined`}
            className="field-sizing-fixed max-h-[400px] min-h-[200px] resize-none rounded-none border-border bg-paper font-mono text-sm"
            disabled={loading}
          />

          {error && (
            <p className="text-sm text-[#B33A2E]">{error}</p>
          )}
        </div>

        {/* Footer — shrink-0 so it stays pinned at bottom */}
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Parsing...
              </>
            ) : (
              "Parse RSVPs"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
