import type { Metadata } from "next";
import EventCalendarApp from "./components/event-calendar-app";

export const metadata: Metadata = {
  title: "Event Calendar",
  description:
    "Plan your events or tasks in an organized way with the Calendar app template. Built with shadcn/ui, Next.js, Tailwind CSS ve React.",
};

export default function Page() {
  return <EventCalendarApp />;
}
