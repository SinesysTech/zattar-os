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
import { Heading, Text } from '@/components/ui/typography';
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
  ExpedienteDetalheBundle,
  DetalheArquivo,
  DetalheHistoricoEvento,
  DetalheTipo,
  DetalheUsuario,
} from './types';

interface ExpedienteDetalhesClientProps {
  bundle: ExpedienteDetalheBundle;
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
    <div className={cn("relative flex flex-col inline-extra-loose pb-12")}>
      <AmbientBackdrop blurIntensity={18} grid baseGradient />

      <div className={cn("relative z-10 flex flex-col inline-extra-loose")}>
        {/* ============================= BREADCRUMB ============================ */}
        <div className={cn("flex items-center justify-between inline-default flex-wrap")}>
          <Text
            variant="micro-caption"
            as="div"
            className={cn("flex items-center inline-tight uppercase tracking-[0.18em] text-muted-foreground/60")}
          >
            <Link
              href="/expedientes"
              className={cn("inline-flex items-center inline-snug hover:text-foreground transition-colors")}
            >
              <ArrowLeft className="size-3" />
              Expedientes
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/65" />
            <span className="text-foreground/80 tabular-nums">
              #{expedienteId.toString().padStart(6, '0')}
            </span>
          </Text>
          <div className={cn("flex items-center inline-snug")}>
            <Button variant="outline" size="sm" className={cn("rounded-full h-8 px-3 text-caption inline-snug")}>
              <Download className="size-3" />
              PDF
            </Button>
            <Button size="sm" className={cn("rounded-full h-8 px-3 text-caption inline-snug")}>
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
  style,
  tipoLabel,
  onCopyProcesso,
}: {
  expediente: Expediente;
  partyNames: { autora: string | null; re: string | null };
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
          /* design-system-escape: p-8 → usar <Inset>; md:p-10 sem equivalente DS; lg:p-12 sem equivalente DS */ 'relative overflow-hidden p-8 md:p-10 lg:p-12 rounded-4xl',
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

        <div className={cn(/* design-system-escape: lg:gap-10 sem equivalente DS */ "relative grid grid-cols-1 lg:grid-cols-[auto_1px_1fr] inline-extra-loose lg:gap-10")}>
          {/* Countdown editorial */}
          <div className={cn("flex flex-col inline-medium")}>
            <Text
              variant="overline"
              className={cn('tracking-[0.22em]', style.accent)}
            >
              {style.label}
            </Text>
            <div className={cn("flex items-baseline inline-medium")}>
              <span
                className={cn(
                  'font-black leading-[0.85] tracking-tighter tabular-nums',
                  'text-[7rem] md:text-[8.5rem] lg:text-[9.5rem]',
                  style.accent,
                )}
              >
                {heroNumber}
              </span>
              <Text
                variant="overline"
                className={cn("tracking-[0.2em] text-foreground/75 self-end pb-4")}
              >
                {heroUnit}
              </Text>
            </div>
            {prazoFormatted && (
              <Text
                variant="micro-caption"
                as="div"
                className={cn("flex items-center inline-tight uppercase tracking-wider text-muted-foreground/70")}
              >
                <Clock className="size-3" />
                <span>{prazoFormatted}</span>
              </Text>
            )}
          </div>

          {/* Divisor vertical */}
          <div
            aria-hidden="true"
            className="hidden lg:block w-px bg-linear-to-b from-transparent via-border/40 to-transparent"
          />

          {/* Partes editoriais */}
          <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex flex-col gap-5 min-w-0")}>
            <div className={cn("flex items-center inline-tight flex-wrap")}>
              {tipoLabel && (
                <Text
                  variant="micro-badge"
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 uppercase tracking-wider',
                    'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
                  )}
                >
                  {tipoLabel}
                </Text>
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

            <div className={cn("stack-snug")}>
              <Heading
                level="page"
                className={cn(/* design-system-escape: tracking-tight sem token DS; text-3xl → migrar para <Heading level="display-*"> */ /* design-system-escape: tracking-tight sem token DS; text-3xl → migrar para <Heading level="display-*"> */ "font-black tracking-tight text-foreground leading-[1.05] text-3xl md:text-4xl lg:text-[2.75rem]")}
              >
                {partyNames.autora || 'Parte autora ausente'}
              </Heading>
              <div className={cn("flex items-center inline-medium py-0.5")}>
                <Text
                  variant="micro-caption"
                  className="uppercase tracking-[0.3em] text-muted-foreground/70"
                >
                  versus
                </Text>
                <span className="h-px flex-1 bg-border/30" />
              </div>
              <Heading
                level="section"
                className={cn(/* design-system-escape: tracking-tight sem token DS; text-2xl → migrar para <Heading level="...">; md:text-3xl sem equivalente DS */ "font-bold tracking-tight text-foreground/80 leading-[1.1] text-2xl md:text-3xl lg:text-[2.25rem]")}
              >
                {partyNames.re || 'Parte ré ausente'}
              </Heading>
            </div>

            <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 pt-1")}>
              <MetaPill label="Tribunal" value={expediente.trt} />
              <MetaPill
                label="Grau"
                value={GRAU_TRIBUNAL_LABELS[expediente.grau]}
              />
              <button
                type="button"
                onClick={onCopyProcesso}
                className={cn("group inline-flex items-center inline-tight")}
                title="Copiar número do processo"
              >
                <Text
                  variant="micro-badge"
                  className="uppercase tracking-[0.22em] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors"
                >
                  Processo
                </Text>
                <span className={cn( "font-mono text-[13px] font-medium text-foreground/85 tabular-nums group-hover:text-foreground transition-colors")}>
                  {expediente.numeroProcesso}
                </span>
                <Copy className="size-3 text-muted-foreground/55 group-hover:text-foreground/75 transition-colors" />
              </button>
            </div>

            {(expediente.classeJudicial || expediente.descricaoOrgaoJulgador) && (
              <Text
                variant="micro-caption"
                as="div"
                className={cn("text-muted-foreground/70 stack-nano pt-1")}
              >
                {expediente.classeJudicial && (
                  <div>{expediente.classeJudicial}</div>
                )}
                {expediente.descricaoOrgaoJulgador && (
                  <div>{expediente.descricaoOrgaoJulgador}</div>
                )}
              </Text>
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
      <div className={cn("flex inline-extra-loose overflow-x-auto -mb-px")}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative pb-3 pt-1 transition-colors whitespace-nowrap',
                /* design-system-escape: tracking-tight sem token DS */ 'font-heading text-body-sm font-semibold tracking-tight',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground/70 hover:text-muted-foreground',
              )}
            >
              <span className={cn("inline-flex items-center inline-tight")}>
                {tab.label}
                {tab.count !== undefined && (
                  <Text
                    variant="micro-caption"
                    className={cn(
                      'tabular-nums rounded-full px-1.5 py-0.5',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'bg-muted/40 text-muted-foreground/60',
                    )}
                  >
                    {tab.count}
                  </Text>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
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
  usuarios: DetalheUsuario[];
  tiposExpedientes: DetalheTipo[];
  tipoAtual: DetalheTipo | null;
  onSaveDescricao: (novo: string) => Promise<void>;
  onSaveObservacoes: (novo: string) => Promise<void>;
  onSaveTipo: (id: number | null) => Promise<void>;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-10 gap sem token DS; lg:gap-14 sem equivalente DS */ "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-14")}>
      {/* ========================== MAIN EDITORIAL ========================== */}
      <div className={cn(/* design-system-escape: space-y-12 sem token DS */ "space-y-12")}>
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
          <Text
            variant="overline"
            as="p"
            className="tracking-[0.2em] text-muted-foreground/70 mb-3"
          >
            Texto oficial publicado no PJE
          </Text>
          <div className={cn("relative pl-6 border-l-2 border-primary/30")}>
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
          <Text
            variant="overline"
            as="p"
            className="tracking-[0.2em] text-muted-foreground/70 mb-3"
          >
            Resumo interno, estratégia, pontos de atenção
          </Text>
          <div className={cn("relative pl-6 border-l-2 border-foreground/15")}>
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
      <aside className={cn("stack-loose lg:sticky lg:top-6 lg:self-start")}>
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

function ArquivosTab({ arquivos }: { arquivos: DetalheArquivo[] }) {
  if (arquivos.length === 0) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 text-center rounded-2xl")}>
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

  const CATEGORIA_LABELS: Record<DetalheArquivo['categoria'], string> = {
    intimacao: 'Intimação',
    decisao: 'Decisão',
    peca: 'Peça',
    anexo: 'Anexo',
  };

  return (
    <div className={cn("stack-micro")}>
      <div className={cn("flex items-end justify-between pb-3 border-b border-border/20")}>
        <div>
          <Text
            variant="overline"
            as="p"
            className="tracking-[0.22em] text-muted-foreground/60"
          >
            Arquivos vinculados
          </Text>
          <Heading
            level="card"
            as="h3"
            className={cn( "font-bold text-foreground mt-1 tabular-nums")}
          >
            {arquivos.length.toString().padStart(2, '0')}{' '}
            <span className="text-muted-foreground/70 font-normal">documentos</span>
          </Heading>
        </div>
        <Button variant="outline" size="sm" className={cn("rounded-full h-8 px-3 text-caption inline-snug")}>
          <Plus className="size-3" />
          Adicionar
        </Button>
      </div>

      <ul className="divide-y divide-border/15">
        {arquivos.map((arq, idx) => (
          <li key={arq.id}>
            <button
              type="button"
              className={cn(/* design-system-escape: gap-5 gap sem token DS; py-5 padding direcional sem Inset equiv.; px-3 padding direcional sem Inset equiv.; -mx-3 sem equivalente DS */ "w-full group flex items-center gap-5 py-5 text-left transition-colors hover:bg-muted/20 rounded-xl px-3 -mx-3")}
            >
              <Text
                variant="micro-caption"
                className={cn( "font-semibold text-muted-foreground/65 tabular-nums w-6")}
              >
                {(idx + 1).toString().padStart(2, '0')}
              </Text>
              <div className="flex-1 min-w-0">
                <div className={cn("flex items-center inline-tight mb-1")}>
                  <Text
                    variant="micro-badge"
                    className="uppercase tracking-[0.2em] text-primary"
                  >
                    {CATEGORIA_LABELS[arq.categoria]}
                  </Text>
                  <Text
                    variant="micro-badge"
                    className={cn("uppercase tracking-wider text-muted-foreground/65")}
                  >
                    · {arq.tipo}
                  </Text>
                </div>
                <p className={cn( "font-headline text-[15px] font-medium text-foreground truncate group-hover:text-primary transition-colors")}>
                  {arq.nome}
                </p>
                <Text
                  variant="micro-caption"
                  as="p"
                  className="text-muted-foreground/55 mt-0.5"
                >
                  {formatSize(arq.tamanhoBytes)} · {format(parseISO(arq.criadoEm), 'dd MMM yyyy', { locale: ptBR })}
                </Text>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground/65 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
  historico: DetalheHistoricoEvento[];
  usuarios: DetalheUsuario[];
}) {
  const getUsuario = (id: number | null) =>
    id ? usuarios.find((u) => u.id === id) : null;

  const eventStyle: Record<DetalheHistoricoEvento['tipo'], { dot: string; tag: string }> = {
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
        className="absolute left-1.25 top-2 bottom-2 w-px bg-linear-to-b from-border/10 via-border/30 to-border/10"
      />
      {[...historico].reverse().map((evt, idx) => {
        const meta = eventStyle[evt.tipo];
        const autor = getUsuario(evt.autorId);
        return (
          <li
            key={evt.id}
            className={cn("relative pl-10 py-5")}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <span
              className={cn(
                'absolute left-px top-[1.65rem] size-2.75 rounded-full ring-4 ring-background',
                meta.dot,
              )}
            />
            <div className={cn("flex items-center inline-medium mb-1")}>
              <Text
                variant="micro-badge"
                className="uppercase tracking-[0.22em] text-muted-foreground/60"
              >
                {meta.tag}
              </Text>
              <span className="h-px flex-1 bg-border/20 max-w-16" />
              <Text
                variant="micro-caption"
                className="tabular-nums text-muted-foreground/70"
              >
                {format(parseISO(evt.data), "dd MMM · HH:mm", { locale: ptBR })}
              </Text>
            </div>
            <p className={cn("font-headline text-[15px] text-foreground/90 leading-relaxed")}>
              {evt.descricao}
            </p>
            {autor && (
              <div className={cn("flex items-center inline-tight mt-2")}>
                <Avatar className="size-4">
                  <AvatarImage src={autor.avatarUrl || undefined} />
                  <AvatarFallback className="text-[7px]">
                    {autor.nomeExibicao.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Text
                  variant="micro-caption"
                  className="text-muted-foreground/60"
                >
                  por {autor.nomeExibicao}
                </Text>
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
      <header className={cn("flex items-end justify-between inline-default pb-4 mb-5 border-b border-border/20")}>
        <div className={cn("flex items-baseline inline-default min-w-0")}>
          <Text
            variant="overline"
            className={cn(
              'tracking-[0.22em] shrink-0',
              accent === 'primary' ? 'text-primary' : 'text-muted-foreground/70',
            )}
          >
            {overline}
          </Text>
          <Heading
            level="card"
            as="h3"
            className={cn(/* design-system-escape: text-xl → migrar para <Heading level="...">; md:text-2xl sem equivalente DS; tracking-tight sem token DS */ "font-bold text-xl md:text-2xl tracking-tight text-foreground")}
          >
            {title}
          </Heading>
        </div>
        {hint && (
          <Text
            variant="micro-badge"
            className={cn("inline-flex items-center inline-snug uppercase tracking-wider text-muted-foreground/70 shrink-0")}
          >
            <Pencil className="size-2.5" />
            {hint}
          </Text>
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
    <Text
      variant="micro-badge"
      className={cn(
        'inline-flex items-center inline-micro rounded-full px-2.5 py-1',
        /* design-system-escape: tracking-wider sem token DS */ 'font-semibold uppercase tracking-wider',
        'ring-1 ring-inset',
        tones[tone],
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </Text>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className={cn("inline-flex items-center inline-tight")}>
      <Text
        variant="micro-badge"
        className="uppercase tracking-[0.22em] text-muted-foreground/70"
      >
        {label}
      </Text>
      <Text
        variant="caption"
        as="span"
        className={cn( "font-medium text-foreground/85 tabular-nums")}
      >
        {value}
      </Text>
    </span>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      variant="micro-badge"
      as="p"
      className={cn( "font-semibold uppercase tracking-[0.22em] text-muted-foreground/55 mb-1.5")}
    >
      {children}
    </Text>
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
      <p className={cn( "font-headline text-[15px] font-medium text-foreground/90 wrap-break-word")}>
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
  usuarios: DetalheUsuario[];
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
    <GlassPanel depth={3} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5 rounded-2xl")}>
      <div className="flex items-center justify-between mb-4">
        <Text
          variant="overline"
          className="tracking-[0.24em] text-primary"
        >
          Responsável
        </Text>
        <Text
          variant="micro-badge"
          className={cn("uppercase tracking-wider text-muted-foreground/65")}
        >
          reatribuir ↗
        </Text>
      </div>
      <ExpedienteResponsavelPopover
        expedienteId={expedienteId}
        responsavelId={responsavelId}
        usuarios={usuarios}
        onSuccess={() => toast.success('Responsável atualizado.')}
        align="start"
      >
        {usuario ? (
          <div className={cn("flex items-center inline-medium w-full text-left")}>
            <Avatar className="size-12 ring-2 ring-primary/20">
              <AvatarImage src={usuario.avatarUrl || undefined} alt={usuario.nomeExibicao} />
              <AvatarFallback className={cn( "text-body-sm font-semibold bg-primary/10 text-primary")}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className={cn(/* design-system-escape: leading-tight sem token DS */ "font-heading font-bold text-foreground truncate leading-tight")}>
                {usuario.nomeExibicao}
              </p>
              {usuario.cargo && (
                <Text
                  variant="micro-caption"
                  as="p"
                  className={cn("uppercase tracking-wider text-muted-foreground/60 mt-0.5")}
                >
                  {usuario.cargo}
                </Text>
              )}
            </div>
          </div>
        ) : (
          <div className={cn("flex items-center inline-medium w-full text-left py-1")}>
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center ring-2 ring-dashed ring-border/40">
              <User className="size-5 text-muted-foreground/65" />
            </div>
            <div>
              <p className={cn(/* design-system-escape: leading-tight sem token DS */ "font-heading font-bold text-warning/80 italic leading-tight")}>
                Sem responsável
              </p>
              <Text
                variant="micro-caption"
                as="p"
                className={cn("uppercase tracking-wider text-muted-foreground/70 mt-0.5")}
              >
                clique para atribuir
              </Text>
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
      <Heading
        level="subsection"
        className="text-meta-label tracking-[0.24em] text-muted-foreground/70 mb-3"
      >
        {label}
      </Heading>
      <div className={cn("stack-snug")}>{children}</div>
    </section>
  );
}

function CronologiaRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between inline-medium py-1")}>
      <Text variant="caption" as="span" className="text-muted-foreground/65 shrink-0">
        {label}
      </Text>
      <Text
        variant={emphasis ? 'caption' : muted ? 'micro-caption' : 'caption'}
        as="span"
        className={cn(
          'text-right tabular-nums leading-tight font-headline',
          emphasis
            ?  'font-bold text-foreground'
            : muted
              ? 'text-muted-foreground/60'
              : 'text-foreground/80',
        )}
      >
        {value}
      </Text>
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
        'flex items-center justify-between inline-tight px-3 py-2 rounded-lg',
        active
          ? 'bg-primary/6 ring-1 ring-inset ring-primary/15 text-foreground'
          : 'bg-transparent ring-1 ring-inset ring-border/20 text-muted-foreground/45',
      )}
    >
      <div className={cn("flex items-center inline-tight")}>
        <Icon className="size-3" />
        <Text variant="caption" as="span">{label}</Text>
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
  current: DetalheTipo | null;
  options: DetalheTipo[];
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
            'group inline-flex items-center inline-tight py-1 rounded-lg',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {current ? (
            <span className={cn( "font-heading font-semibold text-body-lg text-foreground group-hover:text-primary transition-colors underline decoration-dotted decoration-primary/40 underline-offset-4")}>
              {current.tipo_expediente}
            </span>
          ) : (
            <span className={cn("font-heading italic text-body-lg text-muted-foreground/60 group-hover:text-foreground transition-colors")}>
              Clique para atribuir tipo
            </span>
          )}
          <Tag className="size-3 text-muted-foreground/65 group-hover:text-primary transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-72 p-0 rounded-2xl glass-dropdown overflow-hidden")} align="start">
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <Text
              variant="micro-badge"
              as="p"
              className={cn( "font-medium text-muted-foreground/70 uppercase tracking-[0.2em] mb-2")}
            >
              Escolher tipo
            </Text>
            <CommandInput placeholder="Buscar tipo…" className={cn("h-8 text-caption rounded-lg")} />
          </div>
          <CommandList className={cn("max-h-64 px-1.5 pb-1.5")}>
            <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-tipo"
                onSelect={() => handleSelect(null)}
                className={cn("inline-tight rounded-lg text-caption px-2 py-2")}
              >
                <span className="italic text-muted-foreground/60 font-headline">Sem tipo</span>
              </CommandItem>
              {options.map((tipo) => (
                <CommandItem
                  key={tipo.id}
                  value={tipo.tipo_expediente}
                  onSelect={() => handleSelect(tipo.id)}
                  className={cn("inline-tight rounded-lg text-caption px-2 py-2")}
                >
                  <span className={cn( "font-headline text-[13px] font-medium")}>
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
