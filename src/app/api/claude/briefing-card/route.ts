import { anthropic, MODEL } from '@/lib/claude/client';
import { briefingCardPrompt } from '@/lib/claude/prompts';
import { extractJson } from '@/lib/claude/extract-json';
import type { BriefingCard, BriefingCardGuest } from '@/types';

interface EventPayload {
  name: string;
  date: string;
  type: string;
  venueName: string;
  city: string;
  hostName: string;
  hostContext: string;
  targetHeadcount: number;
}

interface GuestPayload {
  id: string;
  name: string;
  company: string;
  role: string;
  notes: string;
}

function normalizeBriefingCard(raw: Record<string, unknown>): BriefingCard {
  const rawGuests = Array.isArray(raw.guests) ? raw.guests : [];

  const guests: BriefingCardGuest[] = (rawGuests as unknown[])
    .filter((g): g is Record<string, unknown> => g !== null && typeof g === 'object')
    .map((g) => ({
      guestId: typeof g.guestId === 'string' ? g.guestId : '',
      name: typeof g.name === 'string' ? g.name : '',
      company: typeof g.company === 'string' ? g.company : '',
      role: typeof g.role === 'string' ? g.role : '',
      bioLine: typeof g.bioLine === 'string' ? g.bioLine : '',
      workingOn: typeof g.workingOn === 'string' ? g.workingOn : '',
      askThemAbout: typeof g.askThemAbout === 'string' ? g.askThemAbout : '',
    }))
    .filter((g) => g.guestId.length > 0);

  return {
    eventSummary: typeof raw.eventSummary === 'string' ? raw.eventSummary : '',
    guests,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      event?: EventPayload;
      guests?: GuestPayload[];
    };

    if (!body.event || !Array.isArray(body.guests)) {
      return Response.json({ error: 'Missing event or guests in request' }, { status: 400 });
    }

    if (body.guests.length === 0) {
      return Response.json(
        { error: 'At least one confirmed guest is required' },
        { status: 400 },
      );
    }

    const userMessage = [
      'Generate a briefing card for the host of this dinner. Event details and confirmed guests below.',
      '',
      `Event: ${JSON.stringify(body.event, null, 2)}`,
      `Guests: ${JSON.stringify(body.guests, null, 2)}`,
    ].join('\n');

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: briefingCardPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const parsed = extractJson(responseText);

    if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
      return Response.json(
        { error: 'Claude returned an unexpected format. Please try again.' },
        { status: 422 },
      );
    }

    const briefingCard = normalizeBriefingCard(parsed as Record<string, unknown>);

    return Response.json({ briefingCard });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
