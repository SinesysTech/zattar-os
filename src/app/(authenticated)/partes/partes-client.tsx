'use client';

/**
 * PartesClient — Componente cliente do módulo Partes.
 *
 * Renderiza a UI "Glass Briefing" para gestão de clientes, partes contrárias,
 * terceiros e representantes usando os componentes compartilhados do dashboard.
 *
 * Uso:
 *   <PartesClient />
 *   <PartesClient initialStats={{ clientes: { total: 142, ativos: 138, novosMes: 5 }, ... }} />
 */

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  User,
  Gavel,
  Shield,
  Scale,
  X,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePartes, type TipoEntidade, type FiltroStatus } from '@/app/(authenticated)/partes';
import { EntityCard, getInitials, timeAgo, type EntityCardData, type EntityCardKind } from '@/components/dashboard/entity-card';
import type { Cliente, ParteContraria, Terceiro } from './domain';
import type { Representante } from './types/representantes';
import {
  actionBuscarCliente,
  actionBuscarParteContraria,
  actionBuscarTerceiro,
  actionBuscarRepresentantePorId,
  actionDesativarCliente,
  actionDesativarPartesContrariasEmMassa,
  actionDesativarTerceirosEmMassa,
  actionDeletarRepresentante,
} from './actions/index';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EntityListRow } from '@/components/dashboard/entity-list-row';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle } from '@/components/dashboard/view-toggle';
import { GlassPanel } from '@/components/shared/glass-panel';
import { ClienteFormDialog } from './components/clientes/cliente-form';
import { ParteContrariaFormDialog } from './components/partes-contrarias/parte-contraria-form';
import { TerceiroFormDialog } from './components/terceiros/terceiro-form';
import { RepresentanteFormDialog } from './components/representantes/representante-form';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatGroup {
  total: number;
  ativos: number;
  novosMes: number;
}

export interface PartesClientProps {
  initialStats?: {
    clientes: StatGroup;
    partesContrarias: StatGroup;
    terceiros: StatGroup;
    representantes: StatGroup;
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <GlassPanel className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 animate-pulse")}>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start gap-3")}>
        <div className="size-10 rounded-xl bg-muted-foreground/10 shrink-0" />
        <div className={cn("flex-1 stack-tight")}>
          <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
          <div className="h-2.5 bg-muted-foreground/8 rounded w-1/2" />
        </div>
      </div>
      <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5 mt-3")}>
        <div className="h-2 bg-muted-foreground/8 rounded w-full" />
        <div className="h-2 bg-muted-foreground/8 rounded w-2/3" />
      </div>
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "flex justify-between mt-3 pt-3 border-t border-border/10")}>
        <div className="h-2 bg-muted-foreground/8 rounded w-24" />
        <div className="h-2 bg-muted-foreground/8 rounded w-12" />
      </div>
    </GlassPanel>
  );
}

// ─── Status Filter Pills ──────────────────────────────────────────────────────
//
// Toggle compacto para filtrar listagens pelo soft-delete (`ativo`). Visualmente
// espelha o padrão do TabPills/ViewToggle (mesma altura, mesmos radius/ring),
// mas fica inline nos controles secundários da página — não compete com a
// navegação primária (TipoEntidade).

const STATUS_OPTIONS: ReadonlyArray<{ value: FiltroStatus; label: string }> = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
  { value: 'todos', label: 'Todos' },
];

