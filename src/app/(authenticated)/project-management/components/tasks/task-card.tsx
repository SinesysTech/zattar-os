"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, ListTree } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { generateAvatarFallback } from "@/lib/avatar-url";
import { PriorityIndicator } from "../shared/priority-indicator";
import type { Tarefa } from "../../domain";

interface TaskCardProps {
  tarefa: Tarefa;
  isDragOverlay?: boolean;
}

export function TaskCard({ tarefa, isDragOverlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const prazoFormatado = tarefa.dataPrazo
    ? new Date(tarefa.dataPrazo).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    : null;

  const isPrazoPerto = tarefa.dataPrazo
    ? new Date(tarefa.dataPrazo).getTime() - Date.now() <
    3 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
    >
      <Card
        className={cn(
          "cursor-grab active:cursor-grabbing",
          isDragOverlay && "shadow-lg ring-2 ring-primary/20"
        )}
      >
        <CardContent className={cn(/* design-system-escape: p-3 → usar <Inset> */ "p-3")}>
          <div className={cn("flex items-start inline-tight")}>
            <button
              className="text-muted-foreground mt-0.5 shrink-0 cursor-grab hover:text-foreground"
              {...(isDragOverlay ? {} : listeners)}
            >
              <GripVertical className="size-4" />
            </button>

            <div className={cn("min-w-0 flex-1 stack-tight")}>
              <Text variant="label" as="p" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; leading-tight sem token DS */ "font-medium leading-tight")}>
                {tarefa.titulo}
              </Text>

              <div className={cn("flex items-center inline-tight flex-wrap")}>
                <PriorityIndicator
                  prioridade={tarefa.prioridade}
                  showLabel={false}
                />

                {prazoFormatado && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${isPrazoPerto
                        ? "text-destructive"
                        : "text-muted-foreground"
                      }`}
                  >
                    <Calendar className="size-3" />
                    {prazoFormatado}
                  </span>
                )}

                {(tarefa.subtarefasCount ?? 0) > 0 && (
                  <Text variant="caption" className="inline-flex items-center gap-1">
                    <ListTree className="size-3" />
                    {tarefa.subtarefasConcluidas ?? 0}/
                    {tarefa.subtarefasCount}
                  </Text>
                )}
              </div>

              {tarefa.responsavelNome && (
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                  <Avatar size="xs">
                    <AvatarImage
                      src={tarefa.responsavelAvatar ?? ""}
                      alt={tarefa.responsavelNome}
                    />
                    <AvatarFallback className="text-[10px]">
                      {generateAvatarFallback(tarefa.responsavelNome)}
                    </AvatarFallback>
                  </Avatar>
                  <Text variant="caption" className="truncate">
                    {tarefa.responsavelNome}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
