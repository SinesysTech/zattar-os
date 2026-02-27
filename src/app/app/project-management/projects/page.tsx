import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import * as projectService from "../lib/services/project.service";
import { ProjectListView } from "./project-list-view";

export async function generateMetadata() {
  return generateMeta({
    title: "Projetos",
    description: "Lista de projetos da gestão de projetos.",
    canonical: "/app/project-management/projects",
  });
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await projectService.listarProjetos({
    limite: 100,
    ordenarPor: "created_at",
    ordem: "desc",
  });

  const projetos = result.success ? result.data.data : [];

  return <ProjectListView projetos={projetos} />;
}
