import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/auth/server";

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
  
  // Buscar tarefas + eventos virtuais
  const result = await tarefasService.listarTarefasComEventos(user.id, isSuperAdmin);
  if (!result.success) {
    return <div className="p-6">Erro ao carregar tarefas: {result.error.message}</div>;
  }

  // Buscar quadros
  const quadrosResult = await tarefasService.listarQuadros(user.id);
  const quadros = quadrosResult.success ? quadrosResult.data : [];

  return <TarefasClient data={result.data} quadros={quadros} />;
}
