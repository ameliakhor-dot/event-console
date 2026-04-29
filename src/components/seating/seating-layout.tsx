"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

import type { Guest, PinnedSeatPosition, SeatingOption } from "@/types";
import { SeatTile } from "./seat-tile";
import { LongTableLayout } from "./long-table-layout";
import { RoundsLayout } from "./rounds-layout";
import {
  computeDisplayNames,
  findSeatPosition,
  flattenSeats,
  swapSeats,
} from "./seating-utils";

interface ContextMenuState {
  guestId: string;
  position: PinnedSeatPosition;
  x: number;
  y: number;
}

interface Props {
  option: SeatingOption;
  guestMap: Map<string, Guest>;
  pinnedSeats: Record<string, PinnedSeatPosition>;
  onSeatsChange: (newSeats: string[] | string[][]) => void;
  onPinToggle: (guestId: string, position: PinnedSeatPosition) => void;
}

export function SeatingLayout({
  option,
  guestMap,
  pinnedSeats,
  onSeatsChange,
  onPinToggle,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  // Precompute display names from the full flat guest list in this option
  const allIds = flattenSeats(option.seats);
  const displayNames = computeDisplayNames(allIds, guestMap);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      const newSeats = swapSeats(option.seats, active.id as string, over.id as string);
      onSeatsChange(newSeats);
    }
    setActiveId(null);
  }

  function handleContextMenu(guestId: string, x: number, y: number) {
    const position = findSeatPosition(option.seats, guestId);
    if (position !== null) setContextMenu({ guestId, position, x, y });
  }

  const activeGuest = activeId ? guestMap.get(activeId) : null;

  const sharedProps = {
    guestMap,
    displayNames,
    pinnedSeats,
    keyPairings: option.keyPairings,
    onContextMenu: handleContextMenu,
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative overflow-x-auto">
        {option.layoutType === "long_table" ? (
          <LongTableLayout seats={option.seats as string[]} {...sharedProps} />
        ) : (
          <RoundsLayout seats={option.seats as string[][]} {...sharedProps} />
        )}
      </div>

      {/* Floating drag preview */}
      <DragOverlay dropAnimation={defaultDropAnimation}>
        {activeId && activeGuest ? (
          <div className="scale-105 drop-shadow-md">
            <SeatTile
              guest={activeGuest}
              displayName={displayNames.get(activeId) ?? activeGuest.name.split(" ")[0]}
              isPinned={activeId in pinnedSeats}
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="fixed z-50 min-w-[160px] border border-border bg-surface py-1 shadow-md"
        >
          <button
            className="w-full px-4 py-2 text-left text-xs font-semibold tracking-[0.12em] uppercase text-ink hover:bg-paper"
            onClick={() => {
              onPinToggle(contextMenu.guestId, contextMenu.position);
              setContextMenu(null);
            }}
          >
            {contextMenu.guestId in pinnedSeats ? "Unpin position" : "Pin position"}
          </button>
        </div>
      )}
    </DndContext>
  );
}
