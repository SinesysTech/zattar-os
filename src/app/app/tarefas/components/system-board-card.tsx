"use client";

import { Calendar, User, ExternalLink } from "lucide-react";
import Link from "next/link";

import { AppBadge } from "@/components/ui/app-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/event-aggregation/domain";
import type { SystemBoardEventItem } from "../service";

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-rose-500",
  medium: "border-l-amber-500",
  low: "border-l-emerald-500",
};

interface SystemBoardCardProps {
  event: SystemBoardEventItem;
}

export function SystemBoardCard({ event }: SystemBoardCardProps) {
  const colorClass = PRIORITY_COLORS[event.priority] ?? "border-l-sky-500";
  const sourceLabel = event.source
    ? SOURCE_LABELS[event.source as keyof typeof SOURCE_LABELS]
    : undefined;

  const dueDate = event.dueDate
    ? new Date(event.dueDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <Card className={cn("border-l-4 transition-colors hover:bg-accent/50", colorClass)}>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {sourceLabel && (
            <AppBadge variant="outline" className="text-[10px] px-1 py-0">
              {sourceLabel}
            </AppBadge>
          )}
          {event.prazoVencido && (
            <AppBadge variant="destructive" className="text-[10px] px-1 py-0">
              Vencido
            </AppBadge>
          )}
        </div>
        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
          {event.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dueDate}
              </span>
            )}
            {event.responsavelNome && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {event.responsavelNome}
              </span>
            )}
          </div>
          {event.url && (
            <Link href={event.url} className="hover:text-primary">
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
