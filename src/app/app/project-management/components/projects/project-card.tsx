import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectStatusBadge } from "../shared/project-status-badge";
import { ProgressIndicator } from "../shared/progress-indicator";
import { MemberAvatarGroup } from "../shared/member-avatar-group";
import type { Projeto } from "../../lib/domain";

interface ProjectCardProps {
  projeto: Projeto;
}

function formatDeadline(dataPrevisaoFim: string | null): string | null {
  if (!dataPrevisaoFim) return null;
  const prazo = new Date(dataPrevisaoFim);
  const hoje = new Date();
  const diffDias = Math.ceil(
    (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDias < 0) return `${Math.abs(diffDias)}d atraso`;
  if (diffDias === 0) return "Hoje";
  return `${diffDias}d restantes`;
}

function getDeadlineColor(dataPrevisaoFim: string | null): string {
  if (!dataPrevisaoFim) return "bg-gray-500";
  const prazo = new Date(dataPrevisaoFim);
  const hoje = new Date();
  const diffDias = Math.ceil(
    (prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDias < 0) return "bg-red-500";
  if (diffDias <= 7) return "bg-yellow-500";
  return "bg-green-500";
}

export function ProjectCard({ projeto }: ProjectCardProps) {
  const deadlineText = formatDeadline(projeto.dataPrevisaoFim);
  const deadlineColor = getDeadlineColor(projeto.dataPrevisaoFim);

  return (
    <Link href={`/app/project-management/projects/${projeto.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{projeto.nome}</CardTitle>
          <CardDescription>
            {projeto.clienteNome ?? "Sem cliente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground mb-4 text-sm">
            {projeto.dataInicio
              ? new Date(projeto.dataInicio).toLocaleDateString("pt-BR")
              : "Sem data de início"}
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm opacity-90">Progresso</span>
              <span className="text-sm font-semibold">
                {projeto.progresso}%
              </span>
            </div>
            <ProgressIndicator
              value={projeto.progresso}
              showLabel={false}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {projeto.membros && projeto.membros.length > 0 && (
                <MemberAvatarGroup membros={projeto.membros} max={3} />
              )}
            </div>

            <div className="flex items-center gap-2">
              <ProjectStatusBadge status={projeto.status} />
              {deadlineText && (
                <span
                  className={`${deadlineColor} rounded-full px-2 py-0.5 text-xs text-white`}
                >
                  {deadlineText}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
