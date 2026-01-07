import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { authenticateRequest } from "@/lib/auth/session";
import * as tarefasService from "./service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Gerenciamento de tarefas (template TanStack Table).",
};

export default async function TaskPage() {
  const user = await authenticateRequest();
  if (!user) {
    // Mantém a página simples; login/redirect fica a cargo do middleware/layout do app.
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const result = await tarefasService.listarTarefas(user.id, {});
  if (!result.success) {
    return <div className="p-6">Erro ao carregar tarefas: {result.error.message}</div>;
  }

  return <DataTable data={result.data} columns={columns} />;
}
