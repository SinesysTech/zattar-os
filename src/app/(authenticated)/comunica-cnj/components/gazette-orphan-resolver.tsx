'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  Search,
  Plus,
  Ban,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GrauTribunal, ExpedienteDialog } from '@/app/(authenticated)/expedientes';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { useGazetteStore } from './hooks/use-gazette-store';
import type {
  ComunicacaoCNJEnriquecida,
  MatchCriterio,
} from '@/app/(authenticated)/comunica-cnj/domain';

// ─── Helpers ────────────────────────────────────────────────────────────────

function confidenceColor(score: number) {
  if (score >= 85) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-muted-foreground';
}

function confidenceBg(score: number) {
  if (score >= 85) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-muted-foreground';
}

function highlightSegments(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length || !text) return text;

  const escaped = highlights
    .filter(Boolean)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return text;

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className={cn(/* design-system-escape: px-0.5 padding direcional sem Inset equiv. */ "bg-primary/15 px-0.5 rounded")}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ConfidenceLegend() {
  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
      <span className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <Text variant="micro-caption">Alta (&gt;85%)</Text>
      </span>
      <span className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        <Text variant="micro-caption">Média (50-85%)</Text>
      </span>
      <span className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
        <span className="size-2 rounded-full bg-muted-foreground" aria-hidden />
        <Text variant="micro-caption">Sem match</Text>
      </span>
    </div>
  );
}

function ProgressSegment({
  resolved,
  total,
}: {
  resolved: number;
  total: number;
}) {
  const pctResolved = total > 0 ? (resolved / total) * 100 : 0;
  const pctPending = total > 0 ? ((total - resolved) / total) * 100 : 0;

  return (
    <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border/20">
        <div
          className="rounded-full bg-success transition-all duration-500"
          style={{ width: `${pctResolved}%` }}
        />
        <div
          className="bg-warning/60 transition-all duration-500"
          style={{ width: `${pctPending}%` }}
        />
      </div>
      <Text variant="micro-caption">
        {resolved} de {total} resolvidos ({total > 0 ? Math.round(pctResolved) : 0}%)
      </Text>
    </div>
  );
}

function MatchCriteriaList({ criterios }: { criterios: MatchCriterio[] }) {
  return (
    <ul className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
      {criterios.map((c, i) => (
        <li key={i} className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start gap-2")}>
          {c.match ? (
            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          ) : (
            <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
          )}
          <div className={cn(!c.match && 'opacity-50')}>
            <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "text-xs font-medium")}>{c.campo}</span>
            <Text variant="micro-caption" className="ml-1.5">
              {c.detalhe}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NoMatchState({
  onBuscarManualmente,
  onCriarNovo,
  onIgnorar,
}: {
  onBuscarManualmente: () => void;
  onCriarNovo: () => void;
  onIgnorar: () => void;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; p-8 → usar <Inset> */ "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center")}>
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/40">
        <AlertCircle className="size-6 text-muted-foreground" />
      </div>
      <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
        <Heading level="widget">Nenhum match encontrado</Heading>
        <Text variant="caption" className="text-muted-foreground">
          Não encontramos um expediente compatível
        </Text>
      </div>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex w-full max-w-60 flex-col items-center gap-2")}>
        <Button
          variant="outline"
          className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption"> */ "w-full gap-2 text-xs")}
          onClick={onBuscarManualmente}
        >
          <Search className="size-3.5" aria-hidden />
          Buscar Manualmente
        </Button>
        <Button
          variant="outline"
          className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption"> */ "w-full gap-2 text-xs")}
          onClick={onCriarNovo}
        >
          <Plus className="size-3.5" aria-hidden />
          Criar Novo
        </Button>
        <button
          type="button"
          className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "mt-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground")}
          onClick={onIgnorar}
        >
          Ignorar
        </button>
      </div>
    </div>
  );
}

