import type { Metadata } from "next";

import { authenticateRequest } from "@/lib/auth/session";

import * as kanbanService from "./service";
import KanbanBoard from "./components/kanban-board";

export const metadata: Metadata = {
  title: "Kanban",
  description: "Quadro Kanban para gerenciar tarefas e projetos.",
};

export default async function Page() {
  const user = await authenticateRequest();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const result = await kanbanService.obterKanban(user.id);
  if (!result.success) {
    return <div className="p-6">Erro ao carregar Kanban: {result.error.message}</div>;
  }

  return <KanbanBoard initialBoard={result.data} />;
}
