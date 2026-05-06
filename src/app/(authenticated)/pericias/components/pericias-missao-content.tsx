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
  Clock,
  FileCheck2,
  Sparkles,
  User,
  Stethoscope,
  Activity,
  Hammer,
  Calculator,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
  type UsuarioOption,
  type EspecialidadePericiaOption,
  type PeritoOption,
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


// ═══════════════════════════════════════════════════════════════════════════
// CARD — arquitetura alinhada ao MissionCard de audiências
// ═══════════════════════════════════════════════════════════════════════════

function getIconForEspecialidade(descricao: string | undefined): LucideIcon {
  if (!descricao) return Briefcase;
  const d = descricao.toLowerCase();
  if (d.includes('médic') || d.includes('insalubri') || d.includes('saúde'))
    return Activity;
  if (d.includes('psicol') || d.includes('psiqu')) return Stethoscope;
  if (d.includes('engenha') || d.includes('periculos')) return Hammer;
  if (d.includes('contáb') || d.includes('financ')) return Calculator;
  return Briefcase;
}

function getGrauLabel(grau: string): string {
  if (grau === 'primeiro_grau') return '1º grau';
  if (grau === 'segundo_grau') return '2º grau';
  return grau;
}

const URGENCY_BADGE: Record<Urgency, string> = {
  atrasado: 'bg-destructive/10 text-destructive',
  hoje: 'bg-warning/10 text-warning',
  semana: 'bg-info/10 text-info',
  futuro: 'bg-primary/6 text-primary',
  sem_prazo: 'bg-muted text-muted-foreground/60',
};

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSÁVEL COM AVATAR (padrão audiências)
// ═══════════════════════════════════════════════════════════════════════════

function getInitials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

