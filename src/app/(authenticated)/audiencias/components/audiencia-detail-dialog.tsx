'use client';

import * as React from 'react';
import {
  Clock, ExternalLink, Copy, Pencil, Video, FileText, Building2, Check, AlertCircle, MessageSquare, X, ChevronDown, ChevronRight, Globe} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/typography';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
import {
  type Audiencia,
  type EnderecoPresencial,
  ModalidadeAudiencia,
  PresencaHibrida,
  GRAU_TRIBUNAL_LABELS,
  TRT_NOMES,
  isAudienciaCapturada,
  buildPjeUrl,
} from '../domain';
import {
  actionBuscarAudienciaPorId,
  actionAtualizarUrlVirtual,
  actionAtualizarEnderecoPresencial,
  actionAtualizarObservacoes,
  actionAtualizarAudienciaPayload,
} from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { usePermissoes } from '@/providers/user-provider';
import { cn } from '@/lib/utils';

import { LoadingSpinner } from "@/components/ui/loading-state"
const MODALIDADE_LABELS: Record<ModalidadeAudiencia, string> = {
  [ModalidadeAudiencia.Virtual]: 'Virtual',
  [ModalidadeAudiencia.Presencial]: 'Presencial',
  [ModalidadeAudiencia.Hibrida]: 'Híbrida',
};

const MODALIDADE_ICONS: Record<ModalidadeAudiencia, React.ComponentType<{ className?: string }>> = {
  [ModalidadeAudiencia.Virtual]: Video,
  [ModalidadeAudiencia.Presencial]: Building2,
  [ModalidadeAudiencia.Hibrida]: Globe,
};

// =============================================================================
// SECTION HELPERS
// =============================================================================

/**
 * Cabeçalho de seção dentro do detail dialog.
 *
 * Padrão canônico do sistema: `Text variant="overline"` (11px uppercase).
 * Todos os dialogs de detalhe (obrigações, documentos, nova-audiência)
 * usam overline para section headers, criando uma escala clara onde o
 * conteúdo do card (labels 13–14px) é sempre mais proeminente que o
 * título da seção, reduzindo competição visual com o hero/title.
 */
