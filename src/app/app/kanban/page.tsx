import type { Metadata } from "next";

import { authenticateRequest } from "@/lib/auth/session";
import { PageShell } from "@/components/shared/page-shell";
import { kanbanService } from "@/features/kanban";
import { KanbanPageContent } from "@/features/kanban/components/kanban-page-content";

export const metadata: Metadata = {
  title: "Kanban",
  description: "Quadro Kanban para gerenciar tarefas e projetos.",
};

export default async function Page() {
  const user = await authenticateRequest();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  // Carregar boards + dados do primeiro board
  const boardsResult = await kanbanService.listarQuadros(user.id);
  if (!boardsResult.success) {
    return <div className="p-6">Erro ao carregar quadros: {boardsResult.error.message}</div>;
  }

  const boards = boardsResult.data;
  const defaultBoard = boards[0];

  if (!defaultBoard) {
    return <div className="p-6">Nenhum quadro disponível.</div>;
  }

  // Carregar dados do board default
  let initialData;
  let initialType: "system" | "custom";

  if (defaultBoard.tipo === "system" && defaultBoard.source) {
    const result = await kanbanService.obterQuadroSistema(defaultBoard.source);
    initialData = result.success ? result.data : { columns: [], cardsByColumn: {} };
    initialType = "system";
  } else {
    const result = await kanbanService.obterQuadroCustom(user.id, defaultBoard.id);
    initialData = result.success ? result.data : { columns: [], tasksByColumn: {} };
    initialType = "custom";
  }

  return (
    <PageShell>
      <KanbanPageContent
        boards={boards}
        initialBoardId={defaultBoard.id}
        initialBoardData={initialData}
        initialBoardType={initialType}
      />
    </PageShell>
  );
}
