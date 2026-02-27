import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import * as projectService from "../../../lib/services/project.service";
import * as taskService from "../../../lib/services/task.service";
import * as teamService from "../../../lib/services/team.service";
import { ProjectTasksView } from "./project-tasks-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success ? `Tarefas — ${result.data.nome}` : "Tarefas";
  return generateMeta({
    title,
    canonical: `/app/project-management/projects/${id}/tasks`,
  });
}

export default async function ProjectTasksPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projetoResult, tarefasResult, membrosResult] = await Promise.all([
    projectService.buscarProjeto(id),
    taskService.listarTarefasPorProjeto(id),
    teamService.listarMembros(id),
  ]);

  if (!projetoResult.success) notFound();

  const projeto = projetoResult.data;
  const tarefas = tarefasResult.success ? tarefasResult.data : [];
  const membros = membrosResult.success ? membrosResult.data : [];

  const membroOptions = membros.map((m) => ({
    value: String(m.usuarioId),
    label: m.usuarioNome ?? "Membro",
  }));

  return (
    <ProjectTasksView
      projeto={projeto}
      tarefas={tarefas}
      membros={membroOptions}
      usuarioAtualId={user.id}
    />
  );
}
