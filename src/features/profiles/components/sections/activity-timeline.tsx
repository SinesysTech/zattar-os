"use client";

import { useState } from "react";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  RefreshCw,
  Calendar,
  Link,
  Activity,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarData } from "@/features/partes/utils/format";
import { cn } from "@/lib/utils";

interface Activity {
  id?: number | string;
  title?: string;
  descricao?: string;
  description?: string;
  detalhes?: string;
  created_at?: string;
  type?: string;
  tipo?: string;
  processo_numero?: string;
  trt?: string;
  status?: string;
}

interface ActivityTimelineProps {
  data: Activity[] | Record<string, unknown>;
  isLoading?: boolean;
  error?: string;
}

// Mapeamento de ícones por tipo de atividade
function getActivityIcon(type: string | undefined) {
  switch (type) {
    case "criacao":
      return {
        icon: UserPlus,
        colorClass: "text-emerald-600 dark:text-emerald-400",
        bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      };
    case "vinculacao_processo":
    case "vinculacao":
      return {
        icon: Link,
        colorClass: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-100 dark:bg-blue-900/30",
      };
    case "atualizacao_dados":
    case "atualizacao":
      return {
        icon: RefreshCw,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-100 dark:bg-green-900/30",
      };
    case "audiencia":
      return {
        icon: Calendar,
        colorClass: "text-orange-600 dark:text-orange-400",
        bgClass: "bg-orange-100 dark:bg-orange-900/30",
      };
    case "documento":
      return {
        icon: FileText,
        colorClass: "text-purple-600 dark:text-purple-400",
        bgClass: "bg-purple-100 dark:bg-purple-900/30",
      };
    default:
      return {
        icon: Activity,
        colorClass: "text-muted-foreground",
        bgClass: "bg-muted",
      };
  }
}

// Formata a data de forma segura
function formatDateSafe(dateStr: string | undefined): {
  absolute: string;
  relative: string;
} {
  if (!dateStr) {
    return { absolute: "-", relative: "" };
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { absolute: "-", relative: "" };
    }

    return {
      absolute: formatarData(dateStr),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: ptBR }),
    };
  } catch {
    return { absolute: "-", relative: "" };
  }
}

// Badge de status para audiências
function StatusBadge({ status }: { status: string | undefined }) {
  if (!status) return null;

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    agendada: { label: "Agendada", variant: "secondary" },
    realizada: { label: "Realizada", variant: "default" },
    cancelada: { label: "Cancelada", variant: "destructive" },
    adiada: { label: "Adiada", variant: "outline" },
  };

  const config = statusConfig[status.toLowerCase()] || { label: status, variant: "outline" as const };

  return (
    <Badge variant={config.variant} className="ml-2 text-xs">
      {config.label}
    </Badge>
  );
}

// Skeleton loader para o loading state
function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({ data, isLoading, error }: ActivityTimelineProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // If data is the entity object, look for 'activities' or similar
  const activities = Array.isArray(data)
    ? data
    : ((data as Record<string, unknown>)?.activities as Activity[] || []);

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const paginatedActivities = activities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineSkeleton />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhuma atividade recente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Histórico de Atividades</CardTitle>
          <span className="text-xs text-muted-foreground">
            {activities.length} {activities.length === 1 ? "atividade" : "atividades"} no total
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Timeline>
            {paginatedActivities.map((activity: Activity, idx: number) => {
              const activityType = activity.type || activity.tipo;
              const { icon: Icon, colorClass, bgClass } = getActivityIcon(activityType);
              const { absolute, relative } = formatDateSafe(activity.created_at);
              const description = activity.description || activity.descricao || activity.detalhes;
              const isVinculacao = activityType === "vinculacao_processo" || activityType === "vinculacao";
              const isAtualizacao = activityType === "atualizacao_dados" || activityType === "atualizacao";
              const isAudiencia = activityType === "audiencia";

              return (
                <TimelineItem
                  key={activity.id || `${page}-${idx}`}
                  step={idx + 1}
                  className="hover:bg-muted/50 rounded-lg transition-colors -ml-2 pl-2"
                >
                  <TimelineHeader>
                    <TimelineSeparator />
                    <div className="flex items-center gap-2">
                      {isAtualizacao && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      )}
                      <TimelineTitle>
                        {activity.title || activity.descricao}
                        {isAudiencia && <StatusBadge status={activity.status} />}
                      </TimelineTitle>
                    </div>
                    <TimelineIndicator
                      className={cn(
                        "flex items-center justify-center",
                        bgClass,
                        "border-0 size-5"
                      )}
                    >
                      <Icon className={cn("h-3 w-3", colorClass)} />
                    </TimelineIndicator>
                  </TimelineHeader>
                  <TimelineContent>
                    {/* Detalhes específicos por tipo */}
                    {isVinculacao && activity.processo_numero && (
                      <div className="text-sm mb-1">
                        <span className="font-medium text-foreground">
                          Processo: {activity.processo_numero}
                        </span>
                        {activity.trt && (
                          <span className="text-muted-foreground ml-2">
                            ({activity.trt})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Descrição com truncamento */}
                    {description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-muted-foreground line-clamp-2 cursor-default">
                            {description}
                          </div>
                        </TooltipTrigger>
                        {description.length > 100 && (
                          <TooltipContent
                            side="bottom"
                            className="max-w-sm"
                          >
                            <p className="text-sm">{description}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}

                    {/* Data formatada */}
                    {activity.created_at && (
                      <TimelineDate className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">{absolute}</span>
                        {relative && (
                          <span className="text-xs text-muted-foreground">
                            ({relative})
                          </span>
                        )}
                      </TimelineDate>
                    )}
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </TooltipProvider>

        {/* Controles de paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="gap-1"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
