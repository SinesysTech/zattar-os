"use client";

/**
 * NovoDocumentoClient — Etapa 1: Upload do PDF
 *
 * Layout: dropzone principal à esquerda + painel de contexto glass à direita.
 * Alinhado ao Design System Glass Briefing (POC novo-documento):
 * - Context panel em GlassPanel depth={1} com label-overline + icon-tile
 * - Ambient divider entre header e lista de passos
 * - Badge de conformidade inline (MP 2.200-2)
 */

import { cn } from '@/lib/utils';
import {
  FileSignature,
  Shield,
  Users,
  MousePointerClick,
  Info,
} from "lucide-react";
import { DocumentFlowShell } from '@/app/(authenticated)/assinatura-digital/components/flow';
import { DocumentUploadDropzone } from '@/app/(authenticated)/assinatura-digital/components/upload';
import { GlassPanel } from "@/components/shared/glass-panel";
import { Text } from '@/components/ui/typography';

// ─── Dados dos passos ──────────────────────────────────────────────────

const FLOW_STEPS_INFO = [
  {
    icon: FileSignature,
    tile: "bg-primary/8 text-primary/70",
    title: "Envie o PDF",
    description: "Faça upload do documento que será assinado digitalmente.",
  },
  {
    icon: Users,
    tile: "bg-info/10 text-info/70",
    title: "Adicione assinantes",
    description:
      "Defina quem vai assinar e posicione os campos de assinatura no PDF.",
  },
  {
    icon: MousePointerClick,
    tile: "bg-warning/12 text-warning/75",
    title: "Compartilhe os links",
    description:
      "Cada assinante recebe um link único e seguro para assinar.",
  },
  {
    icon: Shield,
    tile: "bg-success/10 text-success/70",
    title: "Validade jurídica",
    description:
      "Assinaturas com hash SHA-256, geolocalização, IP e aceite de termos (MP 2.200-2).",
  },
];

// ─── Context panel ─────────────────────────────────────────────────────

function ContextPanel() {
  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 h-fit")}>
      <h3 className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60")}>
        Como funciona
      </h3>
      <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; leading-tight sem token DS */ "font-heading text-body font-bold mt-1 leading-tight text-foreground")}>
        Envie, configure e compartilhe em 3 passos simples
      </p>
      <Text variant="caption" className="mt-1.5">
        Três passos com validade jurídica plena (MP 2.200-2/2001).
      </Text>

      <div
        className={cn(/* design-system-escape: my-4 margin sem primitiva DS */ "h-px my-4 bg-linear-to-r from-transparent via-border/50 to-transparent")}
        aria-hidden="true"
      />

      <div className={cn(/* design-system-escape: space-y-3.5 sem token DS */ "space-y-3.5")}>
        {FLOW_STEPS_INFO.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex gap-3")}>
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${step.tile}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; leading-snug sem token DS */ "text-body-sm font-medium text-foreground leading-snug")}>
                  {step.title}
                </p>
                <Text variant="caption" className="mt-0.5">
                  {step.description}
                </Text>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(/* design-system-escape: my-4 margin sem primitiva DS */ "h-px my-4 bg-linear-to-r from-transparent via-border/50 to-transparent")}
        aria-hidden="true"
      />

      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
        <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center gap-1 rounded-full bg-info/12 text-info px-2 py-0.5 text-[11px] font-medium")}>
          <Info className="size-3" />
          MP 2.200-2/2001
        </span>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[11px] font-medium text-muted-foreground/70")}>
          Conformidade legal
        </span>
      </div>
    </GlassPanel>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function NovoDocumentoClient() {
  return (
    <DocumentFlowShell>
      <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose">; lg:gap-8 sem equivalente DS */ "flex h-full min-h-0 flex-col lg:flex-row gap-6 lg:gap-8 max-w-6xl mx-auto w-full")}>
        {/* Dropzone — principal */}
        <div className="flex-1 min-h-0 flex flex-col">
          <DocumentUploadDropzone />
        </div>

        {/* Context panel — lateral no desktop, abaixo no mobile */}
        <div className={cn(/* design-system-escape: lg:py-2 sem equivalente DS */ "w-full lg:w-80 shrink-0 lg:py-2")}>
          <ContextPanel />
        </div>
      </div>
    </DocumentFlowShell>
  );
}
