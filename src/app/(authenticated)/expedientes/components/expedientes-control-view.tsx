'use client';

import * as React from 'react';
import { AlertTriangle, Clock, FileText, SearchX, Users, UserX, Layers3, FolderOpen } from 'lucide-react';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { TemporalViewError, TemporalViewLoading } from '@/components/shared';
import { GlassPanel } from '@/components/shared/glass-panel';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { cn } from '@/lib/utils';
import { GRAU_TRIBUNAL_LABELS, ORIGEM_EXPEDIENTE_LABELS, type Expediente } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import { ExpedienteControlDetailSheet } from './expediente-control-detail-sheet';

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedientesControlViewProps {
  viewModeSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
  usuariosData?: UsuarioData[];
  tiposExpedientesData?: TipoExpedienteData[];
}

type QueueMode = 'todos' | 'criticos' | 'hoje' | 'proximos' | 'sem_responsavel' | 'sem_tipo';
type ContentMode = 'cards' | 'list';

function getUsuarioNome(usuario: UsuarioData) {
  return usuario.nomeExibicao || usuario.nome_exibicao || usuario.nomeCompleto || usuario.nome || `Usuario ${usuario.id}`;
}

function normalizarData(dataISO: string | null | undefined) {
  if (!dataISO) return null;

  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente) {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;

  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

function formatarDataCurta(dataISO: string | null | undefined) {
  if (!dataISO) return 'Sem prazo';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dataISO));
  } catch {
    return 'Sem prazo';
  }
}

function getUrgencyLabel(expediente: Expediente) {
  if (expediente.baixadoEm) return 'Baixado';
  if (!expediente.dataPrazoLegalParte) return 'Sem prazo';
  if (expediente.prazoVencido) return 'Vencido';

  const diasRestantes = calcularDiasRestantes(expediente);

  if (diasRestantes === null) return 'Sem prazo';
  if (diasRestantes <= 0) return 'Hoje';
  if (diasRestantes <= 3) return `${diasRestantes} dias`;
  return 'No prazo';
}

function getUrgencyVariant(expediente: Expediente): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (expediente.baixadoEm) return 'secondary';
  if (expediente.prazoVencido) return 'destructive';

  const diasRestantes = calcularDiasRestantes(expediente);
  if (diasRestantes !== null && diasRestantes <= 0) return 'default';
  return 'outline';
}

function ControlMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <GlassPanel depth={2} className="p-4 gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">{title}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        </div>
        <div className="rounded-xl border border-border/20 p-2 text-muted-foreground/60">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground/60">{subtitle}</p>
    </GlassPanel>
  );
}

function EmptyQueue({ search }: { search: string }) {
  return (
    <GlassPanel depth={1} className="items-center justify-center p-8 text-center">
      <SearchX className="size-8 text-muted-foreground/35" />
      <h3 className="mt-3 text-sm font-medium">Nenhum expediente nesta fila</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground/60">
        {search
          ? 'Ajuste a busca para ampliar o recorte operacional.'
          : 'A fila atual nao possui expedientes pendentes dentro dos criterios selecionados.'}
      </p>
    </GlassPanel>
  );
}