function StatusFilterPills({
  value,
  onChange,
}: {
  value: FiltroStatus;
  onChange: (value: FiltroStatus) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Filtrar por status"
      className={cn(/* design-system-escape: gap-0.5 gap sem token DS; p-0.5 → usar <Inset> */ "inline-flex items-center gap-0.5 rounded-xl border border-border/40 bg-muted/30 p-0.5")}
    >
      {STATUS_OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={
              selected
                ? /* design-system-escape: px-3 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-3 h-7 rounded-lg text-[11px] font-medium bg-primary/10 text-primary transition-colors'
                : /* design-system-escape: px-3 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-3 h-7 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/4 transition-colors'
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-3 px-4 py-2.5 rounded-xl animate-pulse")}>
      <div className="size-8 rounded-lg bg-muted-foreground/10 shrink-0" />
      <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "flex-1 space-y-1.5")}>
        <div className="h-2.5 bg-muted-foreground/10 rounded w-48" />
        <div className="h-2 bg-muted-foreground/8 rounded w-28" />
      </div>
      <div className="h-2 bg-muted-foreground/8 rounded w-16 hidden sm:block" />
      <div className="h-2 bg-muted-foreground/8 rounded w-10 hidden md:block" />
      <div className="h-2 bg-muted-foreground/8 rounded w-10" />
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

interface EntityDetailProps {
  data: EntityCardData;
  onClose: () => void;
}

const LABEL_TO_SEGMENT: Record<string, string> = {
  'Cliente': 'clientes',
  'Parte Contrária': 'partes-contrarias',
  'Terceiro': 'terceiros',
  'Representante': 'representantes',
};

function EntityDetail({ data, onClose }: EntityDetailProps) {
  const { config } = data;
  const segment = LABEL_TO_SEGMENT[config.label] ?? 'clientes';
  const perfilHref = `/partes/${segment}/${data.id}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(data.nome).catch(() => {});
  }, [data.nome]);

  return (
    <GlassPanel className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
          <div className={`size-12 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {data.tipo === 'pj' ? (
              <Building2 className={`size-5 ${config.color}`} />
            ) : (
              <span className={`text-sm font-bold ${config.color}`}>{getInitials(data.nome)}</span>
            )}
          </div>
          <div>
            <Heading level="card">{data.nome}</Heading>
            <div className={cn("flex items-center inline-tight mt-0.5")}>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {data.tipo === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </span>
              {!data.ativo && (
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/70")}>
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar painel de detalhes"
          className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors cursor-pointer")}
        >
          <X className="size-4 text-muted-foreground/60" />
        </button>
      </div>

      {/* Info grid */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3 mb-5")}>
        <InfoRow icon={FileText} label="Documento" value={data.documentoMasked} />
        {data.localizacao && data.localizacao !== '—' && (
          <InfoRow icon={MapPin} label="Localidade" value={data.localizacao} />
        )}
        {data.email && <InfoRow icon={Mail} label="E-mail" value={data.email} />}
        {data.telefone && <InfoRow icon={Phone} label="Telefone" value={data.telefone} />}
        <InfoRow
          icon={Clock}
          label="Atualizado"
          value={timeAgo(data.ultimaAtualizacao)}
        />
      </div>

      {/* Métricas */}
      <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex inline-default p-3 rounded-xl bg-foreground/3 border border-border/10 mb-5")}>
        <div className="flex-1 text-center">
          <Text variant="kpi-value">{data.metricas.ativos}</Text>
          <p className="text-[9px] text-muted-foreground/60">Ativos</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <Text variant="kpi-value" className="text-muted-foreground/70">
            {Math.max(0, data.metricas.total - data.metricas.ativos)}
          </Text>
          <p className="text-[9px] text-muted-foreground/60">Encerrados</p>
        </div>
        <div className="w-px bg-border/10" />
        <div className="flex-1 text-center">
          <Text variant="kpi-value" className="text-primary/70">{data.metricas.total}</Text>
          <p className="text-[9px] text-muted-foreground/60">Total</p>
        </div>
      </div>

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex flex-wrap gap-1.5 mb-5")}>
          {data.tags.map((tag) => (
            <span key={tag} className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] px-2 py-0.5 rounded-full bg-primary/6 text-primary/60 border border-primary/10")}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Nome social */}
      {data.nomeSocial && (
        <div className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "mb-4 p-2.5 rounded-lg bg-foreground/2.5 border border-border/10")}>
          <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/55 uppercase tracking-wider mb-0.5")}>Nome fantasia / Social</p>
          <Text variant="caption" className="text-muted-foreground/70">{data.nomeSocial}</Text>
        </div>
      )}

      {/* Ações */}
      <div className={cn(/* design-system-escape: pt-4 padding direcional sem Inset equiv. */ "flex inline-tight mt-5 pt-4 border-t border-border/10")}>
        <Link
          href={perfilHref}
          className={cn(/* design-system-escape: gap-1.5 gap sem token DS; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary/70 text-caption font-medium hover:bg-primary/15 transition-colors cursor-pointer")}
        >
          <ExternalLink className="size-3" />
          Ver perfil completo
        </Link>
        <button
          onClick={handleCopy}
          aria-label="Copiar nome"
          className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-foreground/4 text-muted-foreground/70 text-caption font-medium hover:bg-foreground/6 transition-colors cursor-pointer")}
        >
          <Copy className="size-3" />
        </button>
      </div>
    </GlassPanel>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("flex items-start inline-tight")}>
      <Icon className="size-3 text-muted-foreground/55 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/55 uppercase tracking-wider")}>{label}</p>
        <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[11px] font-medium truncate")}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 24;

export function PartesClient({ initialStats }: PartesClientProps) {
  const [activeTab, setActiveTab] = useState<TipoEntidade>('todos');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [selectedParte, setSelectedParte] = useState<EntityCardData | null>(null);
  const [pagina, setPagina] = useState(1);
  // Filtro de status: default 'ativos' — soft-deleted não aparecem sem ação explícita.
  // Representantes ignoram esse filtro (não têm soft-delete).
  const [statusFilter, setStatusFilter] = useState<FiltroStatus>('ativos');

  // Criação de parte
  type CreateType = 'clientes' | 'partes_contrarias' | 'terceiros' | 'representantes';
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Edição — guarda entidade carregada + tipo para renderizar o FormDialog certo
  type EditTarget =
    | { kind: 'cliente'; entity: Cliente }
    | { kind: 'parte_contraria'; entity: ParteContraria }
    | { kind: 'terceiro'; entity: Terceiro }
    | { kind: 'representante'; entity: Representante };
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  // Exclusão — guarda identificação da entidade pendente de confirmação
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: EntityCardKind; id: number; nome: string } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { partes, isLoading, error, total, refetch } = usePartes({
    tipoEntidade: activeTab,
    busca: search,
    pagina,
    limite: PAGE_SIZE,
    status: statusFilter,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Fechar painel ao trocar de tab
  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id as TipoEntidade);
    setSelectedParte(null);
    setPagina(1);
  }, []);

  const handleSelect = useCallback((data: EntityCardData) => {
    setSelectedParte((prev) => (prev?.id === data.id ? null : data));
  }, []);

  const handleNovaParte = useCallback(() => {
    if (activeTab !== 'todos') {
      setCreateType(activeTab as CreateType);
    } else {
      setShowTypeMenu((prev) => !prev);
    }
  }, [activeTab]);

  const handleCreateSuccess = useCallback(() => {
    setCreateType(null);
    refetch();
  }, [refetch]);

  // Infere tipo da entidade quando o card não carrega tipoEntidade (fallback).
  // A tab 'todos' depende do campo vindo do adapter; as outras tabs já apontam o tipo.
  const resolveKind = useCallback(
    (data: EntityCardData): EntityCardKind | null => {
      if (data.tipoEntidade) return data.tipoEntidade;
      if (activeTab === 'clientes') return 'cliente';
      if (activeTab === 'partes_contrarias') return 'parte_contraria';
      if (activeTab === 'terceiros') return 'terceiro';
      if (activeTab === 'representantes') return 'representante';
      return null;
    },
    [activeTab]
  );

  const handleEdit = useCallback(
    async (data: EntityCardData) => {
      const kind = resolveKind(data);
      if (!kind) {
        toast.error('Não foi possível determinar o tipo do registro');
        return;
      }
      const id = Number(data.id);
      if (!Number.isFinite(id)) return;

      try {
        // Edição sempre exige endereço populado para hidratar os campos do dialog;
        // sem o flag `incluirEndereco`, os fetches retornam a entidade "crua" (sem JOIN)
        // e o form mostraria os campos de endereço em branco mesmo existindo registro.
        if (kind === 'cliente') {
          const res = await actionBuscarCliente(id, { incluirEndereco: true });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Cliente não encontrado');
          setEditTarget({ kind, entity: res.data as Cliente });
        } else if (kind === 'parte_contraria') {
          const res = await actionBuscarParteContraria(id, { incluirEndereco: true });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Parte contrária não encontrada');
          setEditTarget({ kind, entity: res.data as ParteContraria });
        } else if (kind === 'terceiro') {
          const res = await actionBuscarTerceiro(id, { incluirEndereco: true });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Terceiro não encontrado');
          setEditTarget({ kind, entity: res.data as Terceiro });
        } else if (kind === 'representante') {
          const res = await actionBuscarRepresentantePorId(id, { incluirEndereco: true });
          if (!res.success || !res.data) throw new Error(res.error ?? 'Representante não encontrado');
          setEditTarget({ kind, entity: res.data as Representante });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar registro');
      }
    },
    [resolveKind]
  );

  const handleDelete = useCallback(
    (data: EntityCardData) => {
      const kind = resolveKind(data);
      if (!kind) return;
      const id = Number(data.id);
      if (!Number.isFinite(id)) return;
      setDeleteTarget({ kind, id, nome: data.nome });
    },
    [resolveKind]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { kind, id, nome } = deleteTarget;
      let success = false;
      let message: string | undefined;

      if (kind === 'cliente') {
        const r = await actionDesativarCliente(id);
        success = r.success;
        message = r.success ? undefined : r.error;
      } else if (kind === 'parte_contraria') {
        const r = await actionDesativarPartesContrariasEmMassa([id]);
        success = r.success;
        message = r.message;
      } else if (kind === 'terceiro') {
        const r = await actionDesativarTerceirosEmMassa([id]);
        success = r.success;
        message = r.message;
      } else if (kind === 'representante') {
        const r = await actionDeletarRepresentante(id);
        success = r.success;
        message = r.error;
      }

      if (success) {
        toast.success(`"${nome}" excluído com sucesso.`);
        if (selectedParte && Number(selectedParte.id) === id) setSelectedParte(null);
        setDeleteTarget(null);
        refetch();
      } else {
        toast.error(message ?? 'Erro ao excluir registro');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, selectedParte, refetch]);

  const handleEditSuccess = useCallback(() => {
    setEditTarget(null);
    refetch();
  }, [refetch]);

  // Stats — preferem initialStats quando disponíveis, senão usa total da tab ativa
  const stats = initialStats ?? {
    clientes: { total: 0, ativos: 0, novosMes: 0 },
    partesContrarias: { total: 0, ativos: 0, novosMes: 0 },
    terceiros: { total: 0, ativos: 0, novosMes: 0 },
    representantes: { total: 0, ativos: 0, novosMes: 0 },
  };

  const totalGeral =
    stats.clientes.total +
    stats.partesContrarias.total +
    stats.terceiros.total +
    stats.representantes.total;

  const novosEsteMes =
    stats.clientes.novosMes +
    stats.partesContrarias.novosMes +
    stats.terceiros.novosMes +
    stats.representantes.novosMes;

  // PulseStrip items
  const pulseItems: PulseItem[] = [
    {
      label: 'Clientes',
      total: stats.clientes.total || (activeTab === 'clientes' ? total : 0),
      delta: stats.clientes.novosMes > 0 ? `+${stats.clientes.novosMes}` : undefined,
      icon: User,
      color: 'text-primary',
    },
    {
      label: 'Partes Contrárias',
      total: stats.partesContrarias.total || (activeTab === 'partes_contrarias' ? total : 0),
      delta: stats.partesContrarias.novosMes > 0 ? `+${stats.partesContrarias.novosMes}` : undefined,
      icon: Gavel,
      color: 'text-warning',
    },
    {
      label: 'Terceiros',
      total: stats.terceiros.total || (activeTab === 'terceiros' ? total : 0),
      delta: stats.terceiros.novosMes > 0 ? `+${stats.terceiros.novosMes}` : undefined,
      icon: Shield,
      color: 'text-info',
    },
    {
      label: 'Representantes',
      total: stats.representantes.total || (activeTab === 'representantes' ? total : 0),
      delta: stats.representantes.novosMes > 0 ? `+${stats.representantes.novosMes}` : undefined,
      icon: Scale,
      color: 'text-success',
    },
  ];

  // Tabs
  const tabs: TabPillOption[] = [
    { id: 'todos', label: 'Todos', count: totalGeral || (activeTab === 'todos' ? total : undefined) },
    { id: 'clientes', label: 'Clientes', count: stats.clientes.total || (activeTab === 'clientes' ? total : undefined) },
    { id: 'partes_contrarias', label: 'Partes Contrárias', count: stats.partesContrarias.total || (activeTab === 'partes_contrarias' ? total : undefined) },
    { id: 'terceiros', label: 'Terceiros', count: stats.terceiros.total || (activeTab === 'terceiros' ? total : undefined) },
    { id: 'representantes', label: 'Representantes', count: stats.representantes.total || (activeTab === 'representantes' ? total : undefined) },
  ];

  const skeletonCount = 6;

  const createOptions: { type: CreateType; label: string; icon: typeof User }[] = [
    { type: 'clientes', label: 'Cliente', icon: User },
    { type: 'partes_contrarias', label: 'Parte Contrária', icon: Gavel },
    { type: 'terceiros', label: 'Terceiro', icon: Shield },
    { type: 'representantes', label: 'Representante', icon: Scale },
  ];

  const buttonLabel = activeTab !== 'todos'
    ? `Novo ${createOptions.find((o) => o.type === activeTab)?.label ?? 'Registro'}`
    : 'Nova parte';

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={cn("flex items-end justify-between inline-default")}>
        <div>
          <Heading level="page">Partes</Heading>
          <p className={cn("text-body-sm text-muted-foreground/70 mt-0.5")}>
            {totalGeral > 0
              ? `${totalGeral.toLocaleString('pt-BR')} registros${novosEsteMes > 0 ? ` · ${novosEsteMes} novos este mês` : ''}`
              : total > 0
                ? `${total.toLocaleString('pt-BR')} registros`
                : 'Gestão de clientes, partes e representantes'}
          </p>
        </div>
        <div className="relative">
          <Button size="sm" className="rounded-xl" onClick={handleNovaParte}>
            <Plus className="size-3.5" />
            {buttonLabel}
          </Button>

          {/* Dropdown de tipo (só na tab "Todos") */}
          {showTypeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTypeMenu(false)} />
              <div className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "absolute right-0 top-full mt-1.5 z-50 w-56 rounded-xl border border-border/20 bg-popover shadow-lg p-1.5 animate-in fade-in slide-in-from-top-2 duration-150")}>
                {createOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setCreateType(opt.type);
                      setShowTypeMenu(false);
                    }}
                    className={cn(/* design-system-escape: gap-2.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body-sm hover:bg-accent transition-colors cursor-pointer text-left")}
                  >
                    <opt.icon className="size-4 text-muted-foreground/60" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Pulse Strip ─────────────────────────────────────────── */}
      <PulseStrip items={pulseItems} />

      {/* ── Insight Banner ──────────────────────────────────────── */}
      <div className={cn(/* design-system-escape: px-3.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "rounded-lg border border-primary/10 bg-primary/4 px-3.5 py-2 text-[11px] font-medium text-primary/70 flex items-center inline-tight cursor-pointer hover:bg-primary/6 transition-colors")}>
        <AlertCircle className="size-3.5 shrink-0" />
        <span>Verifique clientes sem processos ativos e cadastros com dados incompletos</span>
        <ChevronRight className="size-3 ml-auto shrink-0" />
      </div>

      {/* ── Tabs + Status Filter + Search + View Toggle ─────────── */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <TabPills tabs={tabs} active={activeTab} onChange={handleTabChange} />
        <div className={cn("flex items-center inline-tight flex-1 justify-end")}>
          {activeTab !== 'representantes' && (
            <StatusFilterPills
              value={statusFilter}
              onChange={(next) => { setStatusFilter(next); setPagina(1); }}
            />
          )}
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPagina(1); }}
            placeholder="Buscar por nome, CPF, CNPJ..."
          />
          <ViewToggle mode={viewMode} onChange={(m) => setViewMode(m as 'cards' | 'list')} />
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────── */}
      {error && (
        <Text variant="caption" className="rounded-lg border border-destructive/20 bg-destructive/4 px-4 py-3 text-destructive/80 flex items-center gap-2">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </Text>
      )}

      {/* ── Content: Cards + Optional Detail ────────────────────── */}
      <div className={`grid gap-3 ${selectedParte ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        {/* Cards/List Grid */}
        <div
          className={
            viewMode === 'cards'
              ? `grid grid-cols-1 sm:grid-cols-2 ${selectedParte ? '' : 'lg:grid-cols-3'} auto-rows-fr gap-3`
              : /* design-system-escape: gap-1.5 gap sem token DS */ 'flex flex-col gap-1.5'
          }
        >
          {isLoading
            ? Array.from({ length: skeletonCount }).map((_, i) =>
                viewMode === 'cards' ? (
                  <CardSkeleton key={i} />
                ) : (
                  <ListRowSkeleton key={i} />
                )
              )
            : partes.map((parte) =>
                viewMode === 'cards' ? (
                  <EntityCard
                    key={parte.id}
                    data={parte}
                    onClick={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ) : (
                  <EntityListRow
                    key={parte.id}
                    data={parte}
                    onClick={handleSelect}
                    selected={selectedParte?.id === parte.id}
                  />
                )
              )}

          {!isLoading && !error && partes.length === 0 && (
            <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "col-span-full flex flex-col items-center justify-center py-16 text-center")}>
              <Users className="size-8 text-muted-foreground/65 mb-3" />
              <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/70")}>
                Nenhuma parte encontrada
              </p>
              <Text variant="caption" className="text-muted-foreground/55 mt-1">
                {search ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
              </Text>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedParte && (
          <div className="hidden lg:block sticky top-4 self-start">
            <EntityDetail data={selectedParte} onClose={() => setSelectedParte(null)} />
          </div>
        )}
      </div>

      {/* ── Paginação ──────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between pt-2")}>
          <Text variant="caption" className="text-muted-foreground/70">
            {((pagina - 1) * PAGE_SIZE) + 1}–{Math.min(pagina * PAGE_SIZE, total)} de {total.toLocaleString('pt-BR')}
          </Text>
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-foreground/4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4 text-muted-foreground/60" />
            </button>
            <Text variant="caption" className="font-medium tabular-nums px-2">
              {pagina} / {totalPages}
            </Text>
            <button
              onClick={() => setPagina((p) => Math.min(totalPages, p + 1))}
              disabled={pagina >= totalPages}
              className="flex items-center justify-center size-8 rounded-lg hover:bg-foreground/4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4 text-muted-foreground/60" />
            </button>
          </div>
        </div>
      )}

      {/* ── Dialogs de criação ─────────────────────────────────── */}
      <ClienteFormDialog
        open={createType === 'clientes'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <ParteContrariaFormDialog
        open={createType === 'partes_contrarias'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <TerceiroFormDialog
        open={createType === 'terceiros'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <RepresentanteFormDialog
        open={createType === 'representantes'}
        onOpenChange={(open) => { if (!open) setCreateType(null); }}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {/* ── Dialogs de edição ───────────────────────────────────── */}
      {editTarget?.kind === 'cliente' && (
        <ClienteFormDialog
          open
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onSuccess={handleEditSuccess}
          mode="edit"
          cliente={editTarget.entity}
        />
      )}
      {editTarget?.kind === 'parte_contraria' && (
        <ParteContrariaFormDialog
          open
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onSuccess={handleEditSuccess}
          mode="edit"
          parteContraria={editTarget.entity}
        />
      )}
      {editTarget?.kind === 'terceiro' && (
        <TerceiroFormDialog
          open
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onSuccess={handleEditSuccess}
          mode="edit"
          terceiro={editTarget.entity}
        />
      )}
      {editTarget?.kind === 'representante' && (
        <RepresentanteFormDialog
          open
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onSuccess={handleEditSuccess}
          mode="edit"
          representante={editTarget.entity}
        />
      )}

      {/* ── Confirmação de exclusão ─────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  O registro <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground")}>&quot;{deleteTarget.nome}&quot;</span>{' '}
                  {deleteTarget.kind === 'representante'
                    ? 'será removido permanentemente.'
                    : 'será desativado e deixará de aparecer nas listagens ativas. Você pode reativá-lo depois.'}
                </>
              ) : (
                'Confirme a exclusão do registro.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
