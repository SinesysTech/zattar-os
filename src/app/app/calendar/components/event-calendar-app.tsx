"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { EventCalendar, type CalendarEvent } from "./";
import type { UnifiedCalendarEvent } from "@/features/calendar";

export default function EventCalendarApp({
  initialEvents,
  readOnly = false,
}: {
  initialEvents: UnifiedCalendarEvent[];
  readOnly?: boolean;
}) {
  const router = useRouter();

  const adaptedInitial = useMemo<CalendarEvent[]>(() => {
    return (initialEvents || []).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.metadata ? JSON.stringify(e.metadata) : undefined,
      start: new Date(e.startAt),
      end: new Date(e.endAt),
      allDay: e.allDay,
      color: (e.color as any) || "sky",
      location: undefined,
    }));
  }, [initialEvents]);

  const [events, setEvents] = useState<CalendarEvent[]>(adaptedInitial);

  const eventUrlById = useMemo(() => {
    return new Map<string, string>(initialEvents.map((e) => [e.id, e.url]));
  }, [initialEvents]);

  const handleEventSelect = (event: CalendarEvent) => {
    const url = eventUrlById.get(event.id);
    if (url) router.push(url);
  };

  return (
    <EventCalendar
      events={events}
      readOnly={readOnly}
      onEventSelect={handleEventSelect}
      onEventAdd={readOnly ? undefined : (event) => setEvents((prev) => [...prev, event])}
      onEventUpdate={
        readOnly
          ? undefined
          : (updatedEvent) =>
              setEvents((prev) => prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev)))
      }
      onEventDelete={
        readOnly ? undefined : (eventId) => setEvents((prev) => prev.filter((ev) => ev.id !== eventId))
      }
    />
  );
}
