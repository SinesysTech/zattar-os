import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/server";
import { PageShell } from "@/components/shared/page-shell";

import { TarefasClient } from "./tarefas-client";
import * as tarefasService from "./service";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Gerenciamento de tarefas e eventos do sistema.",
};

export default async function TaskPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const isSuperAdmin = user.roles.includes("admin");
  const result = await tarefasService.listarTarefasComEventos(user.id, isSuperAdmin);
  if (!result.success) {
    return <div className="p-6">Erro ao carregar tarefas: {result.error.message}</div>;
  }

  return (
    <PageShell>
      <TarefasClient data={result.data} />
    </PageShell>
  );
}
