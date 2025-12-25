import { promises as fs } from "fs";
import path from "path";
import { type Metadata } from "next";
import { z } from "zod";

import { columns } from "./components/tasks/columns";
import { DataTable } from "./components/tasks/data-table";
import { taskSchema } from "./data/schema";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tasks",
    description: "A task and issue tracker build using Tanstack Table.",
  };
}

// Simulate a database read for tasks.
async function getTasks() {
  const data = await fs.readFile(
    path.join(process.cwd(), "src/features/tasks/data/tasks.json")
  );

  const tasks = JSON.parse(data.toString());

  return z.array(taskSchema).parse(tasks);
}

export default async function TaskPage() {
  const tasks = await getTasks();

  return <DataTable data={tasks} columns={columns} />;
}
