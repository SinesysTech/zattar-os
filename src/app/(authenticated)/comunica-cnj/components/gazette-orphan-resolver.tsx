'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Heading, Text } from '@/components/ui/typography';
import { useGazetteStore } from './hooks/use-gazette-store';
import { usePesquisaStore } from './hooks/use-pesquisa-store';
import { ExpedienteDialog, GrauTribunal } from '@/app/(authenticated)/expedientes';
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
      <span key={i} className={cn("bg-primary/15 px-0.5 rounded")}>
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
    <div className={cn("flex items-center inline-default")}>
      <span className={cn("flex items-center inline-snug")}>
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <Text variant="micro-caption">Alta (&gt;85%)</Text>
      </span>
      <span className={cn("flex items-center inline-snug")}>
        <span className="size-2 rounded-full bg-warning" aria-hidden />
        <Text variant="micro-caption">Média (50-85%)</Text>
      </span>
      <span className={cn("flex items-center inline-snug")}>
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
    <div className={cn("flex flex-col stack-snug")}>
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
    <ul className={cn("flex flex-col stack-tight")}>
      {criterios.map((c, i) => (
        <li key={i} className={cn("flex items-start inline-tight")}>
          {c.match ? (
            <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
          ) : (
            <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/65" />
          )}
          <div className={cn(!c.match && 'opacity-50')}>
            <Text variant="caption" weight="medium">{c.campo}</Text>
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
    <div className={cn("flex flex-1 flex-col items-center justify-center inline-default inset-extra-loose text-center")}>
      <div className="flex size-14 items-center justify-center rounded-full bg-muted/40">
        <AlertCircle className="size-6 text-muted-foreground" />
      </div>
      <div className={cn("flex flex-col stack-micro")}>
        <Heading level="widget">Nenhum match encontrado</Heading>
        <Text variant="caption" className="text-muted-foreground">
          Não encontramos um expediente compatível
        </Text>
      </div>
      <div className={cn("flex w-full max-w-60 flex-col items-center inline-tight")}>
        <Button
          variant="outline"
          className={cn("flex w-full inline-tight text-caption")}
          onClick={onBuscarManualmente}
        >
          <Search className="size-3.5" aria-hidden />
          Buscar Manualmente
        </Button>
        <Button
          variant="outline"
          className={cn("flex w-full inline-tight text-caption")}
          onClick={onCriarNovo}
        >
          <Plus className="size-3.5" aria-hidden />
          Criar Novo
        </Button>
        <button
          type="button"
          className={cn("mt-1 text-caption text-muted-foreground/60 transition-colors hover:text-muted-foreground")}
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
    <div className={cn("flex flex-1 flex-col items-center justify-center inline-default inset-mega text-center")}>
      <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="size-8 text-success" />
      </div>
      <div className={cn("flex flex-col stack-micro")}>
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
  const [isExpedienteDialogOpen, setIsExpedienteDialogOpen] = useState(false);

  const { comunicacoes, setComunicacoes } = useGazetteStore();

  const orphans = useMemo(
    () => comunicacoes.filter((c) => c.statusVinculacao === 'orfao'),
    [comunicacoes],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const totalOrphans = orphans.length + resolvedCount;

  const current = orphans[currentIndex] as ComunicacaoCNJEnriquecida | undefined;

  const handleExpedienteCriado = useCallback(() => {
    setIsExpedienteDialogOpen(false);
    if (!current) return;

    const updated = comunicacoes.map((c) =>
      c.id === current.id ? { ...c, statusVinculacao: 'vinculado' as const } : c,
    );
    setComunicacoes(updated);
    setResolvedCount((prev) => prev + 1);
    toast.success('Expediente criado e comunicação vinculada com sucesso!');
  }, [current, comunicacoes, setComunicacoes]);

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

  // ── Navigation ──

  const setTermo = usePesquisaStore((s) => s.setTermo);
  const setFiltros = usePesquisaStore((s) => s.setFiltros);
  const router = useRouter();

  const handleBuscarManualmente = useCallback(
    (orphan: ComunicacaoCNJEnriquecida) => {
      if (orphan.numeroProcessoMascara || orphan.numeroProcesso) {
        setTermo(orphan.numeroProcessoMascara ?? orphan.numeroProcesso);
      } else {
        setTermo(orphan.partesAutor?.[0] ?? orphan.partesReu?.[0] ?? '');
      }

      if (orphan.nomeOrgao) {
        setFiltros({ nomeParte: orphan.nomeOrgao });
      }

      toast('Redirecionando para busca...', {
        description: 'Os parâmetros da comunicação foram copiados para a barra de pesquisa.',
      });
      router.push('/comunica-cnj');
    },
    [setTermo, setFiltros, router],
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
      <div className={cn("flex flex-col stack-medium border-b border-border/40 inset-card-compact")}>
        {/* Title row */}
        <div className={cn("flex items-center justify-between inline-medium")}>
          <div className={cn("flex items-center inline-tight-plus")}>
            <Heading level="section">Comunicações Órfãs</Heading>
            <Text
              variant="micro-badge"
              className={cn("inline-flex items-center rounded-full bg-warning/10 px-2 py-0.5 text-warning")}
            >
              {orphans.length}
            </Text>
          </div>
          <div className={cn("flex items-center inline-tight")}>
            {highConfidenceCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className={cn("flex h-7 inline-snug border-success/20 bg-success/10 px-3 text-caption text-success hover:bg-success/15")}
                onClick={handleAcceptHighConfidence}
              >
                <Check className="size-3" aria-hidden />
                Aceitar Alta Confiança ({highConfidenceCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn("h-7 px-3 text-caption")}
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
      <div className={cn("flex items-center justify-between border-b border-border/30 px-4 py-2")}>
        <div className={cn("flex items-center inline-tight")}>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex h-7 inline-micro px-2 text-caption")}
            disabled={currentIndex === 0}
            onClick={goPrev}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex h-7 inline-micro px-2 text-caption")}
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
        <div className={cn("flex flex-1 flex-col overflow-y-auto border-r border-border/30 inset-card-compact")}>
          <span className="text-overline text-muted-foreground/70">
            Publicacao Original
          </span>

          {/* Badges */}
          <div className={cn("mt-3 flex flex-wrap items-center inline-tight")}>
            {current.tipoComunicacao && (
              <Text
                variant="micro-badge"
                className={cn("rounded-md bg-primary/10 px-2 py-0.5 text-primary")}
              >
                {current.tipoComunicacao}
              </Text>
            )}
            <Text
              variant="micro-badge"
              className={cn("rounded-md bg-muted/40 px-2 py-0.5 text-muted-foreground")}
            >
              {current.meioCompleto ?? current.meio}
            </Text>
            <Text variant="micro-caption">{formatDate(current.dataDisponibilizacao)}</Text>
          </div>

          {/* Processo */}
          <div className={cn("flex flex-col mt-4 stack-nano")}>
            <Text variant="overline" className="text-muted-foreground/70">
              Processo
            </Text>
            <p className={cn( "text-body-sm font-medium tabular-nums text-foreground")}>
              {highlightSegments(
                current.numeroProcessoMascara ?? current.numeroProcesso,
                matchHighlights,
              )}
            </p>
          </div>

          {/* Partes */}
          <div className={cn("flex flex-col mt-3 stack-snug")}>
            {current.partesAutor.length > 0 && (
              <div>
                <Text variant="micro-caption">Autor: </Text>
                <Text variant="caption" className="text-foreground">
                  {highlightSegments(current.partesAutor.join(', '), matchHighlights)}
                </Text>
              </div>
            )}
            {current.partesReu.length > 0 && (
              <div>
                <Text variant="micro-caption">Réu: </Text>
                <Text variant="caption" className="text-foreground">
                  {highlightSegments(current.partesReu.join(', '), matchHighlights)}
                </Text>
              </div>
            )}
          </div>

          {/* Órgão */}
          {current.nomeOrgao && (
            <div className={cn("flex flex-col mt-3 stack-nano")}>
              <Text variant="overline" className="text-muted-foreground/70">
                Órgão
              </Text>
              <Text variant="caption" className="text-foreground">
                {highlightSegments(current.nomeOrgao, matchHighlights)}
              </Text>
            </div>
          )}

          {/* Texto excerpt */}
          {current.texto && (
            <div className={cn("flex flex-col mt-4 stack-micro")}>
              <Text variant="overline" className="text-muted-foreground/70">
                Trecho
              </Text>
              <div className={cn("rounded-lg border border-border/40 bg-muted/20 inset-medium")}>
                <Text variant="caption" className="line-clamp-6 text-foreground/80">
                  {highlightSegments(current.texto.slice(0, 600), matchHighlights)}
                </Text>
              </div>
            </div>
          )}
        </div>

        {/* Right — Match Sugerido */}
        <div className={cn("flex flex-1 flex-col overflow-y-auto inset-card-compact")}>
          {match ? (
            <>
              {/* Header with confidence */}
              <div className="flex items-center justify-between">
                <Text variant="overline" className="text-muted-foreground/70">
                  Match Sugerido
                </Text>
                <div className={cn("flex items-center inline-tight")}>
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
                       'text-body-sm font-bold tabular-nums',
                      confidenceColor(match.confianca),
                    )}
                  >
                    {match.confianca}%
                  </span>
                </div>
              </div>

              {/* Match card */}
              <div className={cn("flex flex-col mt-3 stack-tight-plus rounded-xl border border-success/20 bg-success/5 inset-card-compact")}>
                <div>
                  <Text variant="micro-caption">Expediente</Text>
                  <p className={cn( "text-body-sm font-semibold text-foreground")}>
                    #{match.expedienteNumero}
                  </p>
                </div>
                <div>
                  <Text variant="micro-caption">Processo</Text>
                  <Text variant="caption" className="tabular-nums text-foreground">
                    {match.processoNumero}
                  </Text>
                </div>
                <div>
                  <Text variant="micro-caption">Partes</Text>
                  <Text variant="caption" className="text-foreground">{match.partes}</Text>
                </div>
                <div className={cn("flex inline-default")}>
                  <div>
                    <Text variant="micro-caption">Vara</Text>
                    <Text variant="caption" className="text-foreground">{match.vara}</Text>
                  </div>
                  <div>
                    <Text variant="micro-caption">Status</Text>
                    <Text variant="caption" className="text-foreground">{match.status}</Text>
                  </div>
                </div>
                <div>
                  <Text variant="micro-caption">Criado em</Text>
                  <Text variant="caption" className="text-foreground">{formatDate(match.criadoEm)}</Text>
                </div>
              </div>

              {/* Criteria */}
              <div className={cn("flex flex-col mt-4 stack-tight")}>
                <Text variant="overline" className="text-muted-foreground/70">
                  Critérios de Match
                </Text>
                <MatchCriteriaList criterios={match.criterios} />
              </div>

              {/* Action buttons */}
              <div className={cn("flex flex-col mt-6 stack-tight")}>
                <button
                  type="button"
                  className={cn(/* design-system-escape: py-2.5 padding direcional sem Inset equiv.; */ "w-full rounded-xl border border-success/20 bg-success/10 py-2.5 text-center text-caption font-medium text-success transition-colors hover:bg-success/15")}
                  onClick={() => handleVincular(current)}
                >
                  Vincular a Este Expediente
                </button>
                <div className={cn("grid grid-cols-2 inline-tight")}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("flex h-9 inline-snug text-caption")}
                    onClick={() => handleBuscarManualmente(current)}
                  >
                    <Search className="size-3" aria-hidden />
                    Buscar Outro
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("flex h-9 inline-snug text-caption")}
                    onClick={() => setIsExpedienteDialogOpen(true)}
                  >
                    <Plus className="size-3" aria-hidden />
                    Criar Expediente
                  </Button>
                </div>
                <button
                  type="button"
                  className={cn("w-full text-center text-caption text-muted-foreground/60 transition-colors hover:text-muted-foreground")}
                  onClick={() => handleIgnorar(current)}
                >
                  <Ban className="mr-1 inline size-3" aria-hidden />
                  Marcar Irrelevante
                </button>
              </div>
            </>
          ) : (
            <NoMatchState
              onBuscarManualmente={() => handleBuscarManualmente(current)}
              onCriarNovo={() => setIsExpedienteDialogOpen(true)}
              onIgnorar={() => handleIgnorar(current)}
            />
          )}
        </div>
      </div>
      <ExpedienteDialog
        open={isExpedienteDialogOpen}
        onOpenChange={setIsExpedienteDialogOpen}
        onSuccess={handleExpedienteCriado}
        dadosIniciais={current ? {
          numeroProcesso: current.numeroProcesso,
          processoId: 0,
          trt: 'TRT1',
          grau: GrauTribunal.PRIMEIRO_GRAU,
          nomeParteAutora: current.partesAutor?.[0],
          nomeParteRe: current.partesReu?.[0],
        } : undefined}
      />
    </GlassPanel>
  );
}
