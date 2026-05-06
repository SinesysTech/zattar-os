import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta, cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  FileText,
  Pencil,
  Settings,
  Users,
} from "lucide-react";
import { Heading, Text } from '@/components/ui/typography';
import * as projectService from "../../lib/services/project.service";
import * as taskService from "../../lib/services/task.service";
import * as teamService from "../../lib/services/team.service";
import { ProjectStatusBadge } from "../../components/shared/project-status-badge";
import { ProgressIndicator } from "../../components/shared/progress-indicator";
import { PriorityIndicator } from "../../components/shared/priority-indicator";
import { MemberAvatarGroup } from "../../components/shared/member-avatar-group";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await projectService.buscarProjeto(id);
  const title = result.success ? result.data.nome : "Projeto";
  return generateMeta({
    title,
    description: `Detalhes do projeto ${title}`,
    canonical: `/app/project-management/projects/${id}`,
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projetoResult, tarefasResult, membrosResult] = await Promise.all([
    projectService.buscarProjeto(id),
    taskService.listarTarefasPorProjeto(id),
    teamService.listarMembros(id),
  ]);

  if (!projetoResult.success) notFound();
  const projeto = projetoResult.data;
  const tarefas = tarefasResult.success ? tarefasResult.data : [];
  const membros = membrosResult.success ? membrosResult.data : [];

  const tarefasConcluidas = tarefas.filter(
    (t) => t.status === "concluido"
  ).length;
  const tarefasPendentes = tarefas.filter(
    (t) => t.status !== "concluido" && t.status !== "cancelado"
  ).length;

  const basePath = `/app/project-management/projects/${projeto.id}`;

  const navLinks = [
    { href: `${basePath}/tasks`, label: "Tarefas", count: tarefas.length, icon: ClipboardList },
    { href: `${basePath}/team`, label: "Equipe", count: membros.length, icon: Users },
    { href: `${basePath}/files`, label: "Arquivos", icon: FileText },
  ];

  return (
    <div className={cn("stack-loose")}>
      <div className="flex items-center justify-between">
        <div className={cn("stack-micro")}>
          <Heading level="page">{projeto.nome}</Heading>
          <div className={cn("flex items-center inline-medium")}>
            <ProjectStatusBadge status={projeto.status} />
            <PriorityIndicator prioridade={projeto.prioridade} />
            {projeto.clienteNome && (
              <span className={cn("text-muted-foreground text-body-sm")}>
                {projeto.clienteNome}
              </span>
            )}
          </div>
        </div>
        <div className={cn("flex items-center inline-tight")}>
          <Button variant="outline" asChild>
            <Link href={`${basePath}/edit`}>
              <Pencil className="mr-1 size-4" />
              Editar
            </Link>
          </Button>
          <Button variant="outline" size="icon" aria-label="Configurações" asChild>
            <Link href={`${basePath}/settings`}>
              <Settings className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Links de navegação para sub-rotas */}
      <nav className={cn("flex inline-tight")}>
        {navLinks.map((link) => (
          <Button key={link.href} variant="outline" size="sm" asChild>
            <Link href={link.href}>
              <link.icon className="mr-1 size-4" />
              {link.label}
              {link.count != null && (
                <Text variant="caption" className="bg-muted ml-1 rounded-full px-1.5 py-0.5">
                  {link.count}
                </Text>
              )}
            </Link>
          </Button>
        ))}
      </nav>

      {/* Visão Geral — conteúdo principal */}
      <div className={cn("stack-default")}>
        <div className={cn("grid inline-default md:grid-cols-2 lg:grid-cols-4")}>
          <Card>
            <CardHeader>
              <CardDescription>Progresso</CardDescription>
              <CardTitle className="text-page-title">
                {projeto.progresso}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressIndicator
                value={projeto.progresso}
                showLabel={false}
                size="md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Tarefas</CardDescription>
              <CardTitle className="text-page-title">
                {tarefasConcluidas}/{tarefas.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-muted-foreground text-body-sm")}>
                {tarefasPendentes} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Orçamento</CardDescription>
              <CardTitle className="text-page-title">
                {projeto.orcamento != null
                  ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(projeto.orcamento)
                  : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projeto.valorGasto != null && (
                <p className={cn("text-muted-foreground text-body-sm")}>
                  Gasto:{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(projeto.valorGasto)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Equipe</CardDescription>
              <CardTitle className="text-page-title">
                {membros.length} membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberAvatarGroup membros={membros} max={5} />
            </CardContent>
          </Card>
        </div>

        {projeto.descricao && (
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {projeto.descricao}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className={cn("grid grid-cols-1 inline-default text-body-sm sm:grid-cols-2")}>
              <div>
                <dt className="text-muted-foreground">Responsável</dt>
                <dd>{projeto.responsavelNome ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Data de Início</dt>
                <dd>
                  {projeto.dataInicio
                    ? new Date(projeto.dataInicio).toLocaleDateString(
                      "pt-BR"
                    )
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  Previsão de Conclusão
                </dt>
                <dd>
                  {projeto.dataPrevisaoFim
                    ? new Date(
                      projeto.dataPrevisaoFim
                    ).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Criado em</dt>
                <dd>
                  {new Date(projeto.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              {projeto.tags.length > 0 && (
                <div className="col-span-full">
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className={cn("flex inline-micro flex-wrap mt-1")}>
                    {projeto.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn("bg-muted rounded-md px-2 py-0.5 text-caption")}
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
