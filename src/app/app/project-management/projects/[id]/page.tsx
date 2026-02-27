import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/server";
import { generateMeta } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{projeto.nome}</h1>
          <div className="flex items-center gap-3">
            <ProjectStatusBadge status={projeto.status} />
            <PriorityIndicator prioridade={projeto.prioridade} />
            {projeto.clienteNome && (
              <span className="text-muted-foreground text-sm">
                {projeto.clienteNome}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link
            href={`/app/project-management/projects/${projeto.id}/settings`}
          >
            <Settings className="mr-1 size-4" />
            Configurações
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">
            Tarefas ({tarefas.length})
          </TabsTrigger>
          <TabsTrigger value="team">
            Equipe ({membros.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Progresso</CardDescription>
                <CardTitle className="text-2xl">
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
                <CardTitle className="text-2xl">
                  {tarefasConcluidas}/{tarefas.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {tarefasPendentes} pendentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Orçamento</CardDescription>
                <CardTitle className="text-2xl">
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
                  <p className="text-muted-foreground text-sm">
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
                <CardTitle className="text-2xl">
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
              <dl className="grid grid-cols-2 gap-4 text-sm">
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
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Tags</dt>
                    <dd className="flex gap-1 flex-wrap mt-1">
                      {projeto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-muted rounded-md px-2 py-0.5 text-xs"
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
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tarefas do Projeto</CardTitle>
              <Button asChild size="sm">
                <Link
                  href={`/app/project-management/projects/${projeto.id}/tasks`}
                >
                  Ver Quadro Kanban
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tarefas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma tarefa criada.
                </p>
              ) : (
                <div className="divide-y">
                  {tarefas.map((tarefa) => (
                    <div
                      key={tarefa.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">{tarefa.titulo}</p>
                        <p className="text-muted-foreground text-sm">
                          {tarefa.responsavelNome ?? "Sem responsável"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityIndicator
                          prioridade={tarefa.prioridade}
                          showLabel={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              {membros.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum membro na equipe.
                </p>
              ) : (
                <div className="divide-y">
                  {membros.map((membro) => (
                    <div
                      key={membro.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {membro.usuarioNome ?? "Usuário"}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {membro.usuarioEmail}
                          </p>
                        </div>
                      </div>
                      <span className="bg-muted rounded-md px-2 py-0.5 text-xs capitalize">
                        {membro.papel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
