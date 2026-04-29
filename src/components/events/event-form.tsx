"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import type { Event, EventStatus, EventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const eventSchema = z.object({
  name: z.string().min(2, "Event name is required."),
  type: z.enum(["dinner", "lunch", "reception", "breakfast", "other"]),
  dateTimeLocal: z.string().min(1, "Date and time are required."),
  venueName: z.string().min(2, "Venue name is required."),
  venueAddress: z.string().optional(),
  city: z.string().min(2, "City is required."),
  hostName: z.string().min(2, "Host name is required."),
  hostContext: z.string().min(8, "Host context should include more detail."),
  targetHeadcount: z.number().int().min(1, "Headcount must be at least 1."),
  status: z.enum(["planning", "active", "completed"]),
  notes: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

type EventDraft = Omit<Event, "id" | "createdAt" | "updatedAt">;

interface EventFormProps {
  mode: "create" | "edit";
  initialEvent?: Event;
  submitLabel: string;
  onSubmitEvent: (value: EventDraft) => Promise<void>;
  cancelHref?: string;
}

const toDateTimeLocal = (isoDate: string): string => {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const eventTypes: EventType[] = ["dinner", "lunch", "reception", "breakfast", "other"];
const eventStatuses: EventStatus[] = ["planning", "active", "completed"];

export function EventForm({
  mode,
  initialEvent,
  submitLabel,
  onSubmitEvent,
  cancelHref,
}: EventFormProps) {
  const defaults = useMemo<EventFormValues>(
    () => ({
      name: initialEvent?.name ?? "",
      type: initialEvent?.type ?? "dinner",
      dateTimeLocal: initialEvent ? toDateTimeLocal(initialEvent.date) : "",
      venueName: initialEvent?.venueName ?? "",
      venueAddress: initialEvent?.venueAddress ?? "",
      city: initialEvent?.city ?? "",
      hostName: initialEvent?.hostName ?? "",
      hostContext: initialEvent?.hostContext ?? "",
      targetHeadcount: initialEvent?.targetHeadcount ?? 12,
      status: initialEvent?.status ?? "planning",
      notes: initialEvent?.notes ?? "",
    }),
    [initialEvent],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaults,
  });

  const onSubmit = async (value: EventFormValues) => {
    await onSubmitEvent({
      name: value.name,
      type: value.type,
      date: new Date(value.dateTimeLocal).toISOString(),
      venueName: value.venueName,
      venueAddress: value.venueAddress || undefined,
      city: value.city,
      hostName: value.hostName,
      hostContext: value.hostContext,
      targetHeadcount: value.targetHeadcount,
      status: value.status,
      guests: initialEvent?.guests ?? [],
      briefingCard: initialEvent?.briefingCard,
      seatingChart: initialEvent?.seatingChart,
      nudges: initialEvent?.nudges ?? {},
      runOfShow: initialEvent?.runOfShow ?? [],
      notes: value.notes ?? "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-x-10 gap-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="mt-1 text-xs text-fire">{errors.name.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          {...register("type")}
          className="h-10 w-full border-b border-input bg-transparent text-sm outline-none focus:border-ring"
        >
          {eventTypes.map((type) => (
            <option key={type} value={type} className="bg-surface">
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="dateTimeLocal">Date and time</Label>
        <Input id="dateTimeLocal" type="datetime-local" {...register("dateTimeLocal")} />
        {errors.dateTimeLocal ? (
          <p className="mt-1 text-xs text-fire">{errors.dateTimeLocal.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          {...register("status")}
          className="h-10 w-full border-b border-input bg-transparent text-sm outline-none focus:border-ring"
        >
          {eventStatuses.map((status) => (
            <option key={status} value={status} className="bg-surface">
              {status}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="venueName">Venue name</Label>
        <Input id="venueName" {...register("venueName")} />
        {errors.venueName ? (
          <p className="mt-1 text-xs text-fire">{errors.venueName.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="venueAddress">Venue address</Label>
        <Input id="venueAddress" {...register("venueAddress")} />
      </div>

      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" {...register("city")} />
        {errors.city ? <p className="mt-1 text-xs text-fire">{errors.city.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="targetHeadcount">Target headcount</Label>
        <Input
          id="targetHeadcount"
          type="number"
          min={1}
          {...register("targetHeadcount", { valueAsNumber: true })}
        />
        {errors.targetHeadcount ? (
          <p className="mt-1 text-xs text-fire">{errors.targetHeadcount.message}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="hostName">Host name</Label>
        <Input id="hostName" {...register("hostName")} />
        {errors.hostName ? (
          <p className="mt-1 text-xs text-fire">{errors.hostName.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="hostContext">Host context</Label>
        <Textarea id="hostContext" rows={2} {...register("hostContext")} />
        {errors.hostContext ? (
          <p className="mt-1 text-xs text-fire">{errors.hostContext.message}</p>
        ) : null}
      </div>

      <div className="col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...register("notes")} />
      </div>

      <div className="col-span-2 flex justify-end gap-3 pt-4">
        {mode === "edit" ? (
          <Button asChild variant="outline">
            <Link href={cancelHref ?? "/events"}>Cancel</Link>
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-hover">
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
