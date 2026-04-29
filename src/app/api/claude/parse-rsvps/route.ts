import { anthropic, MODEL } from '@/lib/claude/client';
import { parseRsvpsPrompt } from '@/lib/claude/prompts';
import type { GuestStatus } from '@/types';

interface ParsedGuest {
  name: string;
  company: string;
  role: string;
  status: GuestStatus;
  email?: string;
  notes: string;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip markdown fences (```json ... ``` or ``` ... ```)
  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(fenceStripped);
  } catch {}

  // 3. Find the outermost [ ... ] or { ... }
  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    } catch {}
  }

  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(trimmed.slice(objStart, objEnd + 1));
    } catch {}
  }

  throw new Error('Could not extract JSON from Claude response');
}

const VALID_STATUSES = new Set<string>(['confirmed', 'pending', 'declined', 'tentative']);

function normalizeGuest(raw: Record<string, unknown>): ParsedGuest {
  const status = typeof raw.status === 'string' && VALID_STATUSES.has(raw.status)
    ? (raw.status as GuestStatus)
    : 'pending';

  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    company: typeof raw.company === 'string' ? raw.company.trim() : '',
    role: typeof raw.role === 'string' ? raw.role.trim() : '',
    status,
    email: typeof raw.email === 'string' && raw.email.trim() ? raw.email.trim() : undefined,
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { text?: unknown };
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${parseRsvpsPrompt}\n\nHere is the RSVP data:\n\n${text}`,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJson(responseText);

    if (!Array.isArray(parsed)) {
      return Response.json(
        { error: 'Claude returned an unexpected format. Please try again.' },
        { status: 422 },
      );
    }

    const guests: ParsedGuest[] = (parsed as Record<string, unknown>[])
      .filter((item) => item && typeof item === 'object')
      .map(normalizeGuest)
      .filter((g) => g.name.length > 0);

    return Response.json({ guests });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
