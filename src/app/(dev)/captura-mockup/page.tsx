/**
 * MOCKUP — Página de Detalhes de Captura (Novo Design)
 * ============================================================================
 * Arquivo de validação visual. Não conecta com Supabase — usa dados mock.
 *
 * Objetivo: demonstrar o redesign da página atualmente "horrorosa" com:
 *   - GlassPanel / WidgetContainer para hierarquia visual
 *   - SemanticBadges para status, tribunais e gravidade
 *   - KPI strip com tipografia Montserrat + ícones Lucide
 *   - Tabs estilizadas para logs e dados brutos
 *   - Layout responsivo (mobile → desktop)
 *
 * Para visualizar: npm run dev e acesse esta rota de teste.
 * ============================================================================
 */

'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Activity,
  CalendarClock,
  CalendarCheck,
  Timer,
  FileJson,
  ScrollText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Download,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────

const MOCK_CAPTURA = {
  id: 3101,
  tipo_captura: 'combinada' as const,
  status: 'completed' as const,
  advogado_id: 42,
  advogado_nome: 'Dr. Ricardo Monteiro',
  credencial_ids: [14, 15, 22],
  iniciado_em: '2026-04-25T14:06:41.000Z',
  concluido_em: '2026-04-25T14:11:47.000Z',
  erro: null,
  resultado: {
    total_processos: 156,
    total_partes: 89,
    clientes: 42,
    partes_contrarias: 35,
    terceiros: 8,
    representantes: 4,
    persistencia: {
      total: 210,
      atualizados: 185,
      erros: 3,
    },
    duracao_ms: 306000,
  },
};

const MOCK_TRIBUNAIS = [
  {
    tribunal: 'TRT3' as const,
    grau: '1',
    status: 'completed' as const,
    atualizados: 35,
    inseridos: 0,
    erros: 0,
    credencial_id: 14,
  },
  {
    tribunal: 'TRT3' as const,
    grau: '2',
    status: 'completed' as const,
    atualizados: 4,
    inseridos: 2,
    erros: 0,
    credencial_id: 15,
  },
  {
    tribunal: 'TRT1' as const,
    grau: '1',
    status: 'failed' as const,
    atualizados: 0,
    inseridos: 0,
    erros: 1,
    erro_msg: 'Timeout ao conectar com o tribunal',
    credencial_id: 22,
  },
] as const;

const MOCK_LOGS = [
  {
    id: 'log-001',
    tipo: 'atualizado' as const,
    tribunal: 'TRT3',
    grau: '1º Grau',
    numero_processo: '0010123-45.2025.5.03.0001',
    timestamp: '2026-04-25T14:07:12.000Z',
    detalhes: { polo_ativo: 'Atualizado', polo_passivo: 'Atualizado' },
  },
  {
    id: 'log-002',
    tipo: 'atualizado' as const,
    tribunal: 'TRT3',
    grau: '1º Grau',
    numero_processo: '0010456-78.2025.5.03.0002',
    timestamp: '2026-04-25T14:07:35.000Z',
    detalhes: { polo_ativo: 'Sem alteração', polo_passivo: 'Atualizado' },
  },
  {
    id: 'log-003',
    tipo: 'inserido' as const,
    tribunal: 'TRT3',
    grau: '2º Grau',
    numero_processo: '0020123-90.2025.5.03.0100',
    timestamp: '2026-04-25T14:08:01.000Z',
    detalhes: { polo_ativo: 'Novo', polo_passivo: 'Novo' },
  },
  {
    id: 'log-004',
    tipo: 'erro' as const,
    tribunal: 'TRT1',
    grau: '1º Grau',
    numero_processo: '—',
    timestamp: '2026-04-25T14:09:45.000Z',
    erro: 'Timeout ao conectar com o tribunal (após 30s)',
  },
  {
    id: 'log-005',
    tipo: 'atualizado' as const,
    tribunal: 'TRT3',
    grau: '2º Grau',
    numero_processo: '0020456-12.2025.5.03.0101',
    timestamp: '2026-04-25T14:10:20.000Z',
    detalhes: { polo_ativo: 'Atualizado', polo_passivo: 'Sem alteração' },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Formata duração em estilo legível */
function formatarDuracao(inicio: string, fim: string | null): string {
  if (!fim) return '—';
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  if (ms < 1000) return `${ms}ms`;
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;
  if (minutos < 60) return `${minutos}m ${segsRestantes}s`;
  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;
  return `${horas}h ${minsRestantes}m ${segsRestantes}s`;
}

/** Formata data/hora para locale pt-BR */
function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Formata grau numérico para label curto */
function formatarGrau(grau: string): string {
  return grau === '1' ? '1º Grau' : '2º Grau';
}

/** Label amigável do tipo de captura */
const TIPO_CAPTURA_LABELS: Record<string, string> = {
  combinada: 'Captura Combinada',
  pendentes: 'Expedientes',
  acervo_geral: 'Acervo Geral',
  audiencias: 'Audiências',
  partes: 'Partes',
  arquivados: 'Arquivados',
  timeline: 'Timeline',
  audiencias_designadas: 'Audiências Designadas',
  audiencias_realizadas: 'Audiências Realizadas',
  audiencias_canceladas: 'Audiências Canceladas',
  expedientes_no_prazo: 'Expedientes no Prazo',
  expedientes_sem_prazo: 'Expedientes sem Prazo',
  pericias: 'Perícias',
};

// ─── Design Tokens (do Design System ZattarOS) ────────────────────────────

const TOKENS = {
  // Status colors coesos com o Glass Briefing (OKLCH, hue 281° ancorado)
  status: {
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      border: 'border-emerald-500/25',
      dot: 'bg-emerald-500',
    },
    failed: {
      bg: 'bg-red-500/10',
      text: 'text-red-600',
      border: 'border-red-500/25',
      dot: 'bg-red-500',
    },
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      border: 'border-amber-500/25',
      dot: 'bg-amber-500',
    },
    in_progress: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-600',
      border: 'border-blue-500/25',
      dot: 'bg-blue-500',
    },
  },
  // Card containers
  glass: {
    widget: 'rounded-2xl border border-border/20 bg-card/60 backdrop-blur-sm',
    kpi: 'rounded-2xl border border-border/30 bg-card/70 backdrop-blur-md',
    highlight: 'rounded-2xl border border-primary/10 bg-primary/[0.03] backdrop-blur-xl',
  },
} as const;

