"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Plus, User } from "lucide-react";
import { format } from "date-fns";

import { storage } from "@/lib/storage/local";
import type { Event } from "@/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventResult {
  type: "event";
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

interface GuestResult {
  type: "guest";
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

interface VenueResult {
  type: "venue";
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  // Load events whenever palette opens
  useEffect(() => {
    if (open) {
      storage.getEvents().then(setEvents);
    }
  }, [open]);

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Build result sets
  const eventResults: EventResult[] = events.map((ev) => ({
    type: "event",
    id: ev.id,
    label: ev.name,
    subtitle: `${format(new Date(ev.date), "MMM d, yyyy")} · ${ev.city}`,
    href: `/events/${ev.id}`,
  }));

  const venueResults: VenueResult[] = events
    .filter((ev, i, arr) => arr.findIndex((e) => e.venueName === ev.venueName) === i)
    .map((ev) => ({
      type: "venue",
      id: `venue-${ev.id}`,
      label: ev.venueName,
      subtitle: ev.city,
      href: `/events/${ev.id}`,
    }));

  const guestResults: GuestResult[] = events.flatMap((ev) =>
    ev.guests.map((g) => ({
      type: "guest" as const,
      id: g.id,
      label: g.name,
      subtitle: `${[g.role, g.company].filter(Boolean).join(" · ")} — ${ev.name}`,
      href: `/events/${ev.id}`,
    })),
  );

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-1/3 translate-y-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search events, guests, and venues</DialogDescription>
        </DialogHeader>
        <Command>
      <CommandInput placeholder="Search events, guests, venues..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => navigate("/events/new")}
            className="gap-2"
          >
            <Plus className="size-4 text-graphite" />
            <span>Create new event</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Events */}
        {eventResults.length > 0 && (
          <CommandGroup heading="Events">
            {eventResults.map((result) => (
              <CommandItem
                key={result.id}
                value={result.label}
                onSelect={() => navigate(result.href)}
                className="gap-2"
              >
                <CalendarDays className="size-4 shrink-0 text-graphite" />
                <div className="min-w-0">
                  <p className="text-sm text-ink">{result.label}</p>
                  <p className="text-xs text-graphite">{result.subtitle}</p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Guests */}
        {guestResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Guests">
              {guestResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.label + " " + result.subtitle}
                  onSelect={() => navigate(result.href)}
                  className="gap-2"
                >
                  <User className="size-4 shrink-0 text-graphite" />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{result.label}</p>
                    <p className="truncate text-xs text-graphite">{result.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Venues */}
        {venueResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Venues">
              {venueResults.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.label + " " + result.subtitle}
                  onSelect={() => navigate(result.href)}
                  className="gap-2"
                >
                  <MapPin className="size-4 shrink-0 text-graphite" />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{result.label}</p>
                    <p className="text-xs text-graphite">{result.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
