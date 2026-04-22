'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNowStrict, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit3,
  FileText,
  Flag,
  Lock,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  Tag,
  User,
} from 'lucide-react';

import { AmbientBackdrop } from '@/components/shared/ambient-backdrop';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { EditableTextCell } from '@/components/shared/data-shell/editable-text-cell';
import { cn } from '@/lib/utils';

import type { Expediente } from '@/app/(authenticated)/expedientes/domain';
import {
  GRAU_TRIBUNAL_LABELS,
  ORIGEM_EXPEDIENTE_LABELS,
  getExpedientePartyNames,
  getExpedienteUrgencyLevel,
} from '@/app/(authenticated)/expedientes/domain';
import { ExpedienteResponsavelPopover } from '@/app/(authenticated)/expedientes/components/expediente-responsavel-popover';

import type {
  ExpedienteDetailBundle,
  MockArquivo,
  MockHistoricoEvento,
  MockTipoExpediente,
  MockUsuario,
} from './mocks';

interface ExpedienteDetalhesClientProps {
  bundle: ExpedienteDetailBundle;
  expedienteId: number;
}

type TabId = 'dados' | 'arquivos' | 'historico';

const URGENCY_STYLE = {
  critico: {
    token: 'destructive',
    accent: 'text-destructive',
    ring: 'ring-destructive/30',
    blob: 'bg-destructive/10',
    label: 'VENCIDO',
  },
  alto: {
    token: 'warning',
    accent: 'text-warning',
    ring: 'ring-warning/30',
    blob: 'bg-warning/10',
    label: 'VENCE HOJE',
  },
  medio: {
    token: 'warning',
    accent: 'text-warning',
    ring: 'ring-warning/25',
    blob: 'bg-warning/10',
    label: 'PRAZO APERTADO',
  },
  baixo: {
    token: 'primary',
    accent: 'text-primary',
    ring: 'ring-primary/30',
    blob: 'bg-primary/10',
    label: 'NO PRAZO',
  },
  ok: {
    token: 'muted',
    accent: 'text-muted-foreground',
    ring: 'ring-muted-foreground/20',
    blob: 'bg-muted/40',
    label: 'SEM PRAZO',
  },
} as const;

