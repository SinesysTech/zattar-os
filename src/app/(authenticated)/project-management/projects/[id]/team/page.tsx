import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import { createDbClient } from "@/lib/supabase";
import * as projectService from "../../../lib/services/project.service";
import * as teamService from "../../../lib/services/team.service";
import { TeamView } from "./team-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success ? `Equipe — ${result.data.nome}` : "Equipe";
  return generateMeta({
    title,
    canonical: `/app/project-management/projects/${id}/team`,
  });
}

export default async function ProjectTeamPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = createDbClient();

  const [projetoResult, membrosResult, usuariosRes] = await Promise.all([
    projectService.buscarProjeto(id),
    teamService.listarMembros(id),
    db
      .from("usuarios")
      .select("id, nome_completo")
      .eq("ativo", true)
      .order("nome_completo"),
  ]);

  if (!projetoResult.success) notFound();

  const projeto = projetoResult.data;
  const membros = membrosResult.success ? membrosResult.data : [];
  const usuarios = (usuariosRes.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.nome_completo as string,
  }));

  return (
    <TeamView projeto={projeto} membros={membros} usuarios={usuarios} />
  );
}
