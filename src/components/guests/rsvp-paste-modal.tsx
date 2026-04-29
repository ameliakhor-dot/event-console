"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      setError("Network error. Check your connection and try again.");
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
      <DialogContent className="max-w-2xl rounded-none border-border bg-surface p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-serif text-xl text-ink">
            Paste RSVPs
          </DialogTitle>
          <p className="mt-1 text-sm text-graphite">
            Any format works — email replies, a list of names, a spreadsheet
            paste. Claude will sort it out.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Sarah Chen — confirmed, vegetarian\nMike Torres (Acme) — tentative\njohn@example.com — declined`}
            className="min-h-48 resize-y font-mono text-sm rounded-none border-border bg-paper"
            disabled={loading}
          />

          {error && (
            <p className="text-sm text-[#B33A2E]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
