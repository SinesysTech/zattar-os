'use client';

/**
 * PericiasMissaoContent — View "Missão" do módulo Perícias.
 * ============================================================================
 * Agrupa perícias por urgência temporal (atrasadas, hoje, 7 dias, futuro,
 * sem prazo) para que o advogado priorize a pauta de forma natural.
 *
 * Cada card consome dados REAIS do domínio (sem Math.sin mock); destaque
 * visual escalonado por urgência via cores semânticas (destructive/warning/
 * info/success).
 * ============================================================================
 */

import * as React from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  FileCheck2,
  Sparkles,
  User,
  UserMinus,
  Building2,
} from 'lucide-react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
} from '../domain';
import { usePericias } from '../hooks/use-pericias';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type Urgency = 'atrasado' | 'hoje' | 'semana' | 'futuro' | 'sem_prazo';

interface UrgencyGroup {
  key: Urgency;
  label: string;
  description: string;
  icon: typeof Clock;
  accent: string;
  iconBg: string;
  iconColor: string;
  pericias: Pericia[];
}

function classifyUrgency(prazoEntrega: string | null): Urgency {
  if (!prazoEntrega) return 'sem_prazo';
  const diff = differenceInCalendarDays(parseISO(prazoEntrega), new Date());
  if (diff < 0) return 'atrasado';
  if (diff === 0) return 'hoje';
  if (diff <= 7) return 'semana';
  return 'futuro';
}

