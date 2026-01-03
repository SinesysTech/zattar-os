import type { Metadata } from "next";
import KanbanBoard from "./components/kanban-board";

export const metadata: Metadata = {
  title: "Kanban Board",
  description:
    "Create a layout where you can easily manage your projects and tasks with the Kanban template. Built with shadcn/ui, React, Next.js and Tailwind CSS.",
};

export default function Page() {
  return <KanbanBoard />;
}