function QueueCard({
  expediente,
  responsavelNome,
  tipoExpedienteNome,
  selected,
  onSelect,
  contentMode,
}: {
  expediente: Expediente;
  responsavelNome?: string | null;
  tipoExpedienteNome?: string | null;
  selected: boolean;
  onSelect: () => void;
  contentMode: ContentMode;
}) {
  const diasRestantes = calcularDiasRestantes(expediente);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left transition-all cursor-pointer',
        contentMode === 'cards' ? 'rounded-2xl' : 'rounded-xl',
      )}
    >
      <GlassPanel
        depth={selected ? 2 : 1}
        className={cn(
          'gap-3 p-4 hover:border-primary/20 hover:bg-primary/[0.03]',
          selected && 'border-primary/20 bg-primary/[0.03]'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AppBadge variant={getUrgencyVariant(expediente)}>{getUrgencyLabel(expediente)}</AppBadge>
              <AppBadge variant="outline">{expediente.trt}</AppBadge>
              <AppBadge variant="outline">{GRAU_TRIBUNAL_LABELS[expediente.grau]}</AppBadge>
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-tight text-foreground">
              {tipoExpedienteNome || 'Expediente sem classificacao'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {expediente.numeroProcesso}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Prazo</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">{formatarDataCurta(expediente.dataPrazoLegalParte)}</p>
            {diasRestantes !== null && !expediente.baixadoEm && (
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                {diasRestantes < 0
                  ? `${Math.abs(diasRestantes)}d vencido`
                  : diasRestantes === 0
                    ? 'vence hoje'
                    : `${diasRestantes}d restantes`}
              </p>
            )}
          </div>
        </div>

        <div className={cn('grid gap-3 text-xs text-muted-foreground/75', contentMode === 'cards' ? 'sm:grid-cols-2' : 'grid-cols-1')}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Partes</p>
            <p className="mt-1 truncate">{expediente.nomeParteAutora || 'Autora nao informada'}</p>
            <p className="truncate">{expediente.nomeParteRe || 'Re nao informada'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Operacao</p>
            <p className="mt-1">Responsavel: {responsavelNome || 'Sem responsavel'}</p>
            <p>Origem: {ORIGEM_EXPEDIENTE_LABELS[expediente.origem]}</p>
          </div>
        </div>
      </GlassPanel>
    </button>
  );
}

export function ExpedientesControlView({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesControlViewProps) {
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  const [queueMode, setQueueMode] = React.useState<QueueMode>('todos');
  const [contentMode, setContentMode] = React.useState<ContentMode>('cards');
  const [search, setSearch] = React.useState('');
  const [selectedExpediente, setSelectedExpediente] = React.useState<Expediente | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const { expedientes, isLoading, error, refetch } = useExpedientes({
    pagina: 1,
    limite: 300,
    baixado: false,
    incluirSemPrazo: true,
    busca: search || undefined,
  });

  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    usuarios.forEach((usuario) => map.set(usuario.id, getUsuarioNome(usuario)));
    return map;
  }, [usuarios]);

  const tiposMap = React.useMemo(() => {
    const map = new Map<number, string>();
    tiposExpedientes.forEach((tipo) => {
      const nomeAlternativo = 'tipo_expediente' in tipo ? tipo.tipo_expediente : undefined;
      map.set(tipo.id, tipo.tipoExpediente || nomeAlternativo || `Tipo ${tipo.id}`);
    });
    return map;
  }, [tiposExpedientes]);

  const dadosDerivados = React.useMemo(() => {
    const pendentes = expedientes.filter((item) => !item.baixadoEm);
    const vencidos = pendentes.filter((item) => item.prazoVencido);
    const hoje = pendentes.filter((item) => {
      const diasRestantes = calcularDiasRestantes(item);
      return diasRestantes === 0;
    });
    const proximos = pendentes.filter((item) => {
      const diasRestantes = calcularDiasRestantes(item);
      return diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 3;
    });
    const semResponsavel = pendentes.filter((item) => !item.responsavelId);
    const semTipo = pendentes.filter((item) => !item.tipoExpedienteId);
    const manuais = pendentes.filter((item) => item.origem === 'manual');
    const capturados = pendentes.filter((item) => item.origem !== 'manual');

    const rankingResponsaveis = Array.from(
      pendentes.reduce((acc, item) => {
        const chave = item.responsavelId ?? 0;
        const atual = acc.get(chave) ?? 0;
        acc.set(chave, atual + 1);
        return acc;
      }, new Map<number, number>()).entries()
    )
      .map(([responsavelId, total]) => ({
        responsavelId,
        total,
        nome: responsavelId === 0 ? 'Sem responsavel' : usuariosMap.get(responsavelId) || `Usuario ${responsavelId}`,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const origemDistribuicao = Object.entries(
      pendentes.reduce<Record<string, number>>((acc, item) => {
        acc[item.origem] = (acc[item.origem] || 0) + 1;
        return acc;
      }, {})
    ).map(([origem, total]) => ({ origem, total }));

    const filas: Record<QueueMode, Expediente[]> = {
      todos: pendentes,
      criticos: vencidos,
      hoje,
      proximos,
      sem_responsavel: semResponsavel,
      sem_tipo: semTipo,
    };

    return {
      pendentes,
      vencidos,
      hoje,
      proximos,
      semResponsavel,
      semTipo,
      manuais,
      capturados,
      rankingResponsaveis,
      origemDistribuicao,
      filas,
    };
  }, [expedientes, usuariosMap]);

  const queueTabs = React.useMemo<TabPillOption[]>(() => [
    { id: 'todos', label: 'Todos', count: dadosDerivados.pendentes.length },
    { id: 'criticos', label: 'Criticos', count: dadosDerivados.vencidos.length },
    { id: 'hoje', label: 'Hoje', count: dadosDerivados.hoje.length },
    { id: 'proximos', label: '3 dias', count: dadosDerivados.proximos.length },
    { id: 'sem_responsavel', label: 'Sem dono', count: dadosDerivados.semResponsavel.length },
    { id: 'sem_tipo', label: 'Sem tipo', count: dadosDerivados.semTipo.length },
  ], [dadosDerivados]);

  const contentOptions = React.useMemo<ViewToggleOption[]>(() => [
    { id: 'cards', label: 'Cards', icon: Layers3 },
    { id: 'list', label: 'Lista', icon: FileText },
  ], []);

  const expedientesDaFila = React.useMemo(() => {
    const fila = dadosDerivados.filas[queueMode] || [];

    return [...fila].sort((a, b) => {
      const aDias = calcularDiasRestantes(a);
      const bDias = calcularDiasRestantes(b);

      if (a.prazoVencido !== b.prazoVencido) return a.prazoVencido ? -1 : 1;
      if (aDias === null && bDias !== null) return 1;
      if (aDias !== null && bDias === null) return -1;
      if (aDias !== null && bDias !== null && aDias !== bDias) return aDias - bDias;
      return (a.numeroProcesso || '').localeCompare(b.numeroProcesso || '');
    });
  }, [dadosDerivados, queueMode]);

  React.useEffect(() => {
    if (!selectedExpediente) return;

    const aindaExiste = expedientesDaFila.some((item) => item.id === selectedExpediente.id)
      || dadosDerivados.pendentes.some((item) => item.id === selectedExpediente.id);

    if (!aindaExiste) {
      setSelectedExpediente(null);
      setDetailOpen(false);
    }
  }, [dadosDerivados.pendentes, expedientesDaFila, selectedExpediente]);

  if (isLoading) {
    return <TemporalViewLoading message="Carregando centro de comando de expedientes..." />;
  }

  if (error) {
    return <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />;
  }

  return (
    <>
      <div className="mx-auto flex max-w-350 flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Controle de Expedientes</h1>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Triagem central de risco, classificacao e distribuicao operacional do escritorio.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            {viewModeSlot}
            {settingsSlot}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ControlMetricCard title="Vencidos" value={dadosDerivados.vencidos.length} subtitle="Pedem intervencao imediata" icon={AlertTriangle} />
          <ControlMetricCard title="Hoje" value={dadosDerivados.hoje.length} subtitle="Fechamento do dia" icon={Clock} />
          <ControlMetricCard title="3 dias" value={dadosDerivados.proximos.length} subtitle="Janela curta de resposta" icon={FileText} />
          <ControlMetricCard title="Sem dono" value={dadosDerivados.semResponsavel.length} subtitle="Sem responsavel definido" icon={UserX} />
          <ControlMetricCard title="Sem tipo" value={dadosDerivados.semTipo.length} subtitle="Classificacao incompleta" icon={Layers3} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <GlassPanel depth={2} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Fila critica do dia</p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {dadosDerivados.vencidos.length > 0
                      ? `${dadosDerivados.vencidos.length} expediente(s) vencido(s)`
                      : dadosDerivados.hoje.length > 0
                        ? `${dadosDerivados.hoje.length} expediente(s) vence(m) hoje`
                        : 'Nenhuma ruptura critica no momento'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground/60">
                    {dadosDerivados.capturados.length} capturados automaticamente e {dadosDerivados.manuais.length} manuais aguardando tratamento.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-xl border border-border/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Pendentes</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">{dadosDerivados.pendentes.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Captura</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">{dadosDerivados.capturados.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/20 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Manual</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">{dadosDerivados.manuais.length}</p>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabPills tabs={queueTabs} active={queueMode} onChange={(value) => setQueueMode(value as QueueMode)} />
              <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar processo, parte, orgao..." className="w-full" />
                <ViewToggle mode={contentMode} onChange={(mode) => setContentMode(mode as ContentMode)} options={contentOptions} />
              </div>
            </div>

            <div className={cn('grid gap-3', contentMode === 'cards' ? 'grid-cols-1' : 'grid-cols-1')}>
              {expedientesDaFila.length === 0 ? (
                <EmptyQueue search={search} />
              ) : (
                expedientesDaFila.map((expediente) => (
                  <QueueCard
                    key={expediente.id}
                    expediente={expediente}
                    responsavelNome={expediente.responsavelId ? usuariosMap.get(expediente.responsavelId) : null}
                    tipoExpedienteNome={expediente.tipoExpedienteId ? tiposMap.get(expediente.tipoExpedienteId) : null}
                    selected={selectedExpediente?.id === expediente.id}
                    onSelect={() => {
                      setSelectedExpediente(expediente);
                      setDetailOpen(true);
                    }}
                    contentMode={contentMode}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <GlassPanel depth={1} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Capacidade</p>
                  <h2 className="mt-1 text-sm font-semibold">Carga por responsavel</h2>
                </div>
                <Users className="size-4 text-muted-foreground/45" />
              </div>

              <div className="mt-4 space-y-3">
                {dadosDerivados.rankingResponsaveis.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60">Nenhuma distribuicao ativa.</p>
                ) : (
                  dadosDerivados.rankingResponsaveis.map((item) => {
                    const maximo = dadosDerivados.rankingResponsaveis[0]?.total || 1;
                    const largura = `${(item.total / maximo) * 100}%`;

                    return (
                      <div key={item.responsavelId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{item.nome}</span>
                          <span className="tabular-nums text-muted-foreground/60">{item.total}</span>
                        </div>
                        <div className="h-2 rounded-full bg-border/10">
                          <div className="h-2 rounded-full bg-primary/40 transition-all" style={{ width: largura }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassPanel>

            <GlassPanel depth={1} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Radar</p>
                  <h2 className="mt-1 text-sm font-semibold">Sinais do acervo</h2>
                </div>
                <FolderOpen className="size-4 text-muted-foreground/45" />
              </div>

              <div className="mt-4 space-y-3 text-sm">
                {dadosDerivados.origemDistribuicao.map((item) => (
                  <div key={item.origem} className="flex items-center justify-between gap-3 rounded-xl border border-border/15 px-3 py-2.5">
                    <div>
                      <p className="font-medium">{ORIGEM_EXPEDIENTE_LABELS[item.origem as keyof typeof ORIGEM_EXPEDIENTE_LABELS]}</p>
                      <p className="text-xs text-muted-foreground/60">Expedientes pendentes desta origem</p>
                    </div>
                    <AppBadge variant="outline">{item.total}</AppBadge>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-border/15 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Sem responsavel</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{dadosDerivados.semResponsavel.length}</p>
                </div>
                <div className="rounded-xl border border-border/15 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Sem tipo</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{dadosDerivados.semTipo.length}</p>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel depth={1} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">Acoes sugeridas</p>
                  <h2 className="mt-1 text-sm font-semibold">Proximos passos do modulo</h2>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-xl border border-border/15 px-3 py-3 text-sm text-muted-foreground/75">
                  Priorize a classificacao dos itens sem tipo antes da baixa em lote.
                </div>
                <div className="rounded-xl border border-border/15 px-3 py-3 text-sm text-muted-foreground/75">
                  Redistribua os itens sem responsavel para reduzir filas cegas do escritorio.
                </div>
                <div className="rounded-xl border border-border/15 px-3 py-3 text-sm text-muted-foreground/75">
                  Use a view Semana para execucao diaria depois da triagem neste quadro.
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      <ExpedienteControlDetailSheet
        expediente={selectedExpediente}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        responsavelNome={selectedExpediente?.responsavelId ? usuariosMap.get(selectedExpediente.responsavelId) : null}
        tipoExpedienteNome={selectedExpediente?.tipoExpedienteId ? tiposMap.get(selectedExpediente.tipoExpedienteId) : null}
      />
    </>
  );
}