'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CopyButton } from '@/app/(authenticated)/partes';
import { timeAgo } from '@/components/dashboard/entity-card';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { ResponsavelPopover } from './responsavel-popover';
import type { ProcessoUnificado } from '../domain';
import { GRAU_LABELS } from '@/lib/design-system';

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

interface Tag {
  id: number;
  nome: string;
}

interface ProcessoCardProps {
  processo: ProcessoUnificado;
  tags?: Tag[];
  responsavel?: Usuario;
  usuarios: Usuario[];
  isSelected?: boolean;
  onClick: () => void;
  onUpdateResponsavel: (processoId: number, novoResponsavelId: number | null) => void;
}

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * ProcessoCard — Card de processo jurídico conforme Glass Briefing spec.
 *
 * Layout (design-system/ui_kits/zattar-os/ProcessCard.jsx):
 *   ┌────────────────────────────────────────────┐
 *   │ CNJ (font-mono muted) · copy        TRIBUNAL│
 *   │ Autor vs. Réu (Heading card)       · GRAU  │
 *   │ ┌──────────────┬──────────────┐             │
 *   │ │ TRIBUNAL     │ RESPONSÁVEL  │ (meta grid) │
 *   │ │ TRT1         │ Dra. Ana     │             │
 *   │ ├──────────────┼──────────────┤             │
 *   │ │ PRÓX. PRAZO  │ AUTUAÇÃO     │             │
 *   │ │ 18/05 ⚠       │ 03/04/2024   │             │
 *   │ └──────────────┴──────────────┘             │
 *   │ [tags]                                       │
 *   │ [responsavel avatar] Dra. Ana        há 2d  │
 *   └────────────────────────────────────────────┘
 */
export function ProcessoCard({
  processo,
  tags,
  responsavel,
  usuarios,
  isSelected: _isSelected,
  onClick,
  onUpdateResponsavel,
}: ProcessoCardProps) {
  const trt = processo.trtOrigem || processo.trt;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;
  const orgaoJulgador = processo.descricaoOrgaoJulgador || '-';
  const dataAut = processo.dataAutuacaoOrigem || processo.dataAutuacao;
  const proximaAudienciaDate = processo.dataProximaAudiencia;
  const hasUrgency = !!proximaAudienciaDate;

  return (
    <GlassPanel className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 cursor-pointer group")}>
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        {/* Top row — CNJ à esquerda, tribunal/grau à direita (spec) */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start justify-between gap-3")}>
          <div className="min-w-0 flex-1">
            <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
              <span className="text-mono-num truncate">{processo.numeroProcesso}</span>
              <CopyButton text={processo.numeroProcesso} label="Copiar número" />
            </div>
            <Heading level="card" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm truncate mt-0.5")}>
              {tituloPartes}
            </Heading>
          </div>
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col items-end gap-1 shrink-0")}>
            <SemanticBadge category="tribunal" value={trt} className="text-[9px]">
              {trt}
            </SemanticBadge>
            {processo.grauAtual && (
              <SemanticBadge
                category="grau"
                value={processo.grauAtual}
                className="text-[9px]"
              >
                {GRAU_LABELS[processo.grauAtual as keyof typeof GRAU_LABELS] ||
                  processo.grauAtual}
              </SemanticBadge>
            )}
          </div>
        </div>

        {/* Meta grid 2x2 — Tribunal / Responsável / Próx. prazo / Autuação (spec) */}
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          <MetaCell label="Órgão julgador" value={orgaoJulgador} truncate />
          <MetaCell
            label="Responsável"
            value={responsavel?.nomeExibicao || 'Sem responsável'}
            truncate
          />
          {hasUrgency && (
            <MetaCell
              label="Próx. prazo"
              value={
                proximaAudienciaDate
                  ? new Date(proximaAudienciaDate).toLocaleDateString('pt-BR')
                  : '—'
              }
              icon={<AlertTriangle className="size-3 text-warning" />}
              valueClassName=/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-warning font-medium"
            />
          )}
          {dataAut && (
            <MetaCell
              label="Autuação"
              value={new Date(dataAut).toLocaleDateString('pt-BR')}
              valueClassName="font-mono tabular-nums"
            />
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-wrap gap-1 mt-3")}>
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/60 border border-primary/10")}
              >
                {tag.nome}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground/65">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer — responsável popover (feature preservada) + timestamp com ícone (spec) */}
      <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between mt-3 pt-2 border-t border-border/10")}>
        <ResponsavelPopover
          processoId={processo.id}
          responsavel={responsavel}
          usuarios={usuarios}
          onUpdate={onUpdateResponsavel}
        >
          <Avatar size="xs" className="border">
            <AvatarImage src={responsavel?.avatarUrl || undefined} />
            <AvatarFallback className="text-[8px]">
              {responsavel ? getInitials(responsavel.nomeExibicao) : 'NA'}
            </AvatarFallback>
          </Avatar>
          <span className="text-[9px] text-muted-foreground/70 whitespace-nowrap">
            {responsavel?.nomeExibicao || 'Sem resp.'}
          </span>
        </ResponsavelPopover>
        <span className={cn(/* design-system-escape: gap-1 gap sem token DS */ "text-[9px] text-muted-foreground/65 flex items-center gap-1 font-mono tabular-nums")}>
          <Clock className="size-2.5" />
          {timeAgo(processo.updatedAt)}
        </span>
      </div>
    </GlassPanel>
  );
}

// ─── MetaCell ─────────────────────────────────────────────────────────

interface MetaCellProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  truncate?: boolean;
}

function MetaCell({ label, value, icon, valueClassName, truncate }: MetaCellProps) {
  return (
    <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5 min-w-0")}>
      <Text variant="meta-label" className="text-[9px]">
        {label}
      </Text>
      <div
        className={cn(
          /* design-system-escape: gap-1 gap sem token DS */ 'flex items-center gap-1 text-[11px]',
          truncate && 'min-w-0',
        )}
      >
        {icon}
        <span className={cn(truncate && 'truncate', valueClassName)}>{value}</span>
      </div>
    </div>
  );
}
