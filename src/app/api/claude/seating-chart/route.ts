import { anthropic, MODEL } from '@/lib/claude/client';
import { seatingChartPrompt } from '@/lib/claude/prompts';
import { extractJson } from '@/lib/claude/extract-json';
import type { PinnedSeatPosition, SeatingChart, SeatingOption } from '@/types';

interface GuestPayload {
  id: string;
  name: string;
  company: string;
  role: string;
  notes: string;
}

interface PinnedPositionPayload {
  guestId: string;
  position?: number;
  roundIndex?: number;
  seatIndex?: number;
}

type LayoutType = 'long_table' | 'rounds';

// ── Normalizers ────────────────────────────────────────────────────────────

function normalizeSeats(raw: unknown, layoutType: LayoutType): string[] | string[][] {
  if (!Array.isArray(raw)) return layoutType === 'long_table' ? [] : [[]];

  if (layoutType === 'long_table') {
    // Expect flat array of strings
    if (raw.every((s) => typeof s === 'string')) return raw as string[];
    // If nested, flatten
    if (raw.length > 0 && Array.isArray(raw[0])) return (raw as unknown[][]).flat().filter((s): s is string => typeof s === 'string');
    return [];
  } else {
    // rounds: expect array of arrays
    if (raw.length > 0 && Array.isArray(raw[0])) {
      return (raw as unknown[][]).map((round) =>
        (Array.isArray(round) ? round : []).filter((s): s is string => typeof s === 'string'),
      );
    }
    // Flat array — split into groups of up to 8
    if (raw.every((s) => typeof s === 'string')) {
      const flat = raw as string[];
      const groups: string[][] = [];
      for (let i = 0; i < flat.length; i += 8) {
        groups.push(flat.slice(i, i + 8));
      }
      return groups;
    }
    return [[]];
  }
}

function normalizeKeyPairings(raw: unknown): SeatingOption['keyPairings'] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => {
      const pair = Array.isArray(item.pair) ? (item.pair as unknown[]).slice(0, 2).map(String) : ['', ''];
      return {
        pair: [pair[0] ?? '', pair[1] ?? ''] as [string, string],
        reasoning: typeof item.reasoning === 'string' ? item.reasoning : '',
      };
    })
    .filter((p) => p.pair[0] && p.pair[1]);
}

function normalizeOption(raw: unknown, layoutType: LayoutType): SeatingOption | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  return {
    layoutType,
    seats: normalizeSeats(obj.seats, layoutType),
    rationale: typeof obj.rationale === 'string' ? obj.rationale : '',
    keyPairings: normalizeKeyPairings(obj.keyPairings),
  };
}

function extractOptions(parsed: unknown, layoutType: LayoutType): SeatingOption[] {
  let rawOptions: unknown[] = [];

  if (Array.isArray(parsed)) {
    rawOptions = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.options)) {
      rawOptions = obj.options;
    } else {
      // Maybe the object IS an option (edge case — wrap it)
      rawOptions = [parsed];
    }
  }

  return rawOptions
    .map((opt) => normalizeOption(opt, layoutType))
    .filter((opt): opt is SeatingOption => opt !== null)
    .slice(0, 3);
}

// ── Route ─────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      guests?: GuestPayload[];
      layoutType?: string;
      pinnedPositions?: PinnedPositionPayload[];
    };

    const layoutType: LayoutType =
      body.layoutType === 'rounds' ? 'rounds' : 'long_table';

    if (!Array.isArray(body.guests) || body.guests.length < 4) {
      return Response.json(
        { error: 'At least 4 confirmed guests are required' },
        { status: 400 },
      );
    }

    const pinnedSummary =
      body.pinnedPositions?.length
        ? `\nPinned positions: ${JSON.stringify(body.pinnedPositions)}`
        : '';

    const userMessage = [
      'Generate a seating chart for this dinner. Guest list, layout type, and any pinned positions below.',
      '',
      `Layout type: ${layoutType}`,
      `Guests: ${JSON.stringify(body.guests, null, 2)}`,
      pinnedSummary,
    ]
      .filter(Boolean)
      .join('\n');

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: seatingChartPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJson(responseText);
    const options = extractOptions(parsed, layoutType);

    if (options.length === 0) {
      return Response.json(
        { error: 'Claude returned no valid options. Please try again.' },
        { status: 422 },
      );
    }

    // Rebuild pinnedSeats from the payload to pass back
    const pinnedSeats: Record<string, PinnedSeatPosition> = {};
    for (const p of body.pinnedPositions ?? []) {
      if (typeof p.position === 'number') {
        pinnedSeats[p.guestId] = p.position;
      } else if (typeof p.roundIndex === 'number' && typeof p.seatIndex === 'number') {
        pinnedSeats[p.guestId] = { roundIndex: p.roundIndex, seatIndex: p.seatIndex };
      }
    }

    const seatingChart: SeatingChart = {
      options,
      activeOptionIndex: null,
      layoutType,
      pinnedSeats,
      generatedAt: new Date().toISOString(),
    };

    return Response.json({ seatingChart });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
