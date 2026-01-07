import { authenticateRequest } from "@/lib/auth/session";
import * as tarefasService from "@/app/app/tarefas/service";
import type { Task } from "@/app/app/tarefas/domain";
import { RecentTasksClient } from "./recent-tasks-client";

export async function RecentTasks() {
  const user = await authenticateRequest();
  if (!user) {
    return null;
  }

  const result = await tarefasService.listarTarefas(user.id, { limit: 5 });
  const tasks: Task[] = result.success ? result.data : [];

  return <RecentTasksClient initialTasks={tasks} />;
}