// ─── Sub-componentes ──────────────────────────────────────────────────────

/** Badge de status semântico (comporta-se como CapturaStatusSemanticBadge) */
function StatusBadge({ status }: { status: string }) {
  const s = TOKENS.status[status as keyof typeof TOKENS.status] ?? TOKENS.status.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text} ${s.border}`}
    >
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status === 'completed'
        ? 'Concluída'
        : status === 'failed'
          ? 'Falhou'
          : status === 'in_progress'
            ? 'Em progresso'
            : 'Pendente'}
    </span>
  );
}

/** Badge de tribunal com cor semântica */
function TribunalBadge({ tribunal, grau }: { tribunal: string; grau?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/20 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {tribunal}
      {grau && <span className="text-[10px] text-muted-foreground/60">{formatarGrau(grau)}</span>}
    </span>
  );
}

/** KPI individual */
function KpiItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3 text-muted-foreground/50" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className={mono ? 'font-mono text-sm tabular-nums' : 'text-sm'}>
        {value}
      </div>
    </div>
  );
}

/** Card de um tribunal individual no grid de resultados */
function TribunalResultCard(props: (typeof MOCK_TRIBUNAIS)[number]) {
  const { tribunal, grau, status, atualizados, inseridos, erros } = props;
  const erro_msg = 'erro_msg' in props ? (props as typeof MOCK_TRIBUNAIS[2]).erro_msg : undefined;
  const s = TOKENS.status[status];
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-sm cursor-pointer ${s.border}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-8 items-center justify-center rounded-lg ${s.bg}`}>
            {status === 'completed' ? (
              <CheckCircle2 className={`size-4 ${s.text}`} />
            ) : (
              <XCircle className={`size-4 ${s.text}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{tribunal}</span>
              <span className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {formatarGrau(grau)}
              </span>
            </div>
            <span className={`text-xs font-medium ${s.text}`}>
              {status === 'completed' ? 'Concluído' : 'Erro'}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground/50 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Expandido: métricas */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-border/20 pt-3">
          {status === 'completed' ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold tabular-nums font-heading text-foreground">
                  {atualizados}
                </div>
                <div className="text-[10px] text-muted-foreground">Atualizados</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums font-heading text-foreground">
                  {inseridos}
                </div>
                <div className="text-[10px] text-muted-foreground">Inseridos</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums font-heading text-emerald-600">
                  {erros}
                </div>
                <div className="text-[10px] text-muted-foreground">Erros</div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{erro_msg}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Linha de log individual */
function LogRow({ log }: { log: (typeof MOCK_LOGS)[number] }) {
  const tipoConfig = {
    atualizado: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/8', label: 'Atualizado' },
    inserido: { icon: Database, color: 'text-blue-500', bg: 'bg-blue-500/8', label: 'Inserido' },
    erro: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/8', label: 'Erro' },
    nao_atualizado: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/8', label: 'Não alterado' },
  };

  const config = tipoConfig[log.tipo];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/10 bg-card/40 px-4 py-3 transition-colors hover:bg-card/60">
      {/* Ícone de tipo */}
      <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${config.bg}`}>
        <Icon className={`size-3.5 ${config.color}`} />
      </div>

      {/* Info principal */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {log.numero_processo}
          </span>
          <span className="shrink-0 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <TribunalBadge tribunal={log.tribunal} />
          <span className="text-[11px] text-muted-foreground/60">
            {formatarDataHora(log.timestamp)}
          </span>
        </div>
      </div>

      {/* Detalhes ou erro */}
      {'erro' in log && log.erro ? (
        <span className="shrink-0 text-xs text-red-500 max-w-[200px] truncate hidden sm:inline">
          {log.erro}
        </span>
      ) : 'detalhes' in log && log.detalhes ? (
        <span className="shrink-0 text-xs text-muted-foreground hidden sm:inline">
          {log.detalhes.polo_ativo !== 'Sem alteração' && 'PA '}
          {log.detalhes.polo_passivo !== 'Sem alteração' && 'PP'}
        </span>
      ) : null}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────

export default function CapturaDetalhesMockup() {
  const duracao = formatarDuracao(MOCK_CAPTURA.iniciado_em, MOCK_CAPTURA.concluido_em);
  const [tab, setTab] = React.useState<'logs' | 'brutos'>('logs');

  const totalSucesso = MOCK_TRIBUNAIS.filter((t) => t.status === 'completed').length;
  const totalErro = MOCK_TRIBUNAIS.filter((t) => t.status === 'failed').length;
  const totalAtualizados = MOCK_TRIBUNAIS.reduce((sum, t) => sum + t.atualizados, 0);
  const totalInseridos = MOCK_TRIBUNAIS.reduce((sum, t) => sum + t.inseridos, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ═══════════════════════════════════════════════════════════
            PAGE HEADER
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Back button */}
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-lg border border-border/20 bg-card/60 text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:border-border/40 hover:shadow-sm"
              aria-label="Voltar para histórico"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div>
              {/* Meta label */}
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {TIPO_CAPTURA_LABELS[MOCK_CAPTURA.tipo_captura] ?? MOCK_CAPTURA.tipo_captura}
              </span>
              {/* Título */}
              <h1 className="text-xl font-bold tracking-tight font-heading text-foreground">
                Captura #{MOCK_CAPTURA.id}
              </h1>
            </div>

            <StatusBadge status={MOCK_CAPTURA.status} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/20 bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-card/80 hover:text-foreground hover:border-border/40"
            >
              <Download className="size-3.5" />
              Exportar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-sm"
            >
              <Activity className="size-3.5" />
              Repetir Captura
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            KPI STRIP
            ═══════════════════════════════════════════════════════════ */}
        <div className={TOKENS.glass.kpi + ' p-4 sm:p-5 mb-5'}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiItem
              icon={Activity}
              label="Status"
              value={<StatusBadge status={MOCK_CAPTURA.status} />}
            />
            <KpiItem
              icon={CalendarClock}
              label="Iniciado em"
              value={formatarDataHora(MOCK_CAPTURA.iniciado_em)}
              mono
            />
            <KpiItem
              icon={CalendarCheck}
              label="Concluído em"
              value={
                MOCK_CAPTURA.concluido_em ? (
                  <span className="font-mono tabular-nums">
                    {formatarDataHora(MOCK_CAPTURA.concluido_em)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )
              }
              mono
            />
            <KpiItem
              icon={Timer}
              label="Duração"
              value={
                <span className="font-mono tabular-nums font-semibold">
                  {duracao}
                </span>
              }
              mono
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MÉTRICAS GERAIS DA CAPTURA
            ═══════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Database className="size-4 text-muted-foreground/60" aria-hidden="true" />
            <h2 className="text-sm font-semibold font-heading text-foreground">Resumo da Execução</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Tribunais processados */}
            <div className={TOKENS.glass.widget + ' p-4'}>
              <Building2 className="size-4 text-muted-foreground/50 mb-2" />
              <div className="text-2xl font-bold tabular-nums font-heading">{MOCK_TRIBUNAIS.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Tribunais processados</div>
            </div>

            {/* Processos */}
            <div className={TOKENS.glass.widget + ' p-4'}>
              <ScrollText className="size-4 text-muted-foreground/50 mb-2" />
              <div className="text-2xl font-bold tabular-nums font-heading">
                {MOCK_CAPTURA.resultado?.total_processos ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Processos capturados</div>
            </div>

            {/* Partes */}
            <div className={TOKENS.glass.widget + ' p-4'}>
              <Users className="size-4 text-muted-foreground/50 mb-2" />
              <div className="text-2xl font-bold tabular-nums font-heading">
                {MOCK_CAPTURA.resultado?.total_partes ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Partes identificadas</div>
            </div>

            {/* Persistência */}
            <div className={TOKENS.glass.widget + ' p-4'}>
              <Database className="size-4 text-muted-foreground/50 mb-2" />
              <div className="text-2xl font-bold tabular-nums font-heading text-emerald-600">
                {MOCK_CAPTURA.resultado?.persistencia?.atualizados ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Registros salvos</div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            BREAKDOWN POR TRIBUNAL
            ═══════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="size-4 text-muted-foreground/60" aria-hidden="true" />
            <h2 className="text-sm font-semibold font-heading text-foreground">Resultado por Tribunal</h2>

            {/* Summary pills */}
            <span className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="size-3" />
                {totalSucesso} ok
              </span>
              {totalErro > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  <XCircle className="size-3" />
                  {totalErro} erro
                </span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_TRIBUNAIS.map((tribunal, idx) => (
              <TribunalResultCard key={`${tribunal.tribunal}-${tribunal.grau}-${idx}`} {...tribunal} />
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            PARTES CAPTURADAS
            ═══════════════════════════════════════════════════════════ */}
        {MOCK_CAPTURA.resultado && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-muted-foreground/60" aria-hidden="true" />
              <h2 className="text-sm font-semibold font-heading text-foreground">Distribuição de Partes</h2>
            </div>

            <div className={TOKENS.glass.highlight + ' p-5'}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Clientes</div>
                  <div className="text-xl font-bold tabular-nums font-heading text-primary">
                    {MOCK_CAPTURA.resultado.clientes}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Partes Contrárias</div>
                  <div className="text-xl font-bold tabular-nums font-heading text-amber-600">
                    {MOCK_CAPTURA.resultado.partes_contrarias}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Terceiros</div>
                  <div className="text-xl font-bold tabular-nums font-heading text-blue-600">
                    {MOCK_CAPTURA.resultado.terceiros}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Representantes</div>
                  <div className="text-xl font-bold tabular-nums font-heading text-emerald-600">
                    {MOCK_CAPTURA.resultado.representantes}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            TABS: Logs Detalhados / Dados Brutos
            ═══════════════════════════════════════════════════════════ */}
        <div className="mb-5">
          {/* Tab bar custom — alinhado com design system */}
          <div className="flex items-center border-b border-border/20" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'logs'}
              onClick={() => setTab('logs')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                tab === 'logs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ScrollText className="size-3.5" />
              Logs Detalhados
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {MOCK_LOGS.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'brutos'}
              onClick={() => setTab('brutos')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                tab === 'brutos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileJson className="size-3.5" />
              Dados Brutos
            </button>
          </div>

          {/* Tab content */}
          <div className="mt-4">
            {tab === 'logs' ? (
              <div className="space-y-2">
                {/* Summary row */}
                <div className="flex flex-wrap items-center gap-2 px-1 mb-3">
                  <span className="text-xs text-muted-foreground">
                    {MOCK_LOGS.length} registros
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    {MOCK_LOGS.filter((l) => l.tipo === 'atualizado' || l.tipo === 'inserido').length} sucesso
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-red-500">
                    <XCircle className="size-3" />
                    {MOCK_LOGS.filter((l) => l.tipo === 'erro').length} erro
                  </span>
                </div>
                {/* Log list */}
                {MOCK_LOGS.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </div>
            ) : (
              /* Dados Brutos */
              <div className={TOKENS.glass.widget + ' overflow-hidden'}>
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Payload JSON da Execução
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(MOCK_CAPTURA.resultado, null, 2));
                    }}
                  >
                    <Copy className="size-3" />
                    Copiar
                  </button>
                </div>
                <pre className="overflow-auto max-h-[400px] border-t border-border/10 bg-muted/20 p-5 text-xs font-mono leading-relaxed text-foreground/80">
                  {JSON.stringify(MOCK_CAPTURA.resultado, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            METADADOS TÉCNICOS (footer informativo)
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground/60 border-t border-border/10 pt-4">
          <span>ID da captura: {MOCK_CAPTURA.id}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>Advogado: {MOCK_CAPTURA.advogado_nome}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>Credenciais: {MOCK_CAPTURA.credencial_ids.length}</span>
          <span className="text-muted-foreground/30">·</span>
          <span>Duração bruta: {(MOCK_CAPTURA.resultado?.duracao_ms ?? 0) / 1000}s</span>
        </div>
      </div>
    </div>
  );
}
