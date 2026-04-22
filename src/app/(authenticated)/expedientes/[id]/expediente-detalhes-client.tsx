'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, formatDistanceToNowStrict, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Flag,
  History,
  Lock,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldAlert,
  Tag,
  User,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { TabPills } from '@/components/dashboard/tab-pills';
import { Heading, Text } from '@/components/ui/typography';
import { SemanticBadge } from '@/components/ui/semantic-badge';
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
import {
  ExpedienteResponsavelPopover,
} from '@/app/(authenticated)/expedientes/components/expediente-responsavel-popover';

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

const URGENCY_TONE = {
  critico: { label: 'Vencido', dot: 'bg-destructive', text: 'text-destructive' },
  alto: { label: 'Vence hoje', dot: 'bg-warning', text: 'text-warning' },
  medio: { label: 'Próximos dias', dot: 'bg-info', text: 'text-info' },
  baixo: { label: 'No prazo', dot: 'bg-success', text: 'text-success' },
  ok: { label: 'Sem prazo', dot: 'bg-muted-foreground/40', text: 'text-muted-foreground/70' },
} as const;

export function ExpedienteDetalhesClient({
  bundle,
  expedienteId,
}: ExpedienteDetalhesClientProps) {
  const [expediente, setExpediente] = React.useState<Expediente>(bundle.expediente);
  const [activeTab, setActiveTab] = React.useState<TabId>('dados');

  const { usuarios, tiposExpedientes, arquivos, historico } = bundle;

  const partyNames = getExpedientePartyNames(expediente);
  const tituloPartes =
    partyNames.autora && partyNames.re
      ? `${partyNames.autora} × ${partyNames.re}`
      : partyNames.autora || partyNames.re || `Expediente #${expediente.id}`;

  const tipoAtual = React.useMemo(
    () => tiposExpedientes.find((t) => t.id === expediente.tipoExpedienteId) ?? null,
    [tiposExpedientes, expediente.tipoExpedienteId],
  );
  const urgency = getExpedienteUrgencyLevel(expediente);

  const tabs = [
    { id: 'dados' as TabId, label: 'Dados' },
    { id: 'arquivos' as TabId, label: 'Arquivos', count: arquivos.length },
    { id: 'historico' as TabId, label: 'Histórico', count: historico.length },
  ];

  const simulateSave = React.useCallback(async (label: string, mutator: () => void) => {
    await new Promise((r) => setTimeout(r, 450));
    mutator();
    toast.success(`${label} atualizado.`);
  }, []);

  const handleSaveDescricao = async (novo: string) => {
    await simulateSave('Descrição', () =>
      setExpediente((prev) => ({
        ...prev,
        descricaoArquivos: novo,
        updatedAt: new Date().toISOString(),
      })),
    );
  };

  const handleSaveObservacoes = async (novo: string) => {
    await simulateSave('Observações', () =>
      setExpediente((prev) => ({
        ...prev,
        observacoes: novo,
        updatedAt: new Date().toISOString(),
      })),
    );
  };

  const handleSaveTipo = async (tipoId: number | null) => {
    await simulateSave('Tipo', () =>
      setExpediente((prev) => ({ ...prev, tipoExpedienteId: tipoId })),
    );
  };

  const handleCopyProcesso = () => {
    navigator.clipboard.writeText(expediente.numeroProcesso);
    toast.success('Número do processo copiado.');
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <ExpedienteHeader
        expediente={expediente}
        tituloPartes={tituloPartes}
        tipoLabel={tipoAtual?.tipo_expediente ?? null}
        onCopyProcesso={handleCopyProcesso}
        expedienteId={expedienteId}
      />

      <PulseStrip expediente={expediente} urgency={urgency} />

      <TabPills
        tabs={tabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
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
  );
}

function ExpedienteHeader({
  expediente,
  tituloPartes,
  tipoLabel,
  onCopyProcesso,
  expedienteId,
}: {
  expediente: Expediente;
  tituloPartes: string;
  tipoLabel: string | null;
  onCopyProcesso: () => void;
  expedienteId: number;
}) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau];
  const origemLabel = ORIGEM_EXPEDIENTE_LABELS[expediente.origem];
  const isBaixado = Boolean(expediente.baixadoEm);

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar"
          asChild
          className="mt-0.5 shrink-0"
        >
          <Link href="/expedientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Heading level="page" className="min-w-0 truncate">
              {tituloPartes}
            </Heading>
            {tipoLabel && (
              <SemanticBadge
                category="expediente_tipo"
                value={expediente.tipoExpedienteId}
                className="text-[10px]"
              >
                {tipoLabel}
              </SemanticBadge>
            )}
            {isBaixado ? (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-success/10 text-success border-success/25">
                <CheckCircle2 className="w-2.5 h-2.5" /> Baixado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-warning/10 text-warning border-warning/25">
                <Clock className="w-2.5 h-2.5" /> Em andamento
              </span>
            )}
            <SemanticBadge category="captura_status" value={expediente.origem} className="text-[10px]">
              {origemLabel}
            </SemanticBadge>
            {expediente.prioridadeProcessual && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border bg-destructive/10 text-destructive border-destructive/25">
                <Flag className="w-2.5 h-2.5" /> Prioridade
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <SemanticBadge category="tribunal" value={expediente.trt} className="text-[10px]">
              {expediente.trt}
            </SemanticBadge>
            <SemanticBadge category="grau" value={expediente.grau} className="text-[10px]">
              {grauLabel}
            </SemanticBadge>
            <button
              type="button"
              onClick={onCopyProcesso}
              className="inline-flex items-center gap-1 font-medium text-foreground/85 tabular-nums hover:text-foreground transition-colors group"
              title="Copiar número do processo"
            >
              {expediente.numeroProcesso}
              <Copy className="w-3 h-3 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
            </button>
            {expediente.classeJudicial && (
              <Text variant="caption" className="text-muted-foreground">
                {expediente.classeJudicial}
              </Text>
            )}
            {expediente.descricaoOrgaoJulgador && (
              <Text
                variant="caption"
                className="text-muted-foreground truncate max-w-[20rem]"
              >
                {expediente.descricaoOrgaoJulgador}
              </Text>
            )}
            <Text variant="meta-label" className="text-muted-foreground/70">
              #{expedienteId}
            </Text>
          </div>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" className="rounded-xl">
          <Download className="size-3.5 mr-1" />
          Baixar PDF
        </Button>
        <Button size="sm" className="rounded-xl">
          <Edit className="size-3.5 mr-1" />
          Editar
        </Button>
        <Button variant="ghost" size="icon" className="rounded-xl">
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function PulseStrip({
  expediente,
  urgency,
}: {
  expediente: Expediente;
  urgency: ReturnType<typeof getExpedienteUrgencyLevel>;
}) {
  const tone = URGENCY_TONE[urgency];
  const prazo = expediente.dataPrazoLegalParte;
  const diasAteVenc = prazo
    ? differenceInDays(parseISO(prazo), new Date())
    : null;

  const items = [
    {
      label: 'Prazo',
      value:
        diasAteVenc === null
          ? 'Sem prazo'
          : diasAteVenc < 0
            ? `${Math.abs(diasAteVenc)}d vencido`
            : diasAteVenc === 0
              ? 'Hoje'
              : `em ${diasAteVenc}d`,
      sub: prazo ? format(parseISO(prazo), 'dd MMM yyyy', { locale: ptBR }) : '—',
      dot: tone.dot,
      emphasis: tone.text,
    },
    {
      label: 'Ciência',
      value: expediente.dataCienciaParte
        ? format(parseISO(expediente.dataCienciaParte), 'dd MMM yyyy', { locale: ptBR })
        : '—',
      sub: expediente.dataCienciaParte
        ? formatDistanceToNowStrict(parseISO(expediente.dataCienciaParte), {
            locale: ptBR,
            addSuffix: true,
          })
        : 'Sem ciência registrada',
    },
    {
      label: 'Criado',
      value: expediente.dataCriacaoExpediente
        ? format(parseISO(expediente.dataCriacaoExpediente), 'dd MMM yyyy', { locale: ptBR })
        : format(parseISO(expediente.createdAt), 'dd MMM yyyy', { locale: ptBR }),
      sub: formatDistanceToNowStrict(
        parseISO(expediente.dataCriacaoExpediente ?? expediente.createdAt),
        { locale: ptBR, addSuffix: true },
      ),
    },
    {
      label: 'Origem',
      value: ORIGEM_EXPEDIENTE_LABELS[expediente.origem],
      sub: expediente.idPje ? `PJE · ${expediente.idPje}` : 'Captura manual',
    },
    {
      label: 'Atualizado',
      value: format(parseISO(expediente.updatedAt), 'dd MMM yyyy', { locale: ptBR }),
      sub: formatDistanceToNowStrict(parseISO(expediente.updatedAt), {
        locale: ptBR,
        addSuffix: true,
      }),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {items.map((item, idx) => (
        <GlassPanel key={idx} depth={2} className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            {item.dot && <span className={cn('size-1.5 rounded-full', item.dot)} />}
            <Text variant="overline" className="text-muted-foreground/60">
              {item.label}
            </Text>
          </div>
          <Text
            variant="kpi-value"
            className={cn('text-base tabular-nums', item.emphasis)}
          >
            {item.value}
          </Text>
          <Text variant="meta-label" className="mt-0.5">
            {item.sub}
          </Text>
        </GlassPanel>
      ))}
    </div>
  );
}

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <GlassPanel depth={1} className="p-5">
          <SectionTitle icon={Tag}>Classificação</SectionTitle>
          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 space-y-1">
              <Text variant="label">Tipo do expediente</Text>
              <InlineTipoEditor
                current={tipoAtual}
                options={tiposExpedientes}
                onSave={onSaveTipo}
              />
            </div>
            <div className="min-w-0 space-y-1">
              <Text variant="label">Classe judicial</Text>
              <Text variant="caption" className="font-medium text-foreground/85">
                {expediente.classeJudicial || '—'}
              </Text>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle icon={FileText} action={<EditHint />}>
            Descrição / Intimação
          </SectionTitle>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 mb-3">
            Texto oficial da intimação ou descrição dos arquivos capturados.
          </p>
          <EditableTextCell
            value={expediente.descricaoArquivos}
            onSave={onSaveDescricao}
            title="Editar descrição / intimação"
            placeholder="Descrição oficial da intimação, despacho ou decisão…"
            emptyPlaceholder="Clique para adicionar descrição"
            triggerClassName="min-h-24 w-full"
            className="text-sm leading-relaxed max-h-none"
          />
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle icon={Pencil} action={<EditHint />}>
            Observações / Resumo interno
          </SectionTitle>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 mb-3">
            Anotações internas, resumo de estratégia, pontos de atenção.
          </p>
          <EditableTextCell
            value={expediente.observacoes}
            onSave={onSaveObservacoes}
            title="Editar observações"
            placeholder="Resumo interno, estratégia, pontos de atenção…"
            emptyPlaceholder="Clique para adicionar observações"
            triggerClassName="min-h-20 w-full"
            className="text-sm leading-relaxed max-h-none"
          />
        </GlassPanel>

        {expediente.baixadoEm && (
          <GlassPanel depth={1} className="p-5">
            <SectionTitle icon={CheckCircle2}>Baixa e decisão</SectionTitle>
            <dl className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Baixado em" value={format(parseISO(expediente.baixadoEm), "dd 'de' MMM 'de' yyyy", { locale: ptBR })} />
              <Field label="Protocolo" value={expediente.protocoloId ?? '—'} />
              <Field
                label="Justificativa"
                value={expediente.justificativaBaixa ?? '—'}
                className="md:col-span-2"
              />
              <Field
                label="Resultado"
                value={expediente.resultadoDecisao ?? '—'}
                className="md:col-span-2"
              />
            </dl>
          </GlassPanel>
        )}
      </div>

      <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-4 lg:self-start">
        <GlassPanel depth={2} className="p-5">
          <SectionTitle icon={User}>Responsável</SectionTitle>
          <div className="mt-3">
            <ExpedienteResponsavelPopover
              expedienteId={expediente.id}
              responsavelId={expediente.responsavelId}
              usuarios={usuarios}
              onSuccess={() => {
                toast.success('Responsável atualizado.');
              }}
              align="start"
            >
              <ResponsavelDetailTrigger
                responsavelId={expediente.responsavelId}
                usuarios={usuarios}
              />
            </ExpedienteResponsavelPopover>
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-3">
            Clique para reatribuir. O responsável fica ancorado aqui enquanto a página rola.
          </p>
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle>Órgão julgador</SectionTitle>
          <div className="mt-3 space-y-1.5">
            <Text variant="caption" className="font-medium text-foreground/85">
              {expediente.descricaoOrgaoJulgador || '—'}
            </Text>
            {expediente.siglaOrgaoJulgador && (
              <Text variant="meta-label">{expediente.siglaOrgaoJulgador}</Text>
            )}
          </div>
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle icon={Calendar}>Prazos</SectionTitle>
          <dl className="mt-3 space-y-2.5">
            <FieldRow
              label="Ciência da parte"
              value={
                expediente.dataCienciaParte
                  ? format(parseISO(expediente.dataCienciaParte), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
                  : '—'
              }
            />
            <FieldRow
              label="Prazo legal"
              value={
                expediente.dataPrazoLegalParte
                  ? format(parseISO(expediente.dataPrazoLegalParte), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
                  : '—'
              }
              emphasis
            />
            <FieldRow
              label="Autuação"
              value={
                expediente.dataAutuacao
                  ? format(parseISO(expediente.dataAutuacao), 'dd/MM/yyyy')
                  : '—'
              }
            />
            <FieldRow
              label="Arquivamento"
              value={
                expediente.dataArquivamento
                  ? format(parseISO(expediente.dataArquivamento), 'dd/MM/yyyy')
                  : '—'
              }
            />
          </dl>
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle icon={ShieldAlert}>Flags processuais</SectionTitle>
          <div className="mt-3 space-y-2">
            <FlagRow
              icon={Lock}
              label="Segredo de justiça"
              active={expediente.segredoJustica}
            />
            <FlagRow
              icon={Monitor}
              label="Juízo digital"
              active={expediente.juizoDigital}
            />
            <FlagRow
              icon={Flag}
              label="Prioridade processual"
              active={expediente.prioridadeProcessual}
            />
          </div>
        </GlassPanel>

        <GlassPanel depth={1} className="p-5">
          <SectionTitle>Metadata</SectionTitle>
          <dl className="mt-3 space-y-2.5">
            <FieldRow label="ID interno" value={`#${expediente.id}`} />
            <FieldRow label="ID PJE" value={expediente.idPje?.toString() ?? '—'} />
            <FieldRow
              label="Status processo"
              value={expediente.codigoStatusProcesso ?? '—'}
            />
            <FieldRow
              label="Criado"
              value={format(parseISO(expediente.createdAt), "dd/MM/yyyy 'às' HH:mm")}
            />
            <FieldRow
              label="Atualizado"
              value={format(parseISO(expediente.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
            />
          </dl>
        </GlassPanel>
      </aside>
    </div>
  );
}

function ArquivosTab({ arquivos }: { arquivos: MockArquivo[] }) {
  if (arquivos.length === 0) {
    return (
      <GlassPanel depth={1} className="p-10 text-center">
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="caption" className="text-muted-foreground/70">
          {arquivos.length} arquivo{arquivos.length === 1 ? '' : 's'} vinculado{arquivos.length === 1 ? '' : 's'}
        </Text>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Plus className="size-3.5 mr-1" />
          Adicionar arquivo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {arquivos.map((arq) => (
          <GlassPanel key={arq.id} depth={1} className="p-4 group">
            <div className="flex items-start gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center">
                <FileText className="size-4 text-primary/70" />
              </div>
              <div className="min-w-0 flex-1">
                <Text
                  variant="caption"
                  className="font-medium text-foreground/90 truncate block"
                  title={arq.nome}
                >
                  {arq.nome}
                </Text>
                <div className="flex items-center gap-2 mt-0.5">
                  <Text variant="meta-label" className="uppercase tracking-wider">
                    {arq.tipo}
                  </Text>
                  <Text variant="meta-label">·</Text>
                  <Text variant="meta-label">{formatSize(arq.tamanhoBytes)}</Text>
                  <Text variant="meta-label">·</Text>
                  <Text variant="meta-label">
                    {format(parseISO(arq.criadoEm), 'dd/MM/yyyy')}
                  </Text>
                </div>
                <span className="inline-flex items-center mt-2 rounded-full px-2 py-0.5 text-[9px] font-semibold border bg-muted/30 text-muted-foreground/80 border-border/20">
                  {CATEGORIA_LABELS[arq.categoria]}
                </span>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="size-7">
                  <Eye className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7">
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}

function HistoricoTab({
  historico,
  usuarios,
}: {
  historico: MockHistoricoEvento[];
  usuarios: MockUsuario[];
}) {
  if (historico.length === 0) {
    return (
      <GlassPanel depth={1} className="p-10 text-center">
        <Text variant="caption" className="text-muted-foreground/60">
          Sem histórico de alterações.
        </Text>
      </GlassPanel>
    );
  }

  const getUsuario = (id: number | null) =>
    id ? usuarios.find((u) => u.id === id) : null;

  const eventIconMap: Record<MockHistoricoEvento['tipo'], { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
    criacao: { icon: Plus, tone: 'bg-primary' },
    atribuicao_responsavel: { icon: User, tone: 'bg-info' },
    alteracao_tipo: { icon: Tag, tone: 'bg-warning' },
    alteracao_descricao: { icon: FileText, tone: 'bg-warning' },
    alteracao_observacoes: { icon: Pencil, tone: 'bg-warning' },
    baixa: { icon: CheckCircle2, tone: 'bg-success' },
    reversao_baixa: { icon: History, tone: 'bg-destructive' },
    visualizacao: { icon: Eye, tone: 'bg-muted-foreground/40' },
  };

  return (
    <GlassPanel depth={1} className="p-6">
      <ol className="relative border-l border-border/20 ml-2 space-y-6">
        {[...historico].reverse().map((evt) => {
          const meta = eventIconMap[evt.tipo];
          const Icon = meta.icon;
          const autor = getUsuario(evt.autorId);
          return (
            <li key={evt.id} className="ml-5 relative">
              <span
                className={cn(
                  'absolute -left-[1.65rem] top-1 size-3 rounded-full ring-2 ring-background',
                  meta.tone,
                )}
              />
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                <Text variant="caption" className="font-medium text-foreground/85">
                  {evt.descricao}
                </Text>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Text variant="meta-label">
                  {format(parseISO(evt.data), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </Text>
                {autor && (
                  <>
                    <Text variant="meta-label">·</Text>
                    <div className="flex items-center gap-1">
                      <Avatar size="xs" className="size-4">
                        <AvatarImage src={autor.avatarUrl || undefined} />
                        <AvatarFallback className="text-[7px]">
                          {autor.nomeExibicao.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Text variant="meta-label">{autor.nomeExibicao}</Text>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}

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
            'inline-flex items-center gap-2 px-2 py-1 -mx-2 rounded-lg text-sm font-medium',
            'hover:bg-muted/50 transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {current ? (
            <SemanticBadge
              category="expediente_tipo"
              value={current.id}
              className="text-[10px]"
            >
              {current.tipo_expediente}
            </SemanticBadge>
          ) : (
            <span className="italic text-muted-foreground/60">
              Clique para atribuir tipo
            </span>
          )}
          <ChevronDown className="size-3 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl glass-dropdown overflow-hidden" align="start">
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
              Tipo do expediente
            </p>
            <CommandInput placeholder="Buscar tipo…" className="h-8 text-xs rounded-lg" />
          </div>
          <CommandList className="max-h-60 px-1.5 pb-1.5">
            <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-tipo"
                onSelect={() => handleSelect(null)}
                className="gap-2 rounded-lg text-xs px-2 py-1.5"
              >
                <span className="italic text-muted-foreground/60">Sem tipo</span>
              </CommandItem>
              {options.map((tipo) => (
                <CommandItem
                  key={tipo.id}
                  value={tipo.tipo_expediente}
                  onSelect={() => handleSelect(tipo.id)}
                  className="gap-2 rounded-lg text-xs px-2 py-1.5"
                >
                  <SemanticBadge
                    category="expediente_tipo"
                    value={tipo.id}
                    className="text-[9px]"
                  >
                    {tipo.tipo_expediente}
                  </SemanticBadge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ResponsavelDetailTrigger({
  responsavelId,
  usuarios,
}: {
  responsavelId: number | null | undefined;
  usuarios: MockUsuario[];
}) {
  const usuario = responsavelId ? usuarios.find((u) => u.id === responsavelId) : null;

  if (!usuario) {
    return (
      <div className="flex items-center gap-3 w-full py-1">
        <div className="size-10 rounded-full bg-muted/40 flex items-center justify-center">
          <User className="size-4 text-muted-foreground/40" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <Text variant="caption" className="text-warning/80 italic">
            Sem responsável
          </Text>
          <Text variant="meta-label">Clique para atribuir</Text>
        </div>
        <ChevronDown className="size-3 text-muted-foreground/40" />
      </div>
    );
  }

  const initials =
    usuario.nomeExibicao
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'NA';

  return (
    <div className="flex items-center gap-3 w-full py-1 text-left">
      <Avatar className="size-10">
        <AvatarImage src={usuario.avatarUrl || undefined} alt={usuario.nomeExibicao} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <Text variant="caption" className="font-medium text-foreground truncate">
          {usuario.nomeExibicao}
        </Text>
        {usuario.cargo && (
          <Text variant="meta-label" className="truncate">
            {usuario.cargo}
          </Text>
        )}
      </div>
      <ChevronDown className="size-3 text-muted-foreground/50" />
    </div>
  );
}

function SectionTitle({
  children,
  icon: Icon,
  action,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-muted-foreground/50" />}
        <Heading level="widget">{children}</Heading>
      </div>
      {action}
    </div>
  );
}

function EditHint() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
      <Pencil className="size-2.5" />
      Edição inline
    </span>
  );
}

function Field({
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
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <Text variant="caption" className="font-medium text-foreground/85 wrap-break-word">
        {value}
      </Text>
    </div>
  );
}

function FieldRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Text variant="label" className="shrink-0">
        {label}
      </Text>
      <Text
        variant="caption"
        className={cn(
          'text-right truncate tabular-nums',
          emphasis ? 'font-semibold text-foreground' : 'text-foreground/85',
        )}
      >
        {value}
      </Text>
    </div>
  );
}

function FlagRow({
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
        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border',
        active
          ? 'bg-primary/6 border-primary/20 text-foreground/90'
          : 'bg-transparent border-border/15 text-muted-foreground/50',
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <Text variant="caption" className={cn(active ? 'font-medium' : '')}>
        {label}
      </Text>
      <span className="ml-auto text-[9px] uppercase tracking-wider">
        {active ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  );
}