export function ExpedienteDetalhesClient({
  bundle,
  expedienteId,
}: ExpedienteDetalhesClientProps) {
  const [expediente, setExpediente] = React.useState<Expediente>(bundle.expediente);
  const [activeTab, setActiveTab] = React.useState<TabId>('dados');

  const { usuarios, tiposExpedientes, arquivos, historico } = bundle;

  const partyNames = getExpedientePartyNames(expediente);

  const tipoAtual = React.useMemo(
    () => tiposExpedientes.find((t) => t.id === expediente.tipoExpedienteId) ?? null,
    [tiposExpedientes, expediente.tipoExpedienteId],
  );
  const urgency = getExpedienteUrgencyLevel(expediente);
  const style = URGENCY_STYLE[urgency];

  const simulateSave = React.useCallback(async (label: string, mutator: () => void) => {
    await new Promise((r) => setTimeout(r, 400));
    mutator();
    toast.success(`${label} atualizado.`);
  }, []);

  const handleSaveDescricao = async (novo: string) =>
    simulateSave('Descrição', () =>
      setExpediente((prev) => ({
        ...prev,
        descricaoArquivos: novo,
        updatedAt: new Date().toISOString(),
      })),
    );

  const handleSaveObservacoes = async (novo: string) =>
    simulateSave('Observações', () =>
      setExpediente((prev) => ({
        ...prev,
        observacoes: novo,
        updatedAt: new Date().toISOString(),
      })),
    );

  const handleSaveTipo = async (tipoId: number | null) =>
    simulateSave('Tipo', () =>
      setExpediente((prev) => ({ ...prev, tipoExpedienteId: tipoId })),
    );

  const handleCopyProcesso = () => {
    navigator.clipboard.writeText(expediente.numeroProcesso);
    toast.success('Número do processo copiado.');
  };

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: 'dados', label: 'Dados do expediente' },
    { id: 'arquivos', label: 'Arquivos', count: arquivos.length },
    { id: 'historico', label: 'Histórico', count: historico.length },
  ];

  return (
    <div className="relative flex flex-col gap-8 pb-12">
      <AmbientBackdrop blurIntensity={18} grid baseGradient />

      <div className="relative z-10 flex flex-col gap-8">
        {/* ============================= BREADCRUMB ============================ */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">
            <Link
              href="/expedientes"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3" />
              Expedientes
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/40" />
            <span className="text-foreground/80 tabular-nums">
              #{expedienteId.toString().padStart(6, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs gap-1.5">
              <Download className="size-3" />
              PDF
            </Button>
            <Button size="sm" className="rounded-full h-8 px-3 text-xs gap-1.5">
              <Edit3 className="size-3" />
              Editar
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* =============================== HERO ================================ */}
        <HeroBlock
          expediente={expediente}
          partyNames={partyNames}
          urgency={urgency}
          style={style}
          tipoLabel={tipoAtual?.tipo_expediente ?? null}
          onCopyProcesso={handleCopyProcesso}
        />

        {/* ================================ TABS ============================= */}
        <EditorialTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* ============================ TAB CONTENT ========================== */}
        <div>
          {activeTab === 'dados' && (
            <DadosTab
              expediente={expediente}
              usuarios={usuarios}
              tiposExpedientes={tiposExpedientes}
              tipoAtual={tipoAtual}
              onSaveDescricao={handleSaveDescricao}
              onSaveObservacoes={handleSaveObservacoes}
              onSaveTipo={handleSaveTipo}
            />
          )}
          {activeTab === 'arquivos' && <ArquivosTab arquivos={arquivos} />}
          {activeTab === 'historico' && (
            <HistoricoTab historico={historico} usuarios={usuarios} />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HERO — número gigante do prazo + partes editoriais
// ============================================================================

function HeroBlock({
  expediente,
  partyNames,
  urgency,
  style,
  tipoLabel,
  onCopyProcesso,
}: {
  expediente: Expediente;
  partyNames: { autora: string | null; re: string | null };
  urgency: keyof typeof URGENCY_STYLE;
  style: (typeof URGENCY_STYLE)[keyof typeof URGENCY_STYLE];
  tipoLabel: string | null;
  onCopyProcesso: () => void;
}) {
  const prazo = expediente.dataPrazoLegalParte;
  const diasAteVenc = prazo ? differenceInDays(parseISO(prazo), new Date()) : null;

  const heroNumber =
    diasAteVenc === null
      ? '—'
      : diasAteVenc < 0
        ? Math.abs(diasAteVenc).toString()
        : diasAteVenc.toString();

  const heroUnit =
    diasAteVenc === null
      ? ''
      : diasAteVenc === 0
        ? 'HOJE'
        : Math.abs(diasAteVenc) === 1
          ? diasAteVenc < 0
            ? 'DIA VENCIDO'
            : 'DIA'
          : diasAteVenc < 0
            ? 'DIAS VENCIDOS'
            : 'DIAS';

  const prazoFormatted = prazo
    ? format(parseISO(prazo), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  return (
    <div className="relative">
      <GlassPanel
        depth={2}
        className={cn(
          'relative overflow-hidden p-8 md:p-10 lg:p-12 rounded-[2rem]',
          'ring-1 ring-inset',
          style.ring,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'absolute -top-20 -right-16 size-80 rounded-full blur-3xl opacity-60',
            style.blob,
          )}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1px_1fr] gap-8 lg:gap-10">
          {/* Countdown editorial */}
          <div className="flex flex-col gap-3">
            <span
              className={cn(
                'text-[10px] font-mono font-semibold uppercase tracking-[0.22em]',
                style.accent,
              )}
            >
              {style.label}
            </span>
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  'font-heading font-black leading-[0.85] tracking-tighter tabular-nums',
                  'text-[7rem] md:text-[8.5rem] lg:text-[9.5rem]',
                  style.accent,
                )}
              >
                {heroNumber}
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/75 self-end pb-4">
                {heroUnit}
              </span>
            </div>
            {prazoFormatted && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/70">
                <Clock className="size-3" />
                <span className="uppercase tracking-wider">{prazoFormatted}</span>
              </div>
            )}
          </div>

          {/* Divisor vertical */}
          <div
            aria-hidden="true"
            className="hidden lg:block w-px bg-linear-to-b from-transparent via-border/40 to-transparent"
          />

          {/* Partes editoriais */}
          <div className="flex flex-col gap-5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {tipoLabel && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1',
                    'font-mono text-[10px] font-semibold uppercase tracking-wider',
                    'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
                  )}
                >
                  {tipoLabel}
                </span>
              )}
              {expediente.baixadoEm ? (
                <StatusChip icon={CheckCircle2} label="Baixado" tone="success" />
              ) : (
                <StatusChip icon={Clock} label="Em andamento" tone="warning" />
              )}
              {expediente.prioridadeProcessual && (
                <StatusChip icon={Flag} label="Prioridade" tone="destructive" />
              )}
            </div>

            <div className="space-y-1.5">
              <h1 className="font-heading font-black tracking-tight text-foreground leading-[1.05] text-3xl md:text-4xl lg:text-[2.75rem]">
                {partyNames.autora || 'Parte autora ausente'}
              </h1>
              <div className="flex items-center gap-3 py-0.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
                  versus
                </span>
                <span className="h-px flex-1 bg-border/30" />
              </div>
              <h2 className="font-heading font-bold tracking-tight text-foreground/80 leading-[1.1] text-2xl md:text-3xl lg:text-[2.25rem]">
                {partyNames.re || 'Parte ré ausente'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <MetaPill label="Tribunal" value={expediente.trt} />
              <MetaPill
                label="Grau"
                value={GRAU_TRIBUNAL_LABELS[expediente.grau]}
              />
              <button
                type="button"
                onClick={onCopyProcesso}
                className="group inline-flex items-center gap-2"
                title="Copiar número do processo"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                  Processo
                </span>
                <span className="font-mono text-[13px] font-medium text-foreground/85 tabular-nums group-hover:text-foreground transition-colors">
                  {expediente.numeroProcesso}
                </span>
                <Copy className="size-3 text-muted-foreground/30 group-hover:text-foreground/60 transition-colors" />
              </button>
            </div>

            {(expediente.classeJudicial || expediente.descricaoOrgaoJulgador) && (
              <div className="font-mono text-[11px] text-muted-foreground/70 space-y-0.5 pt-1">
                {expediente.classeJudicial && (
                  <div>{expediente.classeJudicial}</div>
                )}
                {expediente.descricaoOrgaoJulgador && (
                  <div>{expediente.descricaoOrgaoJulgador}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

// ============================================================================
// TABS — linha editorial minimalista
// ============================================================================

function EditorialTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: TabId; label: string; count?: number }>;
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="relative border-b border-border/30">
      <div className="flex gap-8 overflow-x-auto -mb-px">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative pb-3 pt-1 transition-colors whitespace-nowrap',
                'font-heading text-sm font-semibold tracking-tight',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground/50 hover:text-muted-foreground',
              )}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums rounded-full px-1.5 py-0.5',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'bg-muted/40 text-muted-foreground/60',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB · DADOS — layout editorial com sidebar densa
// ============================================================================

function DadosTab({
  expediente,
  usuarios,
  tiposExpedientes,
  tipoAtual,
  onSaveDescricao,
  onSaveObservacoes,
  onSaveTipo,
}: {
  expediente: Expediente;
  usuarios: MockUsuario[];
  tiposExpedientes: MockTipoExpediente[];
  tipoAtual: MockTipoExpediente | null;
  onSaveDescricao: (novo: string) => Promise<void>;
  onSaveObservacoes: (novo: string) => Promise<void>;
  onSaveTipo: (id: number | null) => Promise<void>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-14">
      {/* ========================== MAIN EDITORIAL ========================== */}
      <div className="space-y-12">
        <EditorialBlock
          overline="§ 01"
          title="Classificação"
          hint={null}
        >
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4">
            <div className="min-w-0">
              <FieldLabel>Tipo do expediente</FieldLabel>
              <InlineTipoEditor
                current={tipoAtual}
                options={tiposExpedientes}
                onSave={onSaveTipo}
              />
            </div>
          </div>
        </EditorialBlock>

        <EditorialBlock
          overline="§ 02"
          title="Intimação"
          hint="Edite clicando no texto"
          accent="primary"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
            Texto oficial publicado no PJE
          </p>
          <div className="relative pl-6 border-l-2 border-primary/30">
            <EditableTextCell
              value={expediente.descricaoArquivos}
              onSave={onSaveDescricao}
              title="Editar intimação"
              placeholder="Texto oficial da intimação…"
              emptyPlaceholder="Clique para adicionar o texto da intimação"
              triggerClassName="min-h-24 w-full"
              className="font-headline text-[15px] leading-[1.7] text-foreground/90 max-h-none"
            />
          </div>
        </EditorialBlock>

        <EditorialBlock
          overline="§ 03"
          title="Observações internas"
          hint="Edite clicando no texto"
          accent="secondary"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
            Resumo interno, estratégia, pontos de atenção
          </p>
          <div className="relative pl-6 border-l-2 border-foreground/15">
            <EditableTextCell
              value={expediente.observacoes}
              onSave={onSaveObservacoes}
              title="Editar observações"
              placeholder="Anotações internas, estratégia…"
              emptyPlaceholder="Clique para adicionar observações"
              triggerClassName="min-h-20 w-full"
              className="font-headline text-[15px] leading-[1.7] text-foreground/85 max-h-none"
            />
          </div>
        </EditorialBlock>

        {expediente.baixadoEm && (
          <EditorialBlock overline="§ 04" title="Baixa e decisão">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <StatField
                label="Baixado em"
                value={format(parseISO(expediente.baixadoEm), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
              />
              <StatField label="Protocolo" value={expediente.protocoloId ?? '—'} />
              <StatField
                label="Justificativa"
                value={expediente.justificativaBaixa ?? '—'}
                className="md:col-span-2"
              />
              <StatField
                label="Resultado"
                value={expediente.resultadoDecisao ?? '—'}
                className="md:col-span-2"
              />
            </dl>
          </EditorialBlock>
        )}
      </div>

      {/* =============================== SIDEBAR =============================== */}
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <ResponsavelCard
          expedienteId={expediente.id}
          responsavelId={expediente.responsavelId}
          usuarios={usuarios}
        />

        <SidebarSection label="Cronologia">
          <CronologiaRow
            label="Ciência"
            value={
              expediente.dataCienciaParte
                ? format(parseISO(expediente.dataCienciaParte), 'dd MMM yyyy', { locale: ptBR })
                : '—'
            }
          />
          <CronologiaRow
            label="Prazo legal"
            value={
              expediente.dataPrazoLegalParte
                ? format(parseISO(expediente.dataPrazoLegalParte), 'dd MMM yyyy', { locale: ptBR })
                : '—'
            }
            emphasis
          />
          <CronologiaRow
            label="Autuação"
            value={
              expediente.dataAutuacao
                ? format(parseISO(expediente.dataAutuacao), 'dd MMM yyyy', { locale: ptBR })
                : '—'
            }
          />
          <CronologiaRow
            label="Criado"
            value={format(parseISO(expediente.createdAt), 'dd MMM yyyy', { locale: ptBR })}
          />
          <CronologiaRow
            label="Atualizado"
            value={formatDistanceToNowStrict(parseISO(expediente.updatedAt), { locale: ptBR, addSuffix: true })}
            muted
          />
        </SidebarSection>

        <SidebarSection label="Marcações">
          <FlagChip icon={Lock} label="Segredo" active={expediente.segredoJustica} />
          <FlagChip icon={Monitor} label="Juízo digital" active={expediente.juizoDigital} />
          <FlagChip icon={Flag} label="Prioridade" active={expediente.prioridadeProcessual} />
        </SidebarSection>

        <SidebarSection label="Proveniência">
          <CronologiaRow label="Origem" value={ORIGEM_EXPEDIENTE_LABELS[expediente.origem]} />
          <CronologiaRow
            label="ID PJE"
            value={expediente.idPje?.toString() ?? '—'}
            mono
          />
          <CronologiaRow
            label="Status"
            value={expediente.codigoStatusProcesso ?? '—'}
          />
        </SidebarSection>
      </aside>
    </div>
  );
}

// ============================================================================
// TAB · ARQUIVOS — lista editorial numerada
// ============================================================================

function ArquivosTab({ arquivos }: { arquivos: MockArquivo[] }) {
  if (arquivos.length === 0) {
    return (
      <GlassPanel depth={1} className="p-12 text-center rounded-2xl">
        <Text variant="caption" className="text-muted-foreground/60">
          Nenhum arquivo vinculado a este expediente.
        </Text>
      </GlassPanel>
    );
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const CATEGORIA_LABELS: Record<MockArquivo['categoria'], string> = {
    intimacao: 'Intimação',
    decisao: 'Decisão',
    peca: 'Peça',
    anexo: 'Anexo',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-end justify-between pb-3 border-b border-border/20">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
            Arquivos vinculados
          </p>
          <p className="font-heading text-xl font-bold text-foreground mt-1 tabular-nums">
            {arquivos.length.toString().padStart(2, '0')}{' '}
            <span className="text-muted-foreground/50 font-normal">documentos</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full h-8 px-3 text-xs gap-1.5">
          <Plus className="size-3" />
          Adicionar
        </Button>
      </div>

      <ul className="divide-y divide-border/15">
        {arquivos.map((arq, idx) => (
          <li key={arq.id}>
            <button
              type="button"
              className="w-full group flex items-center gap-5 py-5 text-left transition-colors hover:bg-muted/20 rounded-xl px-3 -mx-3"
            >
              <span className="font-mono text-[10px] font-semibold text-muted-foreground/40 tabular-nums w-6">
                {(idx + 1).toString().padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
                    {CATEGORIA_LABELS[arq.categoria]}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/40">
                    · {arq.tipo}
                  </span>
                </div>
                <p className="font-headline text-[15px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {arq.nome}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/55 mt-0.5">
                  {formatSize(arq.tamanhoBytes)} · {format(parseISO(arq.criadoEm), 'dd MMM yyyy', { locale: ptBR })}
                </p>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// TAB · HISTÓRICO — timeline editorial minimal
// ============================================================================

function HistoricoTab({
  historico,
  usuarios,
}: {
  historico: MockHistoricoEvento[];
  usuarios: MockUsuario[];
}) {
  const getUsuario = (id: number | null) =>
    id ? usuarios.find((u) => u.id === id) : null;

  const eventStyle: Record<MockHistoricoEvento['tipo'], { dot: string; tag: string }> = {
    criacao: { dot: 'bg-primary', tag: 'CRIAÇÃO' },
    atribuicao_responsavel: { dot: 'bg-info', tag: 'ATRIBUIÇÃO' },
    alteracao_tipo: { dot: 'bg-warning', tag: 'TIPO' },
    alteracao_descricao: { dot: 'bg-warning', tag: 'DESCRIÇÃO' },
    alteracao_observacoes: { dot: 'bg-warning', tag: 'OBSERVAÇÕES' },
    baixa: { dot: 'bg-success', tag: 'BAIXA' },
    reversao_baixa: { dot: 'bg-destructive', tag: 'REVERSÃO' },
    visualizacao: { dot: 'bg-muted-foreground/40', tag: 'VISTO' },
  };

  return (
    <ol className="relative">
      <span
        aria-hidden="true"
        className="absolute left-[5px] top-2 bottom-2 w-px bg-linear-to-b from-border/10 via-border/30 to-border/10"
      />
      {[...historico].reverse().map((evt, idx) => {
        const meta = eventStyle[evt.tipo];
        const autor = getUsuario(evt.autorId);
        return (
          <li
            key={evt.id}
            className="relative pl-10 py-5"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <span
              className={cn(
                'absolute left-[1px] top-[1.65rem] size-[11px] rounded-full ring-4 ring-background',
                meta.dot,
              )}
            />
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
                {meta.tag}
              </span>
              <span className="h-px flex-1 bg-border/20 max-w-16" />
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
                {format(parseISO(evt.data), "dd MMM · HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="font-headline text-[15px] text-foreground/90 leading-relaxed">
              {evt.descricao}
            </p>
            {autor && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="size-4">
                  <AvatarImage src={autor.avatarUrl || undefined} />
                  <AvatarFallback className="text-[7px]">
                    {autor.nomeExibicao.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  por {autor.nomeExibicao}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================================
// BUILDING BLOCKS
// ============================================================================

function EditorialBlock({
  overline,
  title,
  hint,
  accent,
  children,
}: {
  overline: string;
  title: string;
  hint?: string | null;
  accent?: 'primary' | 'secondary';
  children: React.ReactNode;
}) {
  return (
    <section className="group">
      <header className="flex items-end justify-between gap-4 pb-4 mb-5 border-b border-border/20">
        <div className="flex items-baseline gap-4 min-w-0">
          <span
            className={cn(
              'font-mono text-[10px] font-semibold uppercase tracking-[0.22em] shrink-0',
              accent === 'primary'
                ? 'text-primary'
                : 'text-muted-foreground/50',
            )}
          >
            {overline}
          </span>
          <h3 className="font-heading font-bold text-xl md:text-2xl tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        {hint && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 shrink-0">
            <Pencil className="size-2.5" />
            {hint}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function StatusChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: 'success' | 'warning' | 'destructive' | 'primary';
}) {
  const tones = {
    success: 'bg-success/10 text-success ring-success/20',
    warning: 'bg-warning/10 text-warning ring-warning/20',
    destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
    primary: 'bg-primary/10 text-primary ring-primary/20',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
        'font-mono text-[10px] font-semibold uppercase tracking-wider',
        'ring-1 ring-inset',
        tones[tone],
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50">
        {label}
      </span>
      <span className="font-mono text-[13px] font-medium text-foreground/85 tabular-nums">
        {value}
      </span>
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/55 mb-1.5">
      {children}
    </p>
  );
}

function StatField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <FieldLabel>{label}</FieldLabel>
      <p className="font-headline text-[15px] font-medium text-foreground/90 wrap-break-word">
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// SIDEBAR — ritmo contrastante, denso, tipograficamente cuidadoso
// ============================================================================

function ResponsavelCard({
  expedienteId,
  responsavelId,
  usuarios,
}: {
  expedienteId: number;
  responsavelId: number | null | undefined;
  usuarios: MockUsuario[];
}) {
  const usuario = responsavelId ? usuarios.find((u) => u.id === responsavelId) : null;
  const initials =
    usuario?.nomeExibicao
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '??';

  return (
    <GlassPanel depth={3} className="p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-primary">
          Responsável
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/40">
          reatribuir ↗
        </span>
      </div>
      <ExpedienteResponsavelPopover
        expedienteId={expedienteId}
        responsavelId={responsavelId}
        usuarios={usuarios}
        onSuccess={() => toast.success('Responsável atualizado.')}
        align="start"
      >
        {usuario ? (
          <div className="flex items-center gap-3 w-full text-left">
            <Avatar className="size-12 ring-2 ring-primary/20">
              <AvatarImage src={usuario.avatarUrl || undefined} alt={usuario.nomeExibicao} />
              <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold text-foreground truncate leading-tight">
                {usuario.nomeExibicao}
              </p>
              {usuario.cargo && (
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                  {usuario.cargo}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full text-left py-1">
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center ring-2 ring-dashed ring-border/40">
              <User className="size-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-heading font-bold text-warning/80 italic leading-tight">
                Sem responsável
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 mt-0.5">
                clique para atribuir
              </p>
            </div>
          </div>
        )}
      </ExpedienteResponsavelPopover>
    </GlassPanel>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/55 mb-3">
        {label}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function CronologiaRow({
  label,
  value,
  emphasis,
  muted,
  mono,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[12px] text-muted-foreground/65 shrink-0">{label}</span>
      <span
        className={cn(
          'text-right tabular-nums leading-tight',
          mono ? 'font-mono' : 'font-headline',
          emphasis
            ? 'font-bold text-foreground text-[13px]'
            : muted
              ? 'text-[11px] text-muted-foreground/60'
              : 'text-[12.5px] text-foreground/80',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function FlagChip({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
        active
          ? 'bg-primary/6 ring-1 ring-inset ring-primary/15 text-foreground'
          : 'bg-transparent ring-1 ring-inset ring-border/20 text-muted-foreground/45',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-3" />
        <span className="text-[12px]">{label}</span>
      </div>
      <span
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-primary' : 'bg-muted-foreground/20',
        )}
      />
    </div>
  );
}

// ============================================================================
// INLINE TIPO EDITOR
// ============================================================================

function InlineTipoEditor({
  current,
  options,
  onSave,
}: {
  current: MockTipoExpediente | null;
  options: MockTipoExpediente[];
  onSave: (id: number | null) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const handleSelect = async (id: number | null) => {
    if (id === (current?.id ?? null)) {
      setOpen(false);
      return;
    }
    setIsPending(true);
    setOpen(false);
    try {
      await onSave(id);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'group inline-flex items-center gap-2 py-1 rounded-lg',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {current ? (
            <span className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors underline decoration-dotted decoration-primary/40 underline-offset-4">
              {current.tipo_expediente}
            </span>
          ) : (
            <span className="font-heading italic text-lg text-muted-foreground/60 group-hover:text-foreground transition-colors">
              Clique para atribuir tipo
            </span>
          )}
          <Tag className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 rounded-2xl glass-dropdown overflow-hidden" align="start">
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="font-mono text-[9px] font-medium text-muted-foreground/50 uppercase tracking-[0.2em] mb-2">
              Escolher tipo
            </p>
            <CommandInput placeholder="Buscar tipo…" className="h-8 text-xs rounded-lg" />
          </div>
          <CommandList className="max-h-64 px-1.5 pb-1.5">
            <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-tipo"
                onSelect={() => handleSelect(null)}
                className="gap-2 rounded-lg text-xs px-2 py-2"
              >
                <span className="italic text-muted-foreground/60 font-headline">Sem tipo</span>
              </CommandItem>
              {options.map((tipo) => (
                <CommandItem
                  key={tipo.id}
                  value={tipo.tipo_expediente}
                  onSelect={() => handleSelect(tipo.id)}
                  className="gap-2 rounded-lg text-xs px-2 py-2"
                >
                  <span className="font-headline text-[13px] font-medium">
                    {tipo.tipo_expediente}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