function ResponsavelAvatar({
  responsavelId,
  usuarios,
}: {
  responsavelId: number | null;
  usuarios: UsuarioOption[];
}) {
  const responsavel = responsavelId
    ? usuarios.find((u) => u.id === responsavelId)
    : null;
  const nome = responsavel ? getUsuarioNome(responsavel) : null;

  if (responsavel && nome) {
    return (
      <div className={cn("flex items-center inline-tight min-w-0")}>
        <Avatar size="xs" className="shrink-0 size-6">
          <AvatarImage src={responsavel.avatarUrl || undefined} alt={nome} />
          <AvatarFallback className="text-[9px]">
            {getInitials(nome)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium text-foreground/85 truncate")}>
          {nome}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center inline-tight min-w-0")}>
      <div className="size-6 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
        <User className="size-3 text-muted-foreground/40" />
      </div>
      <span className="text-[11px] italic text-warning/70">Sem responsável</span>
    </div>
  );
}

interface PericiaMissionCardProps {
  pericia: Pericia;
  urgency: Urgency;
  usuarios: UsuarioOption[];
  onView: (pericia: Pericia) => void;
}

function PericiaMissionCard({
  pericia,
  urgency,
  usuarios,
  onView,
}: PericiaMissionCardProps) {
  const especialidade = pericia.especialidade?.descricao;
  const perito = pericia.perito?.nome;
  const parteAutora = pericia.processo?.nomeParteAutora;
  const parteRe = pericia.processo?.nomeParteRe;

  const isOverdue = urgency === 'atrasado';
  const isToday = urgency === 'hoje';
  const isCritical = isOverdue || isToday;

  const EspecialidadeIcon = getIconForEspecialidade(especialidade);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(pericia)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(pericia);
        }
      }}
      className="w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[inherit]"
    >
      <GlassPanel
        depth={2}
        className={cn(
          'relative overflow-hidden transition-all duration-180',
          'hover:border-primary/30 hover:shadow-lg hover:-translate-y-px',
          isCritical && 'border-destructive/20',
        )}
      >
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; gap-3 gap sem token DS */ "p-4 flex flex-col gap-3")}>
          {/* ── 1. Header: identidade (overline + heading) + Prazo ── */}
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start justify-between gap-3")}>
            <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-center gap-2.5 min-w-0")}>
              <IconContainer
                size="md"
                className={cn(
                  'shrink-0',
                  isCritical ? 'bg-destructive/10' : 'bg-primary/10',
                )}
              >
                <EspecialidadeIcon
                  className={cn(
                    'size-4',
                    isCritical ? 'text-destructive' : 'text-primary',
                  )}
                />
              </IconContainer>
              <div className="min-w-0">
                <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "block text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/65")}>
                  {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
                </span>
                <Heading
                  level="card"
                  className={cn("mt-0.5 truncate text-body-sm")}
                >
                  {especialidade || 'Perícia técnica'}
                </Heading>
              </div>
            </div>

            {/* Prazo (substituindo countdown "Atrasado Xd") */}
            <div
              className={cn(
                /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 text-[11px] font-semibold tabular-nums',
                URGENCY_BADGE[urgency],
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="size-3" />
              ) : (
                <Calendar className="size-3" />
              )}
              <span>{formatPrazo(pericia.prazoEntrega)}</span>
            </div>
          </div>

          {/* ── 2. Info grid: Tribunal | Processo ─────────────────── */}
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "grid grid-cols-3 gap-3 rounded-lg bg-border/5 px-3 py-2.5")}>
            <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5 min-w-0")}>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[9px] font-medium text-muted-foreground/55 uppercase tracking-wider")}>
                Tribunal
              </span>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-caption font-medium text-foreground/90 truncate")}>
                {pericia.trt}
                <span className="text-[9px] text-muted-foreground/55 ml-1 font-normal">
                  {getGrauLabel(pericia.grau)}
                </span>
              </span>
            </div>
            <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5 min-w-0 col-span-2")}>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[9px] font-medium text-muted-foreground/55 uppercase tracking-wider")}>
                Processo
              </span>
              <Text variant="caption" className="font-medium text-foreground/90 tabular-nums truncate">
                {pericia.numeroProcesso}
              </Text>
            </div>
          </div>

          {/* ── 3. Partes: Autor vs Réu ──────────────────────────── */}
          {(parteAutora || parteRe) && (
            <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center inline-tight rounded-lg bg-border/5 px-3 py-2")}>
              <div className="flex-1 min-w-0">
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "block text-[9px] font-medium uppercase tracking-wider text-muted-foreground/55")}>
                  Autor
                </span>
                <span className="block text-[11px] text-foreground/80 truncate">
                  {parteAutora || '—'}
                </span>
              </div>
              <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/40 shrink-0 uppercase tracking-wider")}>
                vs
              </span>
              <div className="flex-1 min-w-0 text-right">
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "block text-[9px] font-medium uppercase tracking-wider text-muted-foreground/55")}>
                  Réu
                </span>
                <span className="block text-[11px] text-foreground/80 truncate">
                  {parteRe || '—'}
                </span>
              </div>
            </div>
          )}

          {/* ── 4. Perito (corpo, sem truncate) ─────────────────── */}
          {perito && (
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-start gap-1.5 text-[12px] text-foreground/75 wrap-break-word")}>
              <Briefcase className="size-3 text-muted-foreground/50 shrink-0 mt-0.5" />
              <span className={cn(/* design-system-escape: leading-snug sem token DS */ "wrap-break-word leading-snug")}>
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[9px] font-medium uppercase tracking-wider text-muted-foreground/55 mr-1.5")}>
                  Perito
                </span>
                {perito}
              </span>
            </div>
          )}

          {/* ── 5. Footer: Responsável (canto inferior direito) ── */}
          <div className={cn("flex items-center justify-end inline-tight")}>
            <ResponsavelAvatar
              responsavelId={pericia.responsavelId}
              usuarios={usuarios}
            />
          </div>
        </div>
      </GlassPanel>
    </div>
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
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
      <IconContainer size="md" className={group.iconBg}>
        <Icon className={cn('size-4', group.iconColor)} />
      </IconContainer>
      <div className="min-w-0 flex-1">
        <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-body-sm font-semibold tracking-tight text-foreground")}>
          {group.label}
        </p>
        <p className="text-[11px] text-muted-foreground/65">{group.description}</p>
      </div>
      <span className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/70")}>
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
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
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
  usuarios,
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
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* Grupos de urgência */}
      {isLoading ? (
        <div className={cn("stack-default")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn("stack-tight")}>
              <Skeleton className="h-10 w-64 rounded-lg" />
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3")}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-40 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : pericias.length === 0 ? (
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 flex flex-col items-center justify-center text-center")}>
          <Sparkles className="size-10 text-primary/30 mb-3" />
          <Heading level="card">Nenhuma perícia ativa</Heading>
          <p className={cn("text-body-sm text-muted-foreground/60 mt-1")}>
            {situacaoFilter !== 'todos'
              ? `Sem perícias na situação "${SITUACAO_PERICIA_LABELS[situacaoFilter as SituacaoPericiaCodigo]}"`
              : 'Todas as perícias estão finalizadas ou canceladas.'}
          </p>
        </GlassPanel>
      ) : (
        <div className={cn("stack-loose")}>
          {groups
            .filter((g) => g.pericias.length > 0)
            .map((group) => (
              <section key={group.key} className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
                <GroupHeader group={group} />
                <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3")}>
                  {group.pericias.map((p) => (
                    <PericiaMissionCard
                      key={p.id}
                      pericia={p}
                      urgency={group.key}
                      usuarios={usuarios}
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
