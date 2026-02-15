import type { Metadata } from "next";

import { authenticateRequest } from "@/lib/auth/session";
import { kanbanService } from "@/features/kanban";
import CustomBoardView from "@/features/kanban/components/custom-board-view";

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

  return <CustomBoardView initialBoard={result.data} />;
}
