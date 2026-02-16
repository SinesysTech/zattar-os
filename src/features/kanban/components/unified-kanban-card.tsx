"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, User, ExternalLink } from "lucide-react";

import { AppBadge } from "@/components/ui/app-badge";
import { SemanticBadge } from "@/components/ui/semantic-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { UnifiedKanbanCard as UnifiedKanbanCardType } from "../domain";

const COLOR_CLASSES: Record<string, string> = {
  sky: "border-l-sky-500",
  amber: "border-l-amber-500",
  rose: "border-l-rose-500",
  emerald: "border-l-emerald-500",
};

interface UnifiedKanbanCardProps {
  card: UnifiedKanbanCardType;
}

export function UnifiedKanbanCard({ card }: UnifiedKanbanCardProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (card.url) router.push(card.url);
  };

  const colorClass = COLOR_CLASSES[card.color ?? ""] ?? "";
  const trt = card.metadata?.trt as string | undefined;
  const dueDate = card.dataVencimento
    ? new Date(card.dataVencimento).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <Card
      className={cn(
        "cursor-pointer border-l-4 transition-colors hover:bg-accent/50",
        colorClass
      )}
      onClick={handleClick}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center gap-1.5">
          {trt && (
            <SemanticBadge category="tribunal" value={trt} className="text-[10px] px-1 py-0">
              {trt}
            </SemanticBadge>
          )}
          {card.prazoVencido && (
            <AppBadge variant="destructive" className="text-[10px] px-1 py-0">
              Vencido
            </AppBadge>
          )}
        </div>
        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
          {card.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-1.5">
        {card.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {card.descricao}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dueDate}
              </span>
            )}
            {card.responsavelNome && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {card.responsavelNome}
              </span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </TooltipTrigger>
            <TooltipContent>Abrir no módulo</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
