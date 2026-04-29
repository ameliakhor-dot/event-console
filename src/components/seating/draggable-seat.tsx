"use client";

import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { Guest } from "@/types";
import { SeatTile } from "./seat-tile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  guestId: string;
  guest: Guest;
  displayName: string;
  isPinned: boolean;
  pairingRationale: string | null;
  onContextMenu: (guestId: string, x: number, y: number) => void;
}

export function DraggableSeat({
  guestId,
  guest,
  displayName,
  isPinned,
  pairingRationale,
  onContextMenu,
}: Props) {
  const { active } = useDndContext();
  const anyDragging = !!active;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: guestId });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: guestId });

  // Combine both refs onto the same element
  const setRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  // While this seat is being dragged, show a ghost placeholder
  if (isDragging) {
    return (
      <div
        ref={setRef}
        className="h-20 w-20 rounded-md border border-dashed border-border bg-transparent"
      />
    );
  }

  const tile = (
    <div
      ref={setRef}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(guestId, e.clientX, e.clientY);
      }}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isOver && "ring-2 ring-navy",
        "rounded-md transition-shadow",
      )}
    >
      <SeatTile
        guest={guest}
        displayName={displayName}
        isPinned={isPinned}
      />
    </div>
  );

  // Disable tooltip during any drag to avoid jank
  if (anyDragging) return tile;

  const hasTooltipContent = !!(guest.role || guest.company || pairingRationale);
  if (!hasTooltipContent) return tile;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{tile}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px] text-left">
          <p className="font-semibold leading-tight">{guest.name}</p>
          {(guest.role || guest.company) && (
            <p className="mt-0.5 text-[10px] opacity-80">
              {[guest.role, guest.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {pairingRationale && (
            <p className="mt-1 text-[10px] italic opacity-70">
              {pairingRationale}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
