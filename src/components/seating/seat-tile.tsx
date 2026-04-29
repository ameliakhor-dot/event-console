import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest } from "@/types";

interface Props {
  guest: Guest;
  displayName: string;
  isPinned: boolean;
  /** visual-only override, e.g. ring-2 ring-navy on drop-over */
  className?: string;
}

/** Pure visual seat tile — no drag/drop, no tooltip. Used in DraggableSeat and DragOverlay. */
export function SeatTile({ guest, displayName, isPinned, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex h-20 w-20 select-none flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-white p-2 text-center",
        className,
      )}
    >
      {isPinned && (
        <Lock className="absolute right-1 top-1 size-2.5 text-graphite/50" />
      )}
      <span className="max-w-full truncate text-xs font-semibold leading-tight text-ink">
        {displayName}
      </span>
      {guest.company && (
        <span className="max-w-full truncate text-[9px] leading-tight text-graphite">
          {guest.company}
        </span>
      )}
    </div>
  );
}
