'use client';

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Clock,
  FileSearch,
  Link2,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/empty-state';
import type { ComunicacaoCNJEnriquecida } from '@/app/(authenticated)/comunica-cnj/domain';

export interface CapturadasGlassListProps {
  comunicacoes: ComunicacaoCNJEnriquecida[];
  onSelect: (c: ComunicacaoCNJEnriquecida) => void;
  selectedId?: number | null;
}

type UrgencyLevel = 'critico' | 'atencao' | 'ok' | 'none';

function getUrgencyLevel(c: ComunicacaoCNJEnriquecida): UrgencyLevel {
  if (c.statusVinculacao !== 'orfao') return 'none';
  if (c.diasParaPrazo === null) return 'none';
  if (c.diasParaPrazo < 3) return 'critico';
  if (c.diasParaPrazo < 7) return 'atencao';
  return 'ok';
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-2 border-l-destructive',
  atencao: 'border-l-2 border-l-warning',
  ok: '',
  none: '',
};

// Tipo da comunicação formatado em Title Case
function capitalize(tipo: string | null | undefined): string | null {
  if (!tipo) return null;
  return tipo
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// ─── Status / Countdown (lateral direita do título) ──────────────────

function StatusOrCountdown({
  status,
  dias,
  urgency,
}: {
  status: string;
  dias: number | null;
  urgency: UrgencyLevel;
}) {
  if (dias !== null && (urgency === 'critico' || urgency === 'atencao')) {
    return (
      <span
        className={cn(
          /* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center gap-1 text-[11px] font-semibold',
          urgency === 'critico' ? 'text-destructive' : 'text-warning',
        )}
      >
        <Clock className="w-3 h-3" />
        {dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
      </span>
    );
  }

  if (status === 'vinculado') {
    return (
      <span className={cn(/* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 text-[11px] font-semibold text-success")}>
        <Link2 className="w-3 h-3" />
        Vinculado
      </span>
    );
  }

  if (status === 'pendente') {
    return (
      <span className={cn(/* design-system-escape: gap-1.5 gap sem token DS; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1.5 text-[11px] font-semibold text-warning")}>
        <span className="size-1.5 rounded-full bg-warning" aria-hidden />
        Pendente
      </span>
    );
  }

  if (status === 'orfao') {
    return (
      <span className={cn(/* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 text-[11px] font-semibold text-warning")}>
        <Unlink className="w-3 h-3" />
        Órfão
      </span>
    );
  }

  return null;
}

// ─── Row ──────────────────────────────────────────────────────────────

function GlassRow({
  comunicacao,
  onSelect,
  isSelected,
}: {
  comunicacao: ComunicacaoCNJEnriquecida;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const urgency = getUrgencyLevel(comunicacao);
  const tipoLabel = capitalize(comunicacao.tipoComunicacao);

  const partesAutorList = comunicacao.partesAutor ?? [];
  const partesReuList = comunicacao.partesReu ?? [];
  const poloAtivo = partesAutorList[0];
  const poloPassivo = partesReuList[0];
  const temPartes = Boolean(poloAtivo && poloPassivo);

  const numeroProcesso =
    comunicacao.numeroProcessoMascara ?? comunicacao.numeroProcesso;

  const dataDisponibilizacao = comunicacao.dataDisponibilizacao
    ? parseISO(comunicacao.dataDisponibilizacao)
    : null;

  const orgaoJulgador = comunicacao.nomeOrgao ?? null;
  const classeJudicial = comunicacao.nomeClasse ?? null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'group w-full text-left rounded-2xl border border-border/60 bg-card p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_color-mix(in_oklch,var(--foreground)_6%,transparent)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
        isSelected && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start gap-4")}>
        {/* COLUNA ESQUERDA (âncora): data + badge de tipo */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; pt-0.5 padding direcional sem Inset equiv. */ "flex flex-col items-start gap-1.5 w-24 shrink-0 pt-0.5")}>
          <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ "text-[11.5px] font-semibold text-foreground leading-tight whitespace-nowrap")}>
            {dataDisponibilizacao
              ? format(dataDisponibilizacao, 'dd MMM yyyy', { locale: ptBR })
              : '—'}
          </div>
          {tipoLabel && (
            <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-[0.02em] text-primary")}>
              {tipoLabel}
            </span>
          )}
        </div>

        {/* COLUNA PRINCIPAL */}
        <div className="flex-1 min-w-0">
          {/* LINHA 1 (título): partes × partes — com status alinhado à direita */}
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start gap-3")}>
            <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ "flex-1 text-[14px] font-semibold text-foreground leading-tight")}>
              {temPartes ? (
                <span className="flex flex-wrap items-baseline gap-x-0">
                  <span>{poloAtivo}</span>
                  {partesAutorList.length > 1 && (
                    <span className="ml-1 text-[12px] font-normal text-muted-foreground/60">
                      e outros
                    </span>
                  )}
                  <span className={cn(/* design-system-escape: mx-1.5 margin sem primitiva DS; font-medium → className de <Text>/<Heading> */ "mx-1.5 text-[13px] font-medium text-muted-foreground/60")}>
                    ×
                  </span>
                  <span>{poloPassivo}</span>
                  {partesReuList.length > 1 && (
                    <span className="ml-1 text-[12px] font-normal text-muted-foreground/60">
                      e outros
                    </span>
                  )}
                </span>
              ) : (
                <span className="tabular-nums">{numeroProcesso}</span>
              )}
            </h3>
            <div className={cn(/* design-system-escape: pt-0.5 padding direcional sem Inset equiv. */ "shrink-0 pt-0.5")}>
              <StatusOrCountdown
                status={comunicacao.statusVinculacao}
                dias={comunicacao.diasParaPrazo}
                urgency={urgency}
              />
            </div>
          </div>

          {/* LINHA 2 (meta): TRT pill + número do processo + órgão + classe */}
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "mt-1 flex flex-wrap items-center gap-1.5")}>
            {comunicacao.siglaTribunal && (
              <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv. */ "text-[9px] font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/70")}>
                {comunicacao.siglaTribunal}
              </span>
            )}
            {temPartes && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {numeroProcesso}
              </span>
            )}
            {orgaoJulgador && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60 truncate max-w-80">
                  {orgaoJulgador}
                </span>
              </>
            )}
            {classeJudicial && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className="text-[11px] text-muted-foreground/65 truncate max-w-55">
                  {classeJudicial}
                </span>
              </>
            )}
            {urgency === 'critico' && comunicacao.diasParaPrazo !== null && (
              <>
                <span className="w-0.75 h-0.75 rounded-full bg-muted-foreground/30 shrink-0" />
                <span className={cn(/* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 text-[10px] font-semibold text-destructive")}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Prazo crítico
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

/**
 * Lista de comunicações capturadas — cards narrativos no padrão Audiências.
 *
 * Arquitetura da informação:
 *  - Coluna esquerda (âncora): data de publicação + badge do tipo (Intimação)
 *  - Linha 1 (título): partes × partes (fallback: número do processo)
 *  - Linha 2 (meta): TRT + número do processo + órgão + classe + alertas
 *  - Status/countdown alinhado à direita do título (inline)
 *
 * Princípios aplicados:
 *  - Dados de baixa entropia (meio/publicação) não viram badge
 *  - Tribunal aparece em único lugar (TRT pill em meta)
 *  - Tipo vira badge na âncora (é metadado de classificação)
 */
export function CapturadasGlassList({
  comunicacoes,
  onSelect,
  selectedId = null,
}: CapturadasGlassListProps) {
  if (comunicacoes.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nenhuma comunicação nesta visualização"
        description="Ajuste filtros, mude de aba ou sincronize novas comunicações."
      />
    );
  }

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
      {comunicacoes.map((c) => (
        <GlassRow
          key={c.id}
          comunicacao={c}
          onSelect={() => onSelect(c)}
          isSelected={selectedId === c.id}
        />
      ))}
    </div>
  );
}
