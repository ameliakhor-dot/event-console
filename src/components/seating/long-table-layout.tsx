"use client";

import type { Guest, PinnedSeatPosition, SeatingOption } from "@/types";
import { DraggableSeat } from "./draggable-seat";
import { getPairingRationale } from "./seating-utils";

interface Props {
  seats: string[]; // flat array
  guestMap: Map<string, Guest>;
  displayNames: Map<string, string>;
  pinnedSeats: Record<string, PinnedSeatPosition>;
  keyPairings: SeatingOption["keyPairings"];
  onContextMenu: (guestId: string, x: number, y: number) => void;
}

export function LongTableLayout({
  seats,
  guestMap,
  displayNames,
  pinnedSeats,
  keyPairings,
  onContextMenu,
}: Props) {
  const n = seats.length;
  const topCount = Math.ceil(n / 2);
  const topRow = seats.slice(0, topCount);
  // Bottom row reversed so guests face each other across the table
  const bottomRow = [...seats.slice(topCount)].reverse();

  function renderSeat(guestId: string) {
    const guest = guestMap.get(guestId);
    if (!guest) return null;
    return (
      <DraggableSeat
        key={guestId}
        guestId={guestId}
        guest={guest}
        displayName={displayNames.get(guestId) ?? guest.name.split(" ")[0]}
        isPinned={guestId in pinnedSeats}
        pairingRationale={getPairingRationale(guestId, keyPairings)}
        onContextMenu={onContextMenu}
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-0 overflow-x-auto py-8">
      <div className="flex flex-col items-center gap-0 mx-auto">
        {/* Top row */}
        <div className="flex gap-6">
          {topRow.map(renderSeat)}
        </div>

        {/* Table rectangle — hairline border, no fill */}
        <div
          className="my-5 border border-border bg-transparent"
          style={{
            width: `${topCount * 80 + (topCount - 1) * 24}px`,
            height: "48px",
          }}
        />

        {/* Bottom row (reversed) */}
        <div className="flex gap-6">
          {bottomRow.map(renderSeat)}
        </div>
      </div>
    </div>
  );
}
