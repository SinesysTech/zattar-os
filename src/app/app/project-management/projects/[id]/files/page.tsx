import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import * as projectService from "../../../lib/services/project.service";
import { actionListarAnexos } from "../../../lib/actions/file.actions";
import { FilesView } from "./files-view";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success ? `Arquivos — ${result.data.nome}` : "Arquivos";
  return generateMeta({
    title,
    canonical: `/app/project-management/projects/${id}/files`,
  });
}

export default async function ProjectFilesPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projetoResult, anexosResult] = await Promise.all([
    projectService.buscarProjeto(id),
    actionListarAnexos(id),
  ]);

  if (!projetoResult.success) notFound();

  const projeto = projetoResult.data;
  const anexos = anexosResult.success ? anexosResult.data : [];

  return (
    <FilesView
      projeto={projeto}
      anexos={anexos}
      usuarioAtualId={user.id}
    />
  );
}
