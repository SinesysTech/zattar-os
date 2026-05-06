"use client";

import { Calendar, User, ExternalLink } from "lucide-react";
import Link from "next/link";

import { AppBadge } from "@/components/ui/app-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/event-aggregation/domain";
import type { SystemBoardEventItem } from "../service";

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-success",
};

interface SystemBoardCardProps {
  event: SystemBoardEventItem;
}

export function SystemBoardCard({ event }: SystemBoardCardProps) {
  const colorClass = PRIORITY_COLORS[event.priority] ?? "border-l-info";
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
      <CardHeader className={cn("inset-medium pb-1")}>
        <div className={cn("flex items-center inline-snug flex-wrap")}>
          {sourceLabel && (
            <AppBadge variant="outline" className={cn("text-[10px] px-1 py-0")}>
              {sourceLabel}
            </AppBadge>
          )}
          {event.prazoVencido && (
            <AppBadge variant="destructive" className={cn("text-[10px] px-1 py-0")}>
              Vencido
            </AppBadge>
          )}
        </div>
        <CardTitle className={cn(/* design-system-escape: leading-tight sem token DS */ "text-body-sm font-medium leading-tight line-clamp-2")}>
          {event.title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("inset-medium pt-0")}>
        <div className={cn("flex items-center justify-between text-caption text-muted-foreground")}>
          <div className={cn("flex items-center inline-tight")}>
            {dueDate && (
              <span className={cn("flex items-center inline-micro")}>
                <Calendar className="h-3 w-3" />
                {dueDate}
              </span>
            )}
            {event.responsavelNome && (
              <span className={cn("flex items-center inline-micro")}>
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
