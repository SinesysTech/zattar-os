import type { Metadata } from "next";
import { authenticateRequest } from "@/lib/auth/session";
import * as todoService from "./service";
import Tasks from "./tasks";

export const metadata: Metadata = {
  title: "To-Do List",
  description: "Gerenciamento de tarefas e listas de afazeres.",
};

export default async function TodoPage() {
  const user = await authenticateRequest();
  if (!user) {
    return <div className="p-6">Você precisa estar autenticado.</div>;
  }

  const result = await todoService.listarTodos(user.id);
  if (!result.success) {
    return <div className="p-6">Erro ao carregar to-dos: {result.error.message}</div>;
  }

  return <Tasks todos={result.data} />;
}

