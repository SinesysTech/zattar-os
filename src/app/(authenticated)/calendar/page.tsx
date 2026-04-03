import { redirect } from "next/navigation";

/**
 * Redirect: /app/calendar -> /app/agenda
 * Mantido para backward-compatibility com bookmarks e links existentes.
 */
export default function CalendarRedirect() {
  redirect("/app/agenda");
}
