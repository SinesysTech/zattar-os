import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import * as taskService from "../lib/services/task.service";
import { GlobalTasksView } from "./global-tasks-view";

export async function generateMetadata() {
  return generateMeta({
    title: "Tarefas",
    description: "Visão global de todas as tarefas cross-projeto.",
    canonical: "/app/project-management/tasks",
  });
}

export default async function GlobalTasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await taskService.listarTarefasGlobal({
    limite: 100,
    ordenarPor: "created_at",
    ordem: "desc",
  });

  const tarefas = result.success ? result.data.data : [];

  return <GlobalTasksView tarefas={tarefas} />;
}