function formatPrazo(prazoEntrega: string | null): string {
  if (!prazoEntrega) return 'Sem prazo';
  try {
    return format(parseISO(prazoEntrega), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return 'Prazo inválido';
  }
}

function deltaLabel(prazoEntrega: string | null): string {
  if (!prazoEntrega) return 'A definir';
  try {
    const diff = differenceInCalendarDays(parseISO(prazoEntrega), new Date());
    if (diff < 0) return `Atrasado ${Math.abs(diff)}d`;
    if (diff === 0) return 'Vence hoje';
    if (diff === 1) return 'Vence amanhã';
    return `Em ${diff}d`;
  } catch {
    return '—';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PericiaMissionCardProps {
  pericia: Pericia;
  urgency: Urgency;
  onView: (pericia: Pericia) => void;
}

function PericiaMissionCard({ pericia, urgency, onView }: PericiaMissionCardProps) {
  const responsavel = pericia.responsavel?.nomeExibicao;
  const especialidade = pericia.especialidade?.descricao;
  const perito = pericia.perito?.nome;

  const isOverdue = urgency === 'atrasado';
  const isToday = urgency === 'hoje';
  const isCritical = isOverdue || isToday;

  return (
    <GlassPanel
      depth={2}
      className={cn(
        'relative overflow-hidden group transition-colors',
        isCritical && 'border-destructive/20',
      )}
    >
      <div className="flex flex-col gap-3 p-4">
        {/* Cabeçalho: número do processo + badge de situação */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tabular-nums tracking-tight text-foreground truncate">
              {pericia.numeroProcesso}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground/70 uppercase tracking-wider">
              <Building2 className="size-3 shrink-0" />
              <span className="truncate">
                {pericia.trt} · {pericia.grau}
              </span>
            </div>
          </div>
          <AppBadge
            variant={getSemanticBadgeVariant('pericia_situacao', pericia.situacaoCodigo)}
          >
            {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
          </AppBadge>
        </div>

        {/* Info grid: especialidade + perito */}
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 border border-border/20 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-0.5">
              Especialidade
            </p>
            <p className="text-xs font-medium text-foreground/85 truncate">
              {especialidade || '—'}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-0.5">
              Perito
            </p>
            <p className="text-xs font-medium text-foreground/85 truncate">
              {perito || 'A definir'}
            </p>
          </div>
        </div>

        {/* Rodapé: prazo + responsável + ação */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider',
                isOverdue && 'bg-destructive/10 text-destructive',
                isToday && 'bg-warning/10 text-warning',
                !isCritical &&
                  urgency === 'semana' &&
                  'bg-info/10 text-info',
                !isCritical &&
                  urgency === 'futuro' &&
                  'bg-muted/60 text-muted-foreground',
                urgency === 'sem_prazo' && 'bg-muted/40 text-muted-foreground/70',
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="size-3" />
              ) : (
                <Clock className="size-3" />
              )}
              <span>{deltaLabel(pericia.prazoEntrega)}</span>
              <span className="opacity-60">·</span>
              <span className="font-normal normal-case tracking-normal">
                {formatPrazo(pericia.prazoEntrega)}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(pericia)}
            className="h-7 text-[10px] px-3 font-medium uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
          >
            Abrir
            <ChevronRight className="size-3 ml-1 opacity-70" />
          </Button>
        </div>

        {/* Indicador de responsável (abaixo dos metadados) */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/65">
          {responsavel ? (
            <>
              <User className="size-3" />
              <span className="truncate">{responsavel}</span>
            </>
          ) : (
            <>
              <UserMinus className="size-3 text-warning/60" />
              <span className="text-warning/70">Sem responsável</span>
            </>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUP HEADER
// ═══════════════════════════════════════════════════════════════════════════

interface GroupHeaderProps {
  group: UrgencyGroup;
}

function GroupHeader({ group }: GroupHeaderProps) {
  const Icon = group.icon;
  return (
    <div className="flex items-center gap-3">
      <IconContainer size="md" className={group.iconBg}>
        <Icon className={cn('size-4', group.iconColor)} />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {group.label}
        </p>
        <p className="text-[11px] text-muted-foreground/65">{group.description}</p>
      </div>
      <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/70">
        {group.pericias.length}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

interface PericiasMissaoContentProps {
  busca: string;
  situacaoFilter: SituacaoFilterType;
  responsavelFilter: ResponsavelFilterType;
  laudoFilter: LaudoFilterType;
  tribunalFilter: string;
  grauFilter: string;
  especialidadeFilter: string;
  peritoFilter: string;
  refetchKey: number;
}

export function PericiasMissaoContent({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  refetchKey,
}: PericiasMissaoContentProps) {
  const [selectedPericia, setSelectedPericia] = React.useState<Pericia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Busca todas as perícias ativas (excluindo finalizadas/canceladas) para mosaicar por urgência
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 200,
      busca: busca || undefined,
      ordenarPor: 'prazo_entrega' as const,
      ordem: 'asc' as const,
    };

    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter)
      params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    busca,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
  ]);

  const { pericias, isLoading, refetch } = usePericias(hookParams);

  React.useEffect(() => {
    if (refetchKey > 0) {
      refetch();
    }
  }, [refetchKey, refetch]);

  const groups: UrgencyGroup[] = React.useMemo(() => {
    const base: Record<Urgency, Pericia[]> = {
      atrasado: [],
      hoje: [],
      semana: [],
      futuro: [],
      sem_prazo: [],
    };

    for (const p of pericias) {
      base[classifyUrgency(p.prazoEntrega)].push(p);
    }

    return [
      {
        key: 'atrasado',
        label: 'Prazo vencido',
        description: 'Entrega em atraso — atenção imediata',
        icon: AlertTriangle,
        accent: 'destructive',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        pericias: base.atrasado,
      },
      {
        key: 'hoje',
        label: 'Vence hoje',
        description: 'Entregas do dia corrente',
        icon: Clock,
        accent: 'warning',
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        pericias: base.hoje,
      },
      {
        key: 'semana',
        label: 'Próximos 7 dias',
        description: 'Planejar agenda de entrega',
        icon: Calendar,
        accent: 'info',
        iconBg: 'bg-info/10',
        iconColor: 'text-info',
        pericias: base.semana,
      },
      {
        key: 'futuro',
        label: 'Futuro',
        description: 'Prazo distante — acompanhar',
        icon: FileCheck2,
        accent: 'success',
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        pericias: base.futuro,
      },
      {
        key: 'sem_prazo',
        label: 'Sem prazo definido',
        description: 'Requer ordem do juiz ou cadastro manual',
        icon: Sparkles,
        accent: 'muted',
        iconBg: 'bg-muted/40',
        iconColor: 'text-muted-foreground',
        pericias: base.sem_prazo,
      },
    ];
  }, [pericias]);

  const handleView = React.useCallback((p: Pericia) => {
    setSelectedPericia(p);
    setIsDetailOpen(true);
  }, []);

  return (
    <div className="space-y-5">
      {/* Grupos de urgência */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-40 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : pericias.length === 0 ? (
        <GlassPanel depth={1} className="p-12 flex flex-col items-center justify-center text-center">
          <Sparkles className="size-10 text-primary/30 mb-3" />
          <Heading level="card">Nenhuma perícia ativa</Heading>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {situacaoFilter !== 'todos'
              ? `Sem perícias na situação "${SITUACAO_PERICIA_LABELS[situacaoFilter as SituacaoPericiaCodigo]}"`
              : 'Todas as perícias estão finalizadas ou canceladas.'}
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-6">
          {groups
            .filter((g) => g.pericias.length > 0)
            .map((group) => (
              <section key={group.key} className="space-y-3">
                <GroupHeader group={group} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {group.pericias.map((p) => (
                    <PericiaMissionCard
                      key={p.id}
                      pericia={p}
                      urgency={group.key}
                      onView={handleView}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {/* Detail dialog (reusa o existente com AuditLogTimeline) */}
      <PericiaDetalhesDialog
        pericia={selectedPericia}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