function AllResolvedState() {
  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; p-12 → usar <Inset> */ "flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center")}>
      <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
        <Heading level="section">Tudo resolvido!</Heading>
        <Text variant="caption" className="text-muted-foreground">
          Todas as comunicações órfãs foram processadas
        </Text>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GazetteOrphanResolver() {
  const { comunicacoes, setComunicacoes } = useGazetteStore();

  const orphans = useMemo(
    () => comunicacoes.filter((c) => c.statusVinculacao === 'orfao'),
    [comunicacoes],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const totalOrphans = orphans.length + resolvedCount;
  const [expedienteDialogOpen, setExpedienteDialogOpen] = useState(false);

  const current = orphans[currentIndex] as ComunicacaoCNJEnriquecida | undefined;

  // Ensure currentIndex stays within bounds
  useEffect(() => {
    if (currentIndex >= orphans.length && orphans.length > 0) {
      setCurrentIndex(orphans.length - 1);
    }
  }, [orphans.length, currentIndex]);

  const highConfidenceCount = useMemo(
    () => orphans.filter((o) => o.matchSugestao && o.matchSugestao.confianca >= 85).length,
    [orphans],
  );

  // ── Actions ──

  const handleVincular = useCallback(
    (orphan: ComunicacaoCNJEnriquecida) => {
      const expNum = orphan.matchSugestao?.expedienteNumero ?? '?';

      // Remove from orphans by marking as vinculado
      const updated = comunicacoes.map((c) =>
        c.id === orphan.id ? { ...c, statusVinculacao: 'vinculado' as const } : c,
      );
      setComunicacoes(updated);
      setResolvedCount((prev) => prev + 1);

      toast(`Comunicacao vinculada ao Expediente #${expNum}`, {
        action: {
          label: 'Desfazer',
          onClick: () => {
            const reverted = updated.map((c) =>
              c.id === orphan.id ? { ...c, statusVinculacao: 'orfao' as const } : c,
            );
            setComunicacoes(reverted);
            setResolvedCount((prev) => Math.max(0, prev - 1));
          },
        },
      });
    },
    [comunicacoes, setComunicacoes],
  );

  const handleIgnorar = useCallback(
    (orphan: ComunicacaoCNJEnriquecida) => {
      const updated = comunicacoes.map((c) =>
        c.id === orphan.id ? { ...c, statusVinculacao: 'irrelevante' as const } : c,
      );
      setComunicacoes(updated);
      setResolvedCount((prev) => prev + 1);
    },
    [comunicacoes, setComunicacoes],
  );

  const handleAcceptHighConfidence = useCallback(() => {
    const highConf = orphans.filter(
      (o) => o.matchSugestao && o.matchSugestao.confianca >= 85,
    );
    if (highConf.length === 0) return;

    const ids = new Set(highConf.map((o) => o.id));
    const updated = comunicacoes.map((c) =>
      ids.has(c.id) ? { ...c, statusVinculacao: 'vinculado' as const } : c,
    );
    setComunicacoes(updated);
    setResolvedCount((prev) => prev + highConf.length);

    toast(`${highConf.length} comunicacao(oes) vinculada(s) automaticamente`);
  }, [orphans, comunicacoes, setComunicacoes]);

  const handleIgnoreAll = useCallback(() => {
    const ids = new Set(orphans.map((o) => o.id));
    const updated = comunicacoes.map((c) =>
      ids.has(c.id) ? { ...c, statusVinculacao: 'irrelevante' as const } : c,
    );
    setComunicacoes(updated);
    setResolvedCount((prev) => prev + orphans.length);
  }, [orphans, comunicacoes, setComunicacoes]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, orphans.length - 1));
  }, [orphans.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Enter' && current?.matchSugestao) {
        e.preventDefault();
        handleVincular(current);
      } else if (e.key === 'Escape' && current) {
        e.preventDefault();
        goNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, current, handleVincular]);

  // Build match highlights from current orphan
  const matchHighlights = useMemo(() => {
    if (!current?.matchSugestao) return [];
    const hints: string[] = [];
    if (current.matchSugestao.processoNumero) hints.push(current.matchSugestao.processoNumero);
    if (current.matchSugestao.partes) {
      hints.push(...current.matchSugestao.partes.split(/[,;]/));
    }
    if (current.matchSugestao.vara) hints.push(current.matchSugestao.vara);
    return hints.map((h) => h.trim()).filter(Boolean);
  }, [current]);

  const handleBuscarManualmente = () => {
    toast.info('Funcionalidade de busca manual em desenvolvimento');
  };

  const handleCriarExpediente = () => {
    setExpedienteDialogOpen(true);
  };

  // ── All Resolved ──

  if (orphans.length === 0) {
    return (
      <GlassPanel depth={1} className="flex h-full flex-col">
        <AllResolvedState />
      </GlassPanel>
    );
  }

  if (!current) return null;

  const match = current.matchSugestao;

  return (
    <GlassPanel depth={1} className="flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className={cn(/* design-system-escape: space-y-3 sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ "space-y-3 border-b border-border/40 p-4")}>
        {/* Title row */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between gap-3")}>
          <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-center gap-2.5")}>
            <Heading level="section">Comunicações Órfãs</Heading>
            <Text
              variant="micro-badge"
              className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-warning")}
            >
              {orphans.length}
            </Text>
          </div>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            {highConfidenceCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption"> */ "h-7 gap-1.5 border-success/20 bg-success/10 px-3 text-xs text-success hover:bg-success/15")}
                onClick={handleAcceptHighConfidence}
              >
                <Check className="size-3" aria-hidden />
                Aceitar Alta Confiança ({highConfidenceCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption"> */ "h-7 px-3 text-xs")}
              onClick={handleIgnoreAll}
            >
              Ignorar Todos
            </Button>
          </div>
        </div>

        {/* Progress */}
        <ProgressSegment resolved={resolvedCount} total={totalOrphans} />

        {/* Legend */}
        <ConfidenceLegend />
      </div>

      {/* ── Navigation Bar ── */}
      <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center justify-between border-b border-border/30 px-4 py-2")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption"> */ "h-7 gap-1 px-2 text-xs")}
            disabled={currentIndex === 0}
            onClick={goPrev}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(/* design-system-escape: gap-1 gap sem token DS; px-2 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption"> */ "h-7 gap-1 px-2 text-xs")}
            disabled={currentIndex === orphans.length - 1}
            onClick={goNext}
          >
            Próximo
            <ChevronRight className="size-3.5" aria-hidden />
          </Button>
          <Text variant="micro-caption">
            {currentIndex + 1} de {orphans.length} pendentes
          </Text>
        </div>
        <Text variant="micro-caption" className="hidden sm:block">
          ↑↓ navegar · Enter aceitar · Esc pular
        </Text>
      </div>

      {/* ── Split Panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Publicacao Original */}
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "flex flex-1 flex-col overflow-y-auto border-r border-border/30 p-4")}>
          <span className="text-overline text-muted-foreground/70">
            Publicacao Original
          </span>

          {/* Badges */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-3 flex flex-wrap items-center gap-2")}>
            {current.tipoComunicacao && (
              <Text
                variant="micro-badge"
                className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "rounded-md bg-primary/10 px-2 py-0.5 text-primary")}
              >
                {current.tipoComunicacao}
              </Text>
            )}
            <Text
              variant="micro-badge"
              className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground")}
            >
              {current.meioCompleto ?? current.meio}
            </Text>
            <Text variant="micro-caption">{formatDate(current.dataDisponibilizacao)}</Text>
          </div>

          {/* Processo */}
          <div className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "mt-4 space-y-0.5")}>
            <Text variant="overline" className="text-muted-foreground/70">
              Processo
            </Text>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium tabular-nums text-foreground")}>
              {highlightSegments(
                current.numeroProcessoMascara ?? current.numeroProcesso,
                matchHighlights,
              )}
            </p>
          </div>

          {/* Partes */}
          <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "mt-3 space-y-1.5")}>
            {current.partesAutor.length > 0 && (
              <div>
                <Text variant="micro-caption">Autor: </Text>
                <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>
                  {highlightSegments(current.partesAutor.join(', '), matchHighlights)}
                </span>
              </div>
            )}
            {current.partesReu.length > 0 && (
              <div>
                <Text variant="micro-caption">Réu: </Text>
                <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>
                  {highlightSegments(current.partesReu.join(', '), matchHighlights)}
                </span>
              </div>
            )}
          </div>

          {/* Órgão */}
          {current.nomeOrgao && (
            <div className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "mt-3 space-y-0.5")}>
              <Text variant="overline" className="text-muted-foreground/70">
                Órgão
              </Text>
              <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>
                {highlightSegments(current.nomeOrgao, matchHighlights)}
              </p>
            </div>
          )}

          {/* Texto excerpt */}
          {current.texto && (
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "mt-4 space-y-1")}>
              <Text variant="overline" className="text-muted-foreground/70">
                Trecho
              </Text>
              <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-lg border border-border/40 bg-muted/20 p-3")}>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; leading-relaxed sem token DS */ "line-clamp-6 text-xs leading-relaxed text-foreground/80")}>
                  {highlightSegments(current.texto.slice(0, 600), matchHighlights)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Match Sugerido */}
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "flex flex-1 flex-col overflow-y-auto p-4")}>
          {match ? (
            <>
              {/* Header with confidence */}
              <div className="flex items-center justify-between">
                <Text variant="overline" className="text-muted-foreground/70">
                  Match Sugerido
                </Text>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border/20">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        confidenceBg(match.confianca),
                      )}
                      style={{ width: `${match.confianca}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-bold → className de <Text>/<Heading> */ 'text-sm font-bold tabular-nums',
                      confidenceColor(match.confianca),
                    )}
                  >
                    {match.confianca}%
                  </span>
                </div>
              </div>

              {/* Match card */}
              <div className={cn(/* design-system-escape: space-y-2.5 sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ "mt-3 space-y-2.5 rounded-xl border border-success/20 bg-success/5 p-4")}>
                <div>
                  <Text variant="micro-caption">Expediente</Text>
                  <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ "text-sm font-semibold text-foreground")}>
                    #{match.expedienteNumero}
                  </p>
                </div>
                <div>
                  <Text variant="micro-caption">Processo</Text>
                  <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs tabular-nums text-foreground")}>
                    {match.processoNumero}
                  </p>
                </div>
                <div>
                  <Text variant="micro-caption">Partes</Text>
                  <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>{match.partes}</p>
                </div>
                <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4")}>
                  <div>
                    <Text variant="micro-caption">Vara</Text>
                    <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>{match.vara}</p>
                  </div>
                  <div>
                    <Text variant="micro-caption">Status</Text>
                    <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>{match.status}</p>
                  </div>
                </div>
                <div>
                  <Text variant="micro-caption">Criado em</Text>
                  <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground")}>{formatDate(match.criadoEm)}</p>
                </div>
              </div>

              {/* Criteria */}
              <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "mt-4 space-y-2")}>
                <Text variant="overline" className="text-muted-foreground/70">
                  Critérios de Match
                </Text>
                <MatchCriteriaList criterios={match.criterios} />
              </div>

              {/* Action buttons */}
              <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "mt-6 space-y-2")}>
                <button
                  type="button"
                  className={cn(/* design-system-escape: py-2.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ "w-full rounded-xl border border-success/20 bg-success/10 py-2.5 text-center text-xs font-medium text-success transition-colors hover:bg-success/15")}
                  onClick={() => handleVincular(current)}
                >
                  Vincular a Este Expediente
                </button>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-2 gap-2")}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(/* design-system-escape: gap-1.5 gap sem token DS; text-xs → migrar para <Text variant="caption"> */ "h-9 gap-1.5 text-xs")}
                    onClick={() => {
                      handleBuscarManualmente();
                    }}
                  >
                    <Search className="size-3" aria-hidden />
                    Buscar Outro
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(/* design-system-escape: gap-1.5 gap sem token DS; text-xs → migrar para <Text variant="caption"> */ "h-9 gap-1.5 text-xs")}
                    onClick={() => {
                      handleCriarExpediente();
                    }}
                  >
                    <Plus className="size-3" aria-hidden />
                    Criar Expediente
                  </Button>
                </div>
                <button
                  type="button"
                  className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "w-full text-center text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground")}
                  onClick={() => handleIgnorar(current)}
                >
                  <Ban className="mr-1 inline size-3" aria-hidden />
                  Marcar Irrelevante
                </button>
              </div>
            </>
          ) : (
            <NoMatchState
              onBuscarManualmente={() => {
                handleBuscarManualmente();
              }}
              onCriarNovo={() => {
                handleCriarExpediente();
              }}
              onIgnorar={() => handleIgnorar(current)}
            />
          )}
        </div>
      </div>
      {current && (
        <ExpedienteDialog
          open={expedienteDialogOpen}
          onOpenChange={setExpedienteDialogOpen}
          onSuccess={() => {
            setExpedienteDialogOpen(false);
          }}
          dadosIniciais={{
            numeroProcesso: current.numeroProcesso,
            processoId: 0,
            trt: "TRT1",
            grau: GrauTribunal.PRIMEIRO_GRAU,
            nomeParteAutora: current.partesAutor?.[0],
            nomeParteRe: current.partesReu?.[0]
          }}
        />
      )}
    </GlassPanel>
  );
}