function SectionHeader({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-2.5 flex items-center inline-tight")}>
      <Icon className="size-3.5 text-primary" />
      <Text variant="overline" className="text-muted-foreground">
        {label}
      </Text>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-border/30 bg-muted/40 p-[14px_16px]',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// PROPS
// =============================================================================

export interface AudienciaDetailDialogProps {
  audienciaId?: number;
  audiencia?: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AudienciaDetailDialog({
  audienciaId,
  audiencia: audienciaProp,
  open,
  onOpenChange,
}: AudienciaDetailDialogProps) {
  const [fetchedAudiencia, setFetchedAudiencia] = React.useState<Audiencia | null>(null);
  const [localAudiencia, setLocalAudiencia] = React.useState<Audiencia | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const [editingUrl, setEditingUrl] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState('');
  const [savingUrl, setSavingUrl] = React.useState(false);

  const [editingEndereco, setEditingEndereco] = React.useState(false);
  const [enderecoDraft, setEnderecoDraft] = React.useState<EnderecoPresencial>({
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
  });
  const [savingEndereco, setSavingEndereco] = React.useState(false);

  const [editingObs, setEditingObs] = React.useState(false);
  const [obsDraft, setObsDraft] = React.useState('');
  const [savingObs, setSavingObs] = React.useState(false);

  const [savingModalidade, setSavingModalidade] = React.useState(false);
  const [modalidadePopoverOpen, setModalidadePopoverOpen] = React.useState(false);

  const [savingPresenca, setSavingPresenca] = React.useState(false);

  const [ataOpen, setAtaOpen] = React.useState(false);

  const { usuarios } = useUsuarios({ enabled: open });
  const { temPermissao } = usePermissoes();
  const canEditUrl = temPermissao('audiencias', 'editar_url_virtual');
  const canEditGeneral = temPermissao('audiencias', 'editar');
  const canAssign =
    temPermissao('audiencias', 'atribuir_responsavel') ||
    temPermissao('audiencias', 'transferir_responsavel') ||
    temPermissao('audiencias', 'desatribuir_responsavel');

  const shouldFetch = !!audienciaId && !audienciaProp;

  React.useEffect(() => {
    if (!shouldFetch || !open) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    actionBuscarAudienciaPorId(audienciaId!)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setFetchedAudiencia(result.data);
        } else if (!result.success) {
          setError(result.error || 'Erro ao buscar audiência');
        } else {
          setError('Audiência não encontrada');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [audienciaId, shouldFetch, open]);

  React.useEffect(() => {
    if (!open) {
      setAtaOpen(false);
      setLocalAudiencia(null);
      setFetchedAudiencia(null);
      setEditingUrl(false);
      setEditingEndereco(false);
      setEditingObs(false);
    }
  }, [open]);

  React.useEffect(() => {
    const base = audienciaProp || fetchedAudiencia;
    if (base) setLocalAudiencia(base);
  }, [audienciaProp, fetchedAudiencia]);

  const audiencia = localAudiencia || audienciaProp || fetchedAudiencia;
  const isPje = audiencia ? isAudienciaCapturada(audiencia) : false;
  const pjeUrl = audiencia ? buildPjeUrl(audiencia.trt, audiencia.numeroProcesso) : '';
  const hasAta = !!audiencia?.urlAtaAudiencia;

  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const _dataFim = audiencia ? parseISO(audiencia.dataFim) : null;

  const poloAtivo = audiencia?.poloAtivoOrigem || audiencia?.poloAtivoNome || '—';
  const poloPassivo = audiencia?.poloPassivoOrigem || audiencia?.poloPassivoNome || '—';
  const orgaoJulgador =
    audiencia?.orgaoJulgadorDescricao ||
    audiencia?.orgaoJulgadorOrigem ||
    audiencia?.salaAudienciaNome ||
    null;

  const handleCopyUrl = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // silencioso
    }
  }, []);

  const handleStartEditUrl = React.useCallback(() => {
    setUrlDraft(audiencia?.urlAudienciaVirtual || '');
    setEditingUrl(true);
  }, [audiencia]);

  const handleSaveUrl = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingUrl(true);
    const result = await actionAtualizarUrlVirtual(audiencia.id, urlDraft || null);
    if (result.success) {
      if (result.data) setLocalAudiencia(result.data);
      setEditingUrl(false);
      toast.success('Link da sala virtual atualizado.');
    } else {
      toast.error(result.message || 'Falha ao atualizar link.', {
        description: result.error,
      });
    }
    setSavingUrl(false);
  }, [audiencia, urlDraft]);

  const handleStartEditEndereco = React.useCallback(() => {
    const e = audiencia?.enderecoPresencial;
    setEnderecoDraft({
      cep: e?.cep || '', logradouro: e?.logradouro || '', numero: e?.numero || '',
      complemento: e?.complemento || '', bairro: e?.bairro || '', cidade: e?.cidade || '', uf: e?.uf || '',
    });
    setEditingEndereco(true);
  }, [audiencia]);

  const handleSaveEndereco = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingEndereco(true);
    const hasData = enderecoDraft.logradouro && enderecoDraft.numero && enderecoDraft.cidade && enderecoDraft.uf;
    const result = await actionAtualizarEnderecoPresencial(audiencia.id, hasData ? enderecoDraft : null);
    if (result.success) {
      if (result.data) setLocalAudiencia(result.data);
      setEditingEndereco(false);
      toast.success('Endereço presencial atualizado.');
    } else {
      toast.error(result.message || 'Falha ao salvar endereço.', {
        description: result.error,
      });
    }
    setSavingEndereco(false);
  }, [audiencia, enderecoDraft]);

  const handleStartEditObs = React.useCallback(() => {
    setObsDraft(audiencia?.observacoes || '');
    setEditingObs(true);
  }, [audiencia]);

  const handleSaveObs = React.useCallback(async () => {
    if (!audiencia) return;
    setSavingObs(true);
    const result = await actionAtualizarObservacoes(audiencia.id, obsDraft || null);
    if (result.success) {
      if (result.data) setLocalAudiencia(result.data);
      setEditingObs(false);
      toast.success('Observações atualizadas.');
    } else {
      toast.error(result.message || 'Falha ao salvar observações.', {
        description: result.error,
      });
    }
    setSavingObs(false);
  }, [audiencia, obsDraft]);

  const handleChangeModalidade = React.useCallback(
    async (novaModalidade: ModalidadeAudiencia) => {
      if (!audiencia || novaModalidade === audiencia.modalidade) {
        setModalidadePopoverOpen(false);
        return;
      }
      setSavingModalidade(true);
      setModalidadePopoverOpen(false);
      const result = await actionAtualizarAudienciaPayload(audiencia.id, { modalidade: novaModalidade });
      if (result.success && result.data) {
        setLocalAudiencia(result.data);
        toast.success('Modalidade atualizada.');
      } else if (!result.success) {
        toast.error(result.message || 'Falha ao alterar modalidade.', {
          description: result.error,
        });
      }
      setSavingModalidade(false);
    },
    [audiencia]
  );

  const handleChangePresencaHibrida = React.useCallback(
    async (valor: PresencaHibrida) => {
      if (!audiencia) return;
      setSavingPresenca(true);
      const result = await actionAtualizarAudienciaPayload(audiencia.id, { presencaHibrida: valor });
      if (result.success && result.data) {
        setLocalAudiencia(result.data);
        toast.success('Presença híbrida atualizada.');
      } else if (!result.success) {
        toast.error(result.message || 'Falha ao alterar presença híbrida.', {
          description: result.error,
        });
      }
      setSavingPresenca(false);
    },
    [audiencia]
  );

  const hasIndicadores =
    audiencia &&
    (audiencia.segredoJustica || audiencia.juizoDigital || audiencia.designada || audiencia.documentoAtivo);

  const isVirtual = audiencia?.modalidade === ModalidadeAudiencia.Virtual;
  const isPresencial = audiencia?.modalidade === ModalidadeAudiencia.Presencial;
  const isHibrida = audiencia?.modalidade === ModalidadeAudiencia.Hibrida;

  const enderecoCompleto = Boolean(
    audiencia?.enderecoPresencial?.logradouro &&
      audiencia?.enderecoPresencial?.numero &&
      audiencia?.enderecoPresencial?.cidade &&
      audiencia?.enderecoPresencial?.uf
  );
  const urlObrigatoriaFaltando =
    (isVirtual || isHibrida) && !audiencia?.urlAudienciaVirtual;
  const enderecoObrigatorioFaltando =
    (isPresencial || isHibrida) && !enderecoCompleto;

  const modalidadePopoverDisabled = savingModalidade || !canEditGeneral;
  const presencaDisabled = savingPresenca || !canEditGeneral;

  // ───────────────────────────────────────────────────────────────────────
  // Slots do DialogDetailShell — composição declarativa da capa + hero + split.
  // ───────────────────────────────────────────────────────────────────────

  const titleNode = audiencia?.tipoDescricao || 'Audiência';

  const metaNode = audiencia ? (
    <div className="space-y-0.5">
      {/* Partes — espelha hierarquia do card */}
      <Text variant="caption" as="p" className="text-foreground">
        <span className="font-semibold">{poloAtivo}</span>
        <span className={cn(/* design-system-escape: mx-1.5 margin sem primitiva DS */ "mx-1.5 text-[10px] font-normal text-muted-foreground/65")}>vs</span>
        <span className="font-medium text-muted-foreground/80">{poloPassivo}</span>
      </Text>
      {/* Processo */}
      <Text
        variant="caption"
        as="div"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground"
      >
        <span>{audiencia.numeroProcesso}</span>
        {audiencia.classeJudicialDescricao && (
          <>
            <MetaDot />
            <span>{audiencia.classeJudicialDescricao}</span>
          </>
        )}
        <MetaDot />
        <span>
          {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
        </span>
        {orgaoJulgador && (
          <>
            <MetaDot />
            <span>{orgaoJulgador}</span>
          </>
        )}
        {audiencia.dataAutuacao && (
          <>
            <MetaDot />
            <span>
              Autuado em{' '}
              {format(parseISO(audiencia.dataAutuacao), 'dd MMM yyyy', { locale: ptBR })}
            </span>
          </>
        )}
      </Text>
    </div>
  ) : undefined;

  const heroNode =
    audiencia && !isLoading && !error ? (
      <div className={cn(/* design-system-escape: mx-5 margin sem primitiva DS; p-4 → migrar para <Inset variant="card-compact"> */ "mx-5 mt-3 rounded-xl border border-primary/15 bg-primary/5 p-4")}>
        {dataInicio && (
          <Text variant="caption" as="p" className="mb-3.5 capitalize text-muted-foreground">
            {format(dataInicio, 'EEE, dd MMM yyyy', { locale: ptBR })}
            {' · '}
            <span className="tabular-nums">{format(dataInicio, 'HH:mm')}</span>
          </Text>
        )}

        <div className={cn(/* design-system-escape: pb-3.5 padding direcional sem Inset equiv. */ "mb-3.5 grid grid-cols-2 gap-x-5 gap-y-2.5 border-b border-border/40 pb-3.5 sm:grid-cols-4")}>
          {/* Modalidade */}
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
            <Text variant="label" className="text-muted-foreground/80">
              Modalidade
            </Text>
            <Popover
              open={modalidadePopoverOpen && !modalidadePopoverDisabled}
              onOpenChange={(v) => !modalidadePopoverDisabled && setModalidadePopoverOpen(v)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={modalidadePopoverDisabled}
                  title={
                    !canEditGeneral
                      ? 'Você não tem permissão para editar audiências'
                      : undefined
                  }
                  className={cn(
                    /* design-system-escape: gap-1.5 gap sem token DS; pl-2.5 padding direcional sem Inset equiv.; pr-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ /* design-system-escape: gap-1.5 gap sem token DS; pl-2.5 padding direcional sem Inset equiv.; pr-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'inline-flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-card pl-2.5 pr-2 py-1 text-micro-caption font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                    !modalidadePopoverDisabled && 'cursor-pointer hover:border-border hover:bg-muted/60',
                    modalidadePopoverDisabled && 'cursor-not-allowed'
                  )}
                >
                  {savingModalidade ? (
                    <LoadingSpinner size="sm" className="text-muted-foreground" />
                  ) : (
                    <>
                      {audiencia.modalidade &&
                        React.createElement(MODALIDADE_ICONS[audiencia.modalidade], {
                          className: 'size-3 text-primary',
                        })}
                      <span>
                        {audiencia.modalidade
                          ? MODALIDADE_LABELS[audiencia.modalidade]
                          : 'Definir'}
                      </span>
                      {!modalidadePopoverDisabled && (
                        <ChevronDown className="size-3 text-muted-foreground/75" />
                      )}
                    </>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "w-44 rounded-xl p-1.5 glass-dropdown")} align="start">
                <Text
                  variant="overline"
                  as="p"
                  className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; pt-1 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-2 pt-1 pb-1.5 text-muted-foreground/75")}
                >
                  Modalidade
                </Text>
                {(Object.values(ModalidadeAudiencia) as ModalidadeAudiencia[]).map((m) => {
                  const Icon = MODALIDADE_ICONS[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleChangeModalidade(m)}
                      className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap=\"tight\">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-micro-caption transition-colors hover:bg-muted/60")}
                    >
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span>{MODALIDADE_LABELS[m]}</span>
                      {audiencia.modalidade === m && (
                        <Check className="ml-auto size-3 text-primary" />
                      )}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável */}
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
            <Text variant="label" className="text-muted-foreground/80">
              Responsável
            </Text>
            <AudienciaResponsavelPopover
              audienciaId={audiencia.id}
              responsavelId={audiencia.responsavelId}
              usuarios={usuarios}
              disabled={!canAssign}
              onSuccess={(a) => {
                if (a) setLocalAudiencia(a);
              }}
            >
              <ResponsavelTriggerContent
                responsavelId={audiencia.responsavelId}
                usuarios={usuarios}
                size="sm"
              />
            </AudienciaResponsavelPopover>
          </div>
        </div>

        {/* Ações */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex flex-wrap gap-1.5")}>
          {(isVirtual || isHibrida) && (
            audiencia.urlAudienciaVirtual ? (
              <Button
                size="sm"
                asChild
                className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv. */ "h-8 gap-1.5 rounded-lg px-3 text-caption")}
              >
                <a
                  href={audiencia.urlAudienciaVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="size-3" />
                  Entrar na sala virtual
                </a>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled
                className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv. */ "h-8 gap-1.5 rounded-lg px-3 text-caption")}
              >
                <Video className="size-3" />
                Entrar na sala virtual
              </Button>
            )
          )}
          {isPje ? (
            <Button
              size="sm"
              variant="outline"
              asChild
              className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv. */ "h-8 gap-1.5 rounded-lg px-3 text-caption")}
            >
              <a href={pjeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3" />
                Abrir no PJe
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled
              className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv. */ "h-8 gap-1.5 rounded-lg px-3 text-caption")}
            >
              <ExternalLink className="size-3" />
              Abrir no PJe
            </Button>
          )}
        </div>
      </div>
    ) : undefined;

  const splitAta =
    ataOpen && audiencia?.urlAtaAudiencia
      ? {
          open: true,
          content: (
            <>
              <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card")}>
                <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "flex items-center inline-tight text-label font-semibold")}>
                  <FileText className="size-3.5 text-success" />
                  Ata{' '}
                  {dataInicio && (
                    <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>
                      · {format(dataInicio, 'dd MMM yyyy', { locale: ptBR })}
                    </Text>
                  )}
                </div>
                <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                  <Button variant="ghost" size="sm" asChild className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "h-7 px-2 text-micro-caption")}>
                    <a href={audiencia.urlAtaAudiencia} target="_blank" rel="noopener noreferrer">
                      Baixar
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setAtaOpen(false)}
                    aria-label="Fechar PDF"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={audiencia.urlAtaAudiencia}
                  title="Ata da Audiência"
                  className="w-full h-full border-0"
                />
              </div>
            </>
          ),
        }
      : undefined;

  const isSplitOpen = !!splitAta?.open;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className={cn(
          " flex max-h-[90vh] w-[95vw] flex-col overflow-hidden p-0 gap-0",
          "[scrollbar-width:thin] transition-[max-width] duration-300 ease-out",
          isSplitOpen && "md:flex-row",
          isSplitOpen ? "sm:max-w-5xl md:max-w-6xl" : "sm:max-w-lg md:max-w-xl"
        )}
      >
        <DialogDescription className="sr-only">Detalhes da audiência</DialogDescription>
        <div className={cn("flex min-w-0 flex-1 flex-col min-h-0", isSplitOpen && "border-border/50 md:border-r")}>
          <DialogHeader className="shrink-0 gap-0 border-b border-border/40 px-5 pt-5 pb-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <DialogTitle className="min-w-0 flex-1 -tracking-[0.01em] text-foreground">
                {titleNode}
              </DialogTitle>
              {audiencia && <div className="shrink-0"><AudienciaStatusBadge status={audiencia.status} /></div>}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {metaNode && <div>{metaNode}</div>}
          </DialogHeader>
          {heroNode && <div data-slot="dialog-hero" className="shrink-0">{heroNode}</div>}
          <div data-slot="dialog-body" className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5 [scrollbar-width:thin]">
            {isLoading && (
              <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex items-center justify-center py-10")}>
                <LoadingSpinner className="size-6 text-muted-foreground" />
              </div>
            )}
            {error && !isLoading && (
              <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center inline-tight py-10 text-center")}>
                <AlertCircle className="size-6 text-destructive" />
                <Text variant="caption" className="text-destructive">{error}</Text>
              </div>
            )}

            {audiencia && !isLoading && !error && (
              <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
                {/* ATA · só quando existe */}
                {hasAta && (
                  <div>
                    <SectionHeader icon={FileText} label="Ata da Audiência" />
                    <button
                      type="button"
                      onClick={() => setAtaOpen((v) => !v)}
                      className={cn(/* design-system-escape: gap-3 gap sem token DS; p-2.5 → usar <Inset> */ "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-success/25 bg-success/8 p-2.5 text-left transition-colors hover:bg-success/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                    >
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/18 text-success">
                        <FileText className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Text variant="label" as="div" className="text-foreground">
                          Ata assinada · PDF
                        </Text>
                        <Text variant="micro-caption" as="div" className="text-muted-foreground">
                          Clique para {ataOpen ? 'fechar' : 'ler ao lado'}
                        </Text>
                      </div>
                      <ChevronRight
                        className={cn(
                          'size-4 text-muted-foreground transition-transform',
                          ataOpen && 'rotate-90'
                        )}
                      />
                    </button>
                  </div>
                )}

                {/* LOCAL / ACESSO — condicional por modalidade */}
                <div>
                  <SectionHeader icon={Building2} label="Local / Acesso" />
                  <SectionCard>
                    {(isVirtual || isHibrida) && (
                      <div className={isHibrida ? /* design-system-escape: pb-3 padding direcional sem Inset equiv. */ 'mb-3 pb-3 border-b border-border/40' : ''}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                            <Text variant="caption" as="span" className="text-muted-foreground">
                              Link da sala virtual
                            </Text>
                            {urlObrigatoriaFaltando && (
                              <span
                                className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 rounded-full bg-warning/12 px-1.5 py-px text-micro-badge font-semibold uppercase tracking-[0.08em] text-warning")}
                                role="status"
                                aria-label="Campo obrigatório não preenchido"
                              >
                                <AlertCircle className="size-2.5" />
                                Obrigatório
                              </span>
                            )}
                          </div>
                          {!editingUrl && canEditUrl && (
                            <button
                              type="button"
                              onClick={handleStartEditUrl}
                              className={cn(/* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "flex cursor-pointer items-center gap-1 text-micro-caption font-semibold uppercase tracking-wider text-primary/70 transition-colors hover:text-primary")}
                            >
                              <Pencil className="size-2.5" />
                              {audiencia.urlAudienciaVirtual ? 'Editar' : 'Adicionar'}
                            </button>
                          )}
                        </div>
                        {editingUrl ? (
                          <div className={cn("flex items-center inline-tight")}>
                            <Input
                              type="url"
                              placeholder="https://..."
                              value={urlDraft}
                              onChange={(e) => setUrlDraft(e.target.value)}
                              className={cn("h-8 text-caption flex-1")}
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 shrink-0"
                              onClick={handleSaveUrl}
                              disabled={savingUrl}
                            >
                              {savingUrl ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Check className="size-3.5 text-success" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 shrink-0"
                              onClick={() => setEditingUrl(false)}
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        ) : audiencia.urlAudienciaVirtual ? (
                          <div className={cn("flex items-center inline-tight min-w-0")}>
                            <Video className="size-3.5 text-muted-foreground/75 shrink-0" />
                            <a
                              href={audiencia.urlAudienciaVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-caption text-primary truncate hover:underline"
                            >
                              {audiencia.urlAudienciaVirtual}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 shrink-0"
                              onClick={() => handleCopyUrl(audiencia.urlAudienciaVirtual!)}
                            >
                              {copiedUrl ? (
                                <Check className="size-3.5 text-success" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Text variant="caption" className="text-muted-foreground/75 italic">
                            Nenhum link cadastrado
                          </Text>
                        )}
                      </div>
                    )}

                    {(isPresencial || isHibrida) && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                            <Text variant="caption" as="span" className="text-muted-foreground">
                              Endereço presencial
                            </Text>
                            {enderecoObrigatorioFaltando && (
                              <span
                                className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 rounded-full bg-warning/12 px-1.5 py-px text-micro-badge font-semibold uppercase tracking-[0.08em] text-warning")}
                                role="status"
                                aria-label="Campo obrigatório não preenchido"
                              >
                                <AlertCircle className="size-2.5" />
                                Obrigatório
                              </span>
                            )}
                          </div>
                          {!editingEndereco && canEditGeneral && (
                            <button
                              type="button"
                              onClick={handleStartEditEndereco}
                              className={cn(/* design-system-escape: gap-1 gap sem token DS; font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "flex cursor-pointer items-center gap-1 text-micro-caption font-semibold uppercase tracking-wider text-primary/70 transition-colors hover:text-primary")}
                            >
                              <Pencil className="size-2.5" />
                              {audiencia.enderecoPresencial ? 'Editar' : 'Adicionar'}
                            </button>
                          )}
                        </div>
                        {editingEndereco ? (
                          <div className={cn("stack-tight")}>
                            <div className={cn("grid grid-cols-[1fr_80px] inline-tight")}>
                              <Input
                                placeholder="Logradouro"
                                value={enderecoDraft.logradouro}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, logradouro: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                                autoFocus
                              />
                              <Input
                                placeholder="Nº"
                                value={enderecoDraft.numero}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, numero: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                            </div>
                            <div className={cn("grid grid-cols-2 inline-tight")}>
                              <Input
                                placeholder="Complemento"
                                value={enderecoDraft.complemento || ''}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, complemento: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                              <Input
                                placeholder="Bairro"
                                value={enderecoDraft.bairro}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, bairro: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                            </div>
                            <div className={cn("grid grid-cols-[1fr_60px_100px] inline-tight")}>
                              <Input
                                placeholder="Cidade"
                                value={enderecoDraft.cidade}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, cidade: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                              <Input
                                placeholder="UF"
                                maxLength={2}
                                value={enderecoDraft.uf}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({
                                    ...d,
                                    uf: e.target.value.toUpperCase(),
                                  }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                              <Input
                                placeholder="CEP"
                                value={enderecoDraft.cep}
                                onChange={(e) =>
                                  setEnderecoDraft((d) => ({ ...d, cep: e.target.value }))
                                }
                                className={cn("h-8 text-caption")}
                              />
                            </div>
                            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex justify-end gap-1.5 mt-1")}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingEndereco(false)}
                                className={cn("h-7 text-caption")}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveEndereco}
                                disabled={savingEndereco}
                                className={cn("h-7 text-caption")}
                              >
                                {savingEndereco && (
                                  <LoadingSpinner size="sm" className="mr-1" />
                                )}
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : audiencia.enderecoPresencial ? (
                          <Text variant="caption" className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-foreground/90 leading-relaxed")}>
                            {audiencia.enderecoPresencial.logradouro},{' '}
                            {audiencia.enderecoPresencial.numero}
                            {audiencia.enderecoPresencial.complemento &&
                              ` — ${audiencia.enderecoPresencial.complemento}`}
                            <br />
                            <span className="text-muted-foreground">
                              {audiencia.enderecoPresencial.bairro},{' '}
                              {audiencia.enderecoPresencial.cidade} —{' '}
                              {audiencia.enderecoPresencial.uf}
                              {audiencia.enderecoPresencial.cep &&
                                ` · CEP ${audiencia.enderecoPresencial.cep}`}
                            </span>
                          </Text>
                        ) : (
                          <Text variant="caption" className="text-muted-foreground/75 italic">
                            Nenhum endereço cadastrado
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Híbrida: quem é presencial? */}
                    {isHibrida && (
                      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-3 pt-3 border-t border-border/40")}>
                        <Text variant="caption" as="span" className="mb-2 block text-muted-foreground">
                          Quem participa presencialmente?
                        </Text>
                        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; p-1 → usar <Inset> */ "inline-flex gap-1 p-1 rounded-lg bg-muted/60 border border-border/40")}>
                          {(
                            [
                              { v: PresencaHibrida.Advogado, label: 'Advogados' },
                              { v: PresencaHibrida.Cliente, label: 'Clientes' },
                            ] as const
                          ).map(({ v, label }) => (
                            <button
                              key={v}
                              type="button"
                              disabled={presencaDisabled}
                              onClick={() => handleChangePresencaHibrida(v)}
                              title={
                                !canEditGeneral
                                  ? 'Você não tem permissão para editar audiências'
                                  : undefined
                              }
                              className={cn(
                                /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'rounded-md px-3 py-1 text-overline transition-colors',
                                audiencia.presencaHibrida === v
                                  ? 'bg-card text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground',
                                presencaDisabled && 'cursor-not-allowed opacity-60'
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-micro-caption mt-2 leading-relaxed text-muted-foreground/80")}>
                          Os demais participam por videoconferência.
                        </p>
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* INDICADORES */}
                {hasIndicadores && (
                  <div>
                    <SectionHeader icon={Clock} label="Indicadores" />
                    <SectionCard>
                      <AudienciaIndicadorBadges
                        audiencia={audiencia}
                        show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                      />
                    </SectionCard>
                  </div>
                )}

                {/* OBSERVAÇÕES — inline edit */}
                <div>
                  <SectionHeader
                    icon={MessageSquare}
                    label="Observações"
                    action={
                      !editingObs && canEditGeneral && (
                        <button
                          type="button"
                          onClick={handleStartEditObs}
                          className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; gap-1 gap sem token DS; tracking-wider sem token DS */ "flex cursor-pointer items-center gap-1 text-micro-caption font-semibold uppercase tracking-wider text-primary/70 transition-colors hover:text-primary")}
                        >
                          <Pencil className="size-2.5" />
                          {audiencia.observacoes ? 'Editar' : 'Adicionar'}
                        </button>
                      )
                    }
                  />
                  <SectionCard>
                    {editingObs ? (
                      <div className={cn("stack-tight")}>
                        <Textarea
                          placeholder="Anotações sobre a audiência..."
                          value={obsDraft}
                          onChange={(e) => setObsDraft(e.target.value)}
                          rows={3}
                          className={cn("text-body-sm")}
                          autoFocus
                        />
                        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex justify-end gap-1.5")}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingObs(false)}
                            className={cn("h-7 text-caption")}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveObs}
                            disabled={savingObs}
                            className={cn("h-7 text-caption")}
                          >
                            {savingObs && <LoadingSpinner size="sm" className="mr-1" />}
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : audiencia.observacoes ? (
                      <p className="text-caption text-foreground leading-relaxed whitespace-pre-wrap">
                        {audiencia.observacoes}
                      </p>
                    ) : (
                      <Text variant="caption" className="text-muted-foreground/75 italic">
                        Nenhuma observação registrada
                      </Text>
                    )}
                  </SectionCard>
                </div>

                {/* HISTÓRICO */}
                <div>
                  <SectionHeader icon={Clock} label="Histórico de Alterações" />
                  <AudienciaTimeline audienciaId={audiencia.id} audiencia={audiencia} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 border-t border-border/40 bg-card/40 px-5 py-2.5">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </div>
        {isSplitOpen && splitAta && (
          <aside className={cn(
            "w-full shrink-0 flex flex-col overflow-hidden bg-muted/30",
            "border-t border-border/50 md:border-t-0",
            "max-h-[50vh] md:max-h-none md:w-1/2"
          )}>
            {splitAta.content}
          </aside>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetaDot() {
  return (
    <span
      aria-hidden
      className="inline-block w-0.75 h-0.75 rounded-full bg-muted-foreground/60"
    />
  );
}
