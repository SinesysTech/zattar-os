import type { Metadata } from "next";
import { authenticateRequest } from "@/lib/auth/session";
import NotesApp from "./note-app";
import * as notasService from "./service";

export const metadata: Metadata = {
  title: "Notas",
  description: "Crie, organize e gerencie suas notas.",
};

export default async function Page() {
  const user = await authenticateRequest();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  // Carrega todas (inclui arquivadas) para permitir alternância na UI sem novo roundtrip.
  const result = await notasService.listarDadosNotas(user.id, { includeArchived: true });
  if (!result.success) {
    return <div className="p-6">Erro ao carregar Notas: {result.error.message}</div>;
  }

  return <NotesApp initialData={result.data} />;
}
