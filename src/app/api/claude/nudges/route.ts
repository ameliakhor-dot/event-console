import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/claude/client";
import { nudgesPrompt } from "@/lib/claude/prompts";
import { extractJson } from "@/lib/claude/extract-json";
import type { EventType, Nudge, NudgeVariants } from "@/types";

const EVENT_TYPE_WORD: Record<EventType, string> = {
  dinner: "dinner",
  lunch: "lunch",
  reception: "reception",
  breakfast: "breakfast",
  other: "event",
};

interface RequestBody {
  event: {
    id: string;
    name: string;
    type: EventType;
    date: string;
    venueName: string;
    city: string;
    hostName: string;
    hostContext: string;
  };
  guests: {
    id: string;
    name: string;
    company: string;
    status: string;
    notes: string;
  }[];
}

interface RawNudge {
  guestId: string;
  variants: NudgeVariants;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { event, guests } = body;

    if (!guests || guests.length === 0) {
      return NextResponse.json({ error: "No guests provided." }, { status: 400 });
    }

    const eventTypeWord = EVENT_TYPE_WORD[event.type] ?? "event";
    const systemPrompt = nudgesPrompt.replace("{eventType}", eventTypeWord);

    const userMessage = JSON.stringify({
      event: {
        name: event.name,
        date: event.date,
        venue: event.venueName,
        city: event.city,
        hostName: event.hostName,
        hostContext: event.hostContext,
      },
      guests,
    });

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    const raw = extractJson(text) as RawNudge[];

    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "Unexpected response format from Claude." }, { status: 500 });
    }

    const now = new Date().toISOString();
    const nudges: Nudge[] = raw.map((item) => ({
      guestId: item.guestId,
      variants: item.variants,
      generatedAt: now,
    }));

    return NextResponse.json({ nudges });
  } catch (err) {
    console.error("nudges route error:", err);
    return NextResponse.json({ error: "Failed to generate nudges." }, { status: 500 });
  }
}
