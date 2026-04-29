import type { Guest, PinnedSeatPosition, SeatingOption } from '@/types';

// ── Seat array helpers ─────────────────────────────────────────────────────

/** Flatten a long_table or rounds seats array into a single list of guest IDs */
export function flattenSeats(seats: string[] | string[][]): string[] {
  if (seats.length === 0) return [];
  if (Array.isArray(seats[0])) return (seats as string[][]).flat();
  return seats as string[];
}

/** Find the pin position of a guest in the seats array */
export function findSeatPosition(
  seats: string[] | string[][],
  guestId: string,
): PinnedSeatPosition | null {
  if (seats.length === 0) return null;

  if (Array.isArray(seats[0])) {
    // rounds: nested
    for (let r = 0; r < (seats as string[][]).length; r++) {
      const round = (seats as string[][])[r];
      const s = round.indexOf(guestId);
      if (s !== -1) return { roundIndex: r, seatIndex: s };
    }
    return null;
  }

  // long_table: flat
  const idx = (seats as string[]).indexOf(guestId);
  return idx !== -1 ? idx : null;
}

/** Swap two guest IDs in a seats array (works for both flat and nested) */
export function swapSeats(
  seats: string[] | string[][],
  idA: string,
  idB: string,
): string[] | string[][] {
  if (Array.isArray(seats[0])) {
    // rounds
    const nested = (seats as string[][]).map((r) => [...r]);
    let posA: [number, number] | null = null;
    let posB: [number, number] | null = null;
    for (let r = 0; r < nested.length; r++) {
      for (let s = 0; s < nested[r].length; s++) {
        if (nested[r][s] === idA) posA = [r, s];
        if (nested[r][s] === idB) posB = [r, s];
      }
    }
    if (posA && posB) {
      nested[posA[0]][posA[1]] = idB;
      nested[posB[0]][posB[1]] = idA;
    }
    return nested;
  }
  // long_table: flat
  const flat = [...(seats as string[])];
  const iA = flat.indexOf(idA);
  const iB = flat.indexOf(idB);
  if (iA !== -1 && iB !== -1) [flat[iA], flat[iB]] = [flat[iB], flat[iA]];
  return flat;
}

// ── Display names ──────────────────────────────────────────────────────────

/**
 * Returns a Map<guestId, displayName> for the given guest IDs.
 * Guests with duplicate first names get "First L." format.
 */
export function computeDisplayNames(
  guestIds: string[],
  guestMap: Map<string, Guest>,
): Map<string, string> {
  const firstNameCount = new Map<string, number>();
  for (const id of guestIds) {
    const g = guestMap.get(id);
    if (!g) continue;
    const first = g.name.trim().split(/\s+/)[0];
    firstNameCount.set(first, (firstNameCount.get(first) ?? 0) + 1);
  }

  const result = new Map<string, string>();
  for (const id of guestIds) {
    const g = guestMap.get(id);
    if (!g) { result.set(id, '?'); continue; }
    const parts = g.name.trim().split(/\s+/);
    const first = parts[0];
    if ((firstNameCount.get(first) ?? 0) > 1 && parts.length > 1) {
      result.set(id, `${first} ${parts[parts.length - 1][0]}.`);
    } else {
      result.set(id, first);
    }
  }
  return result;
}

// ── Pairing rationale ──────────────────────────────────────────────────────

/** Returns the pairing reasoning for a guest, or null if they're not in a key pairing */
export function getPairingRationale(
  guestId: string,
  keyPairings: SeatingOption['keyPairings'],
): string | null {
  const match = keyPairings.find((p) => p.pair.includes(guestId));
  return match?.reasoning ?? null;
}
