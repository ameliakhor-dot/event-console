import type { Event } from "@/types";

const KEY = "event-console:events";

const parseEvents = (raw: string | null): Event[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Event[]) : [];
  } catch {
    return [];
  }
};

export const storage = {
  async getEvents(): Promise<Event[]> {
    if (typeof window === "undefined") {
      return [];
    }

    return parseEvents(localStorage.getItem(KEY));
  },

  async getEvent(id: string): Promise<Event | null> {
    const events = await storage.getEvents();
    return events.find((event) => event.id === id) ?? null;
  },

  async createEvent(event: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
    const events = await storage.getEvents();
    const now = new Date().toISOString();

    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    localStorage.setItem(KEY, JSON.stringify([...events, newEvent]));
    return newEvent;
  },

  async updateEvent(id: string, patch: Partial<Event>): Promise<Event | null> {
    const events = await storage.getEvents();
    const idx = events.findIndex((event) => event.id === id);

    if (idx === -1) {
      return null;
    }

    const updated: Event = {
      ...events[idx],
      ...patch,
      id: events[idx].id,
      updatedAt: new Date().toISOString(),
    };

    events[idx] = updated;
    localStorage.setItem(KEY, JSON.stringify(events));
    return updated;
  },

  async deleteEvent(id: string): Promise<void> {
    const events = await storage.getEvents();
    localStorage.setItem(
      KEY,
      JSON.stringify(events.filter((event) => event.id !== id)),
    );
  },
};
