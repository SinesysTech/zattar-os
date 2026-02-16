import type { Metadata } from "next";

import { authenticateRequest } from "@/lib/auth/session";
import { PageShell } from "@/components/shared/page-shell";
import { DataShell } from "@/components/shared/data-shell";
import { DataTableToolbar } from "@/components/shared/data-shell/data-table-toolbar";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import * as tarefasService from "./service";

export const metadata: Metadata = {
  title: "Tarefas",
  description: "Gerenciamento de tarefas (template TanStack Table).",
};

export default async function TaskPage() {
  const user = await authenticateRequest();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const result = await tarefasService.listarTarefas(user.id, {});
  if (!result.success) {
    return <div className="p-6">Erro ao carregar tarefas: {result.error.message}</div>;
  }

  return (
    <PageShell>
      <DataShell header={<DataTableToolbar title="Tarefas" />}>
        <DataTable data={result.data} columns={columns} />
      </DataShell>
    </PageShell>
  );
}
