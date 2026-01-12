import type { Metadata } from "next";
import { startOfMonth, endOfMonth } from "date-fns";

import EventCalendarApp from "./components/event-calendar-app";
import { actionListarEventosCalendar, type UnifiedCalendarEvent } from "@/features/calendar";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Event Calendar",
    description:
      "Plan your events or tasks in an organized way with the Calendar app template. Built with shadcn/ui, Next.js, Tailwind CSS ve React.",
  };
}

export default async function Page() {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const result = await actionListarEventosCalendar({
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  });

  const events: UnifiedCalendarEvent[] = result.success ? result.data : [];

  return <EventCalendarApp initialEvents={events} readOnly />;
}
