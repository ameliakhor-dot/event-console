"use client";

import type { Guest, PinnedSeatPosition, SeatingOption } from "@/types";
import { DraggableSeat } from "./draggable-seat";
import { getPairingRationale } from "./seating-utils";

interface RoundTableProps {
  roundSeats: string[];
  roundIndex: number;
  guestMap: Map<string, Guest>;
  displayNames: Map<string, string>;
  pinnedSeats: Record<string, PinnedSeatPosition>;
  keyPairings: SeatingOption["keyPairings"];
  onContextMenu: (guestId: string, x: number, y: number) => void;
}

function RoundTable({
  roundSeats,
  roundIndex,
  guestMap,
  displayNames,
  pinnedSeats,
  keyPairings,
  onContextMenu,
}: RoundTableProps) {
  const k = roundSeats.length;
  // Radius scales with number of seats; min 100px so 4-seat tables look right
  const radius = Math.max(100, Math.round(k * 18));
  const seatSize = 80;
  const padding = 16;
  const containerSize = (radius + seatSize / 2 + padding) * 2;
  const center = containerSize / 2;

  // Inner table circle radius — roughly half the seat radius
  const tableR = Math.round(radius * 0.52);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: containerSize, height: containerSize }}>
        {/* Table circle */}
        <div
          className="absolute rounded-full border border-border bg-transparent"
          style={{
            width: tableR * 2,
            height: tableR * 2,
            left: center - tableR,
            top: center - tableR,
          }}
        />

        {/* Seats around the circle */}
        {roundSeats.map((guestId, i) => {
          const angle = (2 * Math.PI * i) / k - Math.PI / 2;
          const x = center + radius * Math.cos(angle) - seatSize / 2;
          const y = center + radius * Math.sin(angle) - seatSize / 2;
          const guest = guestMap.get(guestId);
          if (!guest) return null;

          const isPinned = guestId in pinnedSeats;
          const isPinnedAtThisRound =
            isPinned &&
            typeof pinnedSeats[guestId] === "object" &&
            (pinnedSeats[guestId] as { roundIndex: number }).roundIndex === roundIndex;

          return (
            <div
              key={guestId}
              className="absolute"
              style={{ left: Math.round(x), top: Math.round(y) }}
            >
              <DraggableSeat
                guestId={guestId}
                guest={guest}
                displayName={displayNames.get(guestId) ?? guest.name.split(" ")[0]}
                isPinned={isPinnedAtThisRound}
                pairingRationale={getPairingRationale(guestId, keyPairings)}
                onContextMenu={onContextMenu}
              />
            </div>
          );
        })}
      </div>

      {/* Table label */}
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-graphite">
        Table {roundIndex + 1}
      </p>
    </div>
  );
}

interface Props {
  seats: string[][];
  guestMap: Map<string, Guest>;
  displayNames: Map<string, string>;
  pinnedSeats: Record<string, PinnedSeatPosition>;
  keyPairings: SeatingOption["keyPairings"];
  onContextMenu: (guestId: string, x: number, y: number) => void;
}

export function RoundsLayout({
  seats,
  guestMap,
  displayNames,
  pinnedSeats,
  keyPairings,
  onContextMenu,
}: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-12 py-8">
      {seats.map((roundSeats, roundIndex) => (
        <RoundTable
          key={roundIndex}
          roundSeats={roundSeats}
          roundIndex={roundIndex}
          guestMap={guestMap}
          displayNames={displayNames}
          pinnedSeats={pinnedSeats}
          keyPairings={keyPairings}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}
