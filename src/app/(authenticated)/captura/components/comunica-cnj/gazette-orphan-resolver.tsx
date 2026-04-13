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
import { GlassPanel } from '@/components/shared/glass-panel';
import { useGazetteStore } from './hooks/use-gazette-store';
import type {
  ComunicacaoCNJEnriquecida,
  MatchSugestao,
  MatchCriterio,
} from '@/app/(authenticated)/captura/comunica-cnj/domain';

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
      <span key={i} className="bg-primary/15 px-0.5 rounded">
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
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full bg-success" />
        Alta (&gt;85%)
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full bg-warning" />
        Media (50-85%)
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full bg-muted-foreground" />
        Sem match
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
    <div className="space-y-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border/20">
        <div
          className="rounded-full bg-gradient-to-r from-success/80 to-success transition-all duration-500"
          style={{ width: `${pctResolved}%` }}
        />
        <div
          className="bg-warning/60 transition-all duration-500"
          style={{ width: `${pctPending}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {resolved} de {total} resolvidos ({total > 0 ? Math.round(pctResolved) : 0}%)
      </p>
    </div>
  );
}

function MatchCriteriaList({ criterios }: { criterios: MatchCriterio[] }) {
  return (
    <ul className="space-y-2">
      {criterios.map((c, i) => (
        <li key={i} className="flex items-start gap-2">
          {c.match ? (
            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          ) : (
            <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
          )}
          <div className={cn(!c.match && 'opacity-50')}>
            <span className="text-[12px] font-medium">{c.campo}</span>
            <span className="ml-1.5 text-[11px] text-muted-foreground">{c.detalhe}</span>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/40">
        <AlertCircle className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-foreground">Nenhum match encontrado</p>
        <p className="text-[12px] text-muted-foreground">
          Nao encontramos um expediente compativel
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 w-full max-w-[240px]">
        <Button
          variant="outline"
          className="w-full gap-2 text-[12px]"
          onClick={onBuscarManualmente}
        >
          <Search className="size-3.5" />
          Buscar Manualmente
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2 text-[12px]"
          onClick={onCriarNovo}
        >
          <Plus className="size-3.5" />
          Criar Novo
        </Button>
        <button
          type="button"
          className="text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-1"
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <div className="space-y-1">
        <p className="text-[16px] font-semibold text-foreground">Tudo resolvido!</p>
        <p className="text-[12px] text-muted-foreground">
          Todas as comunicacoes orfas foram processadas
        </p>
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
      <div className="space-y-3 border-b border-border/40 p-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-semibold text-foreground">
              Comunicacoes Orfas
            </h2>
            <span className="inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
              {orphans.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {highConfidenceCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-success/20 bg-success/10 px-3 text-[11px] text-success hover:bg-success/15"
                onClick={handleAcceptHighConfidence}
              >
                <Check className="size-3" />
                Aceitar Alta Confianca ({highConfidenceCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-[11px]"
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
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            disabled={currentIndex === 0}
            onClick={goPrev}
          >
            <ChevronLeft className="size-3.5" />
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[11px]"
            disabled={currentIndex === orphans.length - 1}
            onClick={goNext}
          >
            Proximo
            <ChevronRight className="size-3.5" />
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {currentIndex + 1} de {orphans.length} pendentes
          </span>
        </div>
        <span className="hidden text-[10px] text-muted-foreground/60 sm:block">
          ↑↓ navegar · Enter aceitar · Esc pular
        </span>
      </div>

      {/* ── Split Panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Publicacao Original */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-border/30 p-4">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Publicacao Original
          </span>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {current.tipoComunicacao && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {current.tipoComunicacao}
              </span>
            )}
            <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              {current.meioCompleto ?? current.meio}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatDate(current.dataDisponibilizacao)}
            </span>
          </div>

          {/* Processo */}
          <div className="mt-4 space-y-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Processo
            </span>
            <p className="text-[13px] font-medium text-foreground">
              {highlightSegments(
                current.numeroProcessoMascara ?? current.numeroProcesso,
                matchHighlights,
              )}
            </p>
          </div>

          {/* Partes */}
          <div className="mt-3 space-y-1.5">
            {current.partesAutor.length > 0 && (
              <div>
                <span className="text-[10px] text-muted-foreground">Autor: </span>
                <span className="text-[12px] text-foreground">
                  {highlightSegments(current.partesAutor.join(', '), matchHighlights)}
                </span>
              </div>
            )}
            {current.partesReu.length > 0 && (
              <div>
                <span className="text-[10px] text-muted-foreground">Reu: </span>
                <span className="text-[12px] text-foreground">
                  {highlightSegments(current.partesReu.join(', '), matchHighlights)}
                </span>
              </div>
            )}
          </div>

          {/* Orgao */}
          {current.nomeOrgao && (
            <div className="mt-3 space-y-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Orgao
              </span>
              <p className="text-[12px] text-foreground">
                {highlightSegments(current.nomeOrgao, matchHighlights)}
              </p>
            </div>
          )}

          {/* Texto excerpt */}
          {current.texto && (
            <div className="mt-4 space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Trecho
              </span>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <p className="line-clamp-6 text-[11px] leading-relaxed text-foreground/80">
                  {highlightSegments(current.texto.slice(0, 600), matchHighlights)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Match Sugerido */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {match ? (
            <>
              {/* Header with confidence */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Match Sugerido
                </span>
                <div className="flex items-center gap-2">
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
                      'text-[13px] font-bold',
                      confidenceColor(match.confianca),
                    )}
                  >
                    {match.confianca}%
                  </span>
                </div>
              </div>

              {/* Match card */}
              <div className="mt-3 rounded-xl border border-success/10 bg-success/[0.03] p-4 space-y-2.5">
                <div>
                  <span className="text-[10px] text-muted-foreground">Expediente</span>
                  <p className="text-[13px] font-semibold text-foreground">
                    #{match.expedienteNumero}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Processo</span>
                  <p className="text-[12px] text-foreground">{match.processoNumero}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Partes</span>
                  <p className="text-[12px] text-foreground">{match.partes}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Vara</span>
                    <p className="text-[12px] text-foreground">{match.vara}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Status</span>
                    <p className="text-[12px] text-foreground">{match.status}</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Criado em</span>
                  <p className="text-[12px] text-foreground">{formatDate(match.criadoEm)}</p>
                </div>
              </div>

              {/* Criteria */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Criterios de Match
                </span>
                <MatchCriteriaList criterios={match.criterios} />
              </div>

              {/* Action buttons */}
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  className="w-full rounded-xl border border-success/20 bg-success/10 py-2.5 text-center text-[12px] font-medium text-success transition-colors hover:bg-success/15"
                  onClick={() => handleVincular(current)}
                >
                  Vincular a Este Expediente
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-[11px]"
                    onClick={() => {
                      /* TODO: buscar outro */
                    }}
                  >
                    <Search className="size-3" />
                    Buscar Outro
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 text-[11px]"
                    onClick={() => {
                      /* TODO: criar expediente */
                    }}
                  >
                    <Plus className="size-3" />
                    Criar Expediente
                  </Button>
                </div>
                <button
                  type="button"
                  className="w-full text-center text-[11px] text-muted-foreground/20 transition-colors hover:text-muted-foreground/60"
                  onClick={() => handleIgnorar(current)}
                >
                  <Ban className="mr-1 inline size-3" />
                  Marcar Irrelevante
                </button>
              </div>
            </>
          ) : (
            <NoMatchState
              onBuscarManualmente={() => {
                /* TODO */
              }}
              onCriarNovo={() => {
                /* TODO */
              }}
              onIgnorar={() => handleIgnorar(current)}
            />
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
