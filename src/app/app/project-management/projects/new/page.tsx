import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import { createDbClient } from "@/lib/supabase";
import { ProjectForm } from "../../components/projects/project-form";

export async function generateMetadata() {
  return generateMeta({
    title: "Novo Projeto",
    description: "Criar novo projeto na gestão de projetos.",
    canonical: "/app/project-management/projects/new",
  });
}

async function fetchFormOptions() {
  const db = createDbClient();

  const [clientesRes, usuariosRes] = await Promise.all([
    db
      .from("clientes")
      .select("id, nome_completo")
      .order("nome_completo"),
    db
      .from("usuarios")
      .select("id, nome_completo")
      .eq("ativo", true)
      .order("nome_completo"),
  ]);

  const clientes = (clientesRes.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.nome_completo as string,
  }));

  const usuarios = (usuariosRes.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.nome_completo as string,
  }));

  return { clientes, usuarios };
}

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { clientes, usuarios } = await fetchFormOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ProjectForm
        clientes={clientes}
        usuarios={usuarios}
        usuarioAtualId={user.id}
      />
    </div>
  );
}
