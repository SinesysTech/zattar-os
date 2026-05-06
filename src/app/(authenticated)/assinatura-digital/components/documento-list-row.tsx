"use client";

import { cn } from '@/lib/utils';
import { Camera, ChevronRight, FileText } from "lucide-react";
import { IconContainer } from '@/components/ui/icon-container';
import { ProgressRing } from "@/app/(authenticated)/dashboard/widgets/primitives";
import type { DocumentoCardData } from '@/shared/assinatura-digital/adapters/documento-card-adapter';
import { STATUS_CONFIG, getSignerProgress, timeAgo } from "./documento-card";
import { Text } from '@/components/ui/typography';

interface DocumentListRowProps {
  doc: DocumentoCardData;
  onSelect: (d: DocumentoCardData) => void;
  selected: boolean;
}

export function DocumentListRow({ doc, onSelect, selected }: DocumentListRowProps) {
  const cfg = STATUS_CONFIG[doc.status];
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(
    (a) => a.status === "pendente" && (a.diasPendente ?? 0) > 7
  );

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all
        ${
          selected
            ? "bg-primary/6 border border-primary/15"
            : `hover:bg-foreground/4 border border-transparent ${hasPendingLong ? "ring-1 ring-warning/10" : ""}`
        }`}
    >
      <IconContainer size="md" className={cfg.bg}>
        <cfg.icon className={`size-3.5 ${cfg.color}`} />
      </IconContainer>

      <div className="flex-1 min-w-0">
        <Text variant="caption" className="font-medium truncate">{doc.titulo}</Text>
        <p className="text-[10px] text-muted-foreground/55">
          {doc.criadoPor} &middot; {timeAgo(doc.criadoEm)}
        </p>
      </div>

      {doc.assinantes.length > 0 && (
        <div className={cn("flex items-center inline-snug shrink-0")}>
          <ProgressRing
            percent={progress.percent}
            size={24}
            color={
              progress.percent === 100
                ? "var(--success)"
                : "var(--primary)"
            }
          />
          <span className="text-[10px] tabular-nums text-muted-foreground/60">
            {progress.signed}/{progress.total}
          </span>
        </div>
      )}

      <span
        className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} shrink-0 hidden sm:block`}
      >
        {cfg.label}
      </span>

      <div className={cn("flex items-center inline-micro shrink-0 hidden md:flex")}>
        {doc.selfieHabilitada && (
          <Camera className="size-3 text-muted-foreground/65" />
        )}
        {doc.origem === "formulario" && (
          <FileText className="size-3 text-info/30" />
        )}
      </div>

      <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
    </div>
  );
}
