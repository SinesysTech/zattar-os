'use client';

import * as React from 'react';
import {
  Gavel,
  Clock,
  ExternalLink,
  Copy,
  Pencil,
  MapPin,
  Video,
  FileText,
  Building2,
  Loader2,
  Check,
  AlertCircle,
  Scale,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Landmark,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconContainer } from '@/components/ui/icon-container';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ParteBadge } from '@/components/ui/parte-badge';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { PrepScore } from './prep-score';
import { AudienciaIndicadorBadges } from './audiencia-indicador-badges';
import { AudienciaTimeline } from './audiencia-timeline';
import { EditarAudienciaDialog } from './editar-audiencia-dialog';
import { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';
import {
  type Audiencia,
  GRAU_TRIBUNAL_LABELS,
  TRT_NOMES,
  isAudienciaCapturada,
  buildPjeUrl,
} from '../domain';
import { actionBuscarAudienciaPorId } from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// =============================================================================
// SECTION HEADER — ícone + label uppercase (padrão do POC)
// =============================================================================

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
    <div className="flex items-center justify-between mb-3">
      <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
        <Icon className="size-3.5 text-muted-foreground/40" />
        {label}
      </h4>
      {action}
    </div>
  );
}

// =============================================================================
// SECTION CARD — glass-card-light (fundo opaco suave)
// =============================================================================

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] bg-muted/40 border border-border/[0.06] p-[18px_20px] ${className ?? ''}`}>
      {children}
    </div>
  );
}

// =============================================================================
// TYPES
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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isAlterarResponsavelOpen, setIsAlterarResponsavelOpen] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const { usuarios } = useUsuarios();

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

    return () => { cancelled = true; };
  }, [audienciaId, shouldFetch, open]);

  const audiencia = audienciaProp || fetchedAudiencia;
  const isPje = audiencia ? isAudienciaCapturada(audiencia) : false;
  const pjeUrl = audiencia ? buildPjeUrl(audiencia.trt, audiencia.numeroProcesso) : '';
  const hasAta = !!(audiencia?.urlAtaAudiencia);

  const dataInicio = audiencia ? parseISO(audiencia.dataInicio) : null;
  const dataFim = audiencia ? parseISO(audiencia.dataFim) : null;

  const getResponsavelNome = React.useCallback(
    (responsavelId: number | null | undefined) => {
      if (!responsavelId) return null;
      const usuario = usuarios.find((u) => u.id === responsavelId);
      return usuario?.nomeExibicao || usuario?.nomeCompleto || `Usuário ${responsavelId}`;
    },
    [usuarios],
  );

  const responsavelNome = audiencia ? getResponsavelNome(audiencia.responsavelId) : null;
  const responsavelAvatar = audiencia?.responsavelId
    ? usuarios.find((u) => u.id === audiencia.responsavelId)?.avatarUrl ?? null
    : null;

  const handleCopyUrl = React.useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // silencioso
    }
  }, []);

  const hasIndicadores = audiencia && (
    audiencia.segredoJustica ||
    audiencia.juizoDigital ||
    audiencia.designada ||
    audiencia.documentoAtivo
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[780px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden [scrollbar-width:thin]"
          showCloseButton
        >
          {/* ══ HEADER (fixo) ══ */}
          <div className="shrink-0" style={{ padding: '24px 28px 0' }}>
            {/* Título + Badge */}
            <div className="flex items-start gap-3.5 mb-4">
              <IconContainer size="lg" className="bg-primary/10 shrink-0 mt-0.5">
                <Gavel className="size-5 text-primary" />
              </IconContainer>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <DialogTitle className="text-[17px] font-bold text-foreground">
                    {audiencia?.tipoDescricao || 'Audiência'}
                  </DialogTitle>
                  {audiencia && <AudienciaStatusBadge status={audiencia.status} />}
                </div>
                {dataInicio && (
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 capitalize">
                    {format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {/* Meta strip — card opaco horizontal com separadores verticais */}
            {audiencia && !isLoading && !error && (
              <SectionCard className="flex gap-0 mb-4">
                {/* Horário */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Horário</span>
                  <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Clock className="size-3.5 text-muted-foreground/40" />
                    {dataInicio && dataFim && (
                      <span className="tabular-nums">
                        {format(dataInicio, 'HH:mm')} – {format(dataFim, 'HH:mm')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Modalidade */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Modalidade</span>
                  <div className="mt-1">
                    <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
                  </div>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Tribunal */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Tribunal</span>
                  <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Landmark className="size-3.5 text-muted-foreground/40" />
                    <span className="truncate">{TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}</span>
                  </span>
                </div>
                <div className="w-px bg-border/40 mx-4" />
                {/* Responsável */}
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-[0.05em] block">Responsável</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {audiencia.responsavelId && responsavelNome ? (
                      <>
                        <Avatar size="xs">
                          <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
                          <AvatarFallback className="text-[9px] font-bold">
                            {getInitials(responsavelNome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13.5px] font-medium text-foreground truncate">{responsavelNome}</span>
                      </>
                    ) : (
                      <span className="text-[13.5px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Botões de ação */}
            {audiencia && (
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                <Button
                  asChild={!!audiencia.urlAudienciaVirtual}
                  disabled={!audiencia.urlAudienciaVirtual}
                >
                  {audiencia.urlAudienciaVirtual ? (
                    <a href={audiencia.urlAudienciaVirtual} target="_blank" rel="noopener noreferrer">
                      <Video className="size-4" />
                      Entrar na Sala Virtual
                    </a>
                  ) : (
                    <>
                      <Video className="size-4" />
                      Entrar na Sala Virtual
                    </>
                  )}
                </Button>

                {hasAta && (
                  <Button variant="outline" asChild>
                    <a href={audiencia.urlAtaAudiencia!} target="_blank" rel="noopener noreferrer">
                      <FileText className="size-4" />
                      Visualizar Ata
                    </a>
                  </Button>
                )}

                <Button variant="outline" asChild={isPje} disabled={!isPje}>
                  {isPje ? (
                    <a href={pjeUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-4" />
                      Abrir PJe
                    </a>
                  ) : (
                    <>
                      <ExternalLink className="size-4" />
                      Abrir PJe
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="h-px bg-border/20" />
          </div>

          {/* ══ BODY (scrollável) ══ */}
          <div className="flex-1 overflow-y-auto px-7 py-5 [scrollbar-width:thin]">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {audiencia && !isLoading && !error && (
              <div className="space-y-5">
                {/* ── Processo Vinculado ── */}
                <div>
                  <SectionHeader icon={ClipboardList} label="Processo Vinculado" />
                  <SectionCard>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-semibold text-foreground tabular-nums">
                          {audiencia.numeroProcesso}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {TRT_NOMES[audiencia.trt] || audiencia.trt} · {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-border/20 my-3" />
                    <div className="flex gap-6">
                      <div>
                        <ParteBadge polo="ATIVO" truncate maxWidth="250px">
                          {audiencia.poloAtivoOrigem || audiencia.poloAtivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloAtivoRepresentaVarios && (
                          <span className="text-[10px] text-muted-foreground ml-1">e outros</span>
                        )}
                      </div>
                      <div>
                        <ParteBadge polo="PASSIVO" truncate maxWidth="250px">
                          {audiencia.poloPassivoOrigem || audiencia.poloPassivoNome || '—'}
                        </ParteBadge>
                        {audiencia.poloPassivoRepresentaVarios && (
                          <span className="text-[10px] text-muted-foreground ml-1">e outros</span>
                        )}
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* ── Local / Acesso ── */}
                {(audiencia.urlAudienciaVirtual || audiencia.enderecoPresencial) && (
                  <div>
                    <SectionHeader icon={Building2} label="Local / Acesso" />
                    <SectionCard>
                      <div className="space-y-2.5">
                        {(audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida') && audiencia.urlAudienciaVirtual && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Video className="size-3.5 text-muted-foreground/40 shrink-0" />
                            <a
                              href={audiencia.urlAudienciaVirtual}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-primary truncate hover:underline"
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
                        )}

                        {(audiencia.modalidade === 'presencial' || audiencia.modalidade === 'hibrida') && audiencia.enderecoPresencial && (
                          <div className="flex items-start gap-2">
                            <MapPin className="size-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <p className="text-[13px] text-foreground/80 leading-relaxed">
                              {audiencia.enderecoPresencial.logradouro}, {audiencia.enderecoPresencial.numero}
                              {audiencia.enderecoPresencial.complemento && ` – ${audiencia.enderecoPresencial.complemento}`}
                              <br />
                              <span className="text-muted-foreground">
                                {audiencia.enderecoPresencial.bairro}, {audiencia.enderecoPresencial.cidade} – {audiencia.enderecoPresencial.uf}
                              </span>
                            </p>
                          </div>
                        )}

                        {audiencia.presencaHibrida !== null && (
                          <AudienciaIndicadorBadges
                            audiencia={audiencia}
                            show={['presenca_hibrida']}
                            showPresencaDetail
                          />
                        )}
                      </div>
                    </SectionCard>
                  </div>
                )}

                {/* ── Indicadores ── */}
                {hasIndicadores && (
                  <div>
                    <SectionHeader icon={Scale} label="Indicadores" />
                    <SectionCard>
                      <AudienciaIndicadorBadges
                        audiencia={audiencia}
                        show={['segredo_justica', 'juizo_digital', 'designada', 'documento_ativo']}
                      />
                    </SectionCard>
                  </div>
                )}

                {/* ── Preparo ── */}
                <div>
                  <SectionHeader icon={ShieldCheck} label="Preparo" />
                  <SectionCard>
                    <PrepScore audiencia={audiencia} showBreakdown size="lg" />
                  </SectionCard>
                </div>

                {/* ── Observações ── */}
                {audiencia.observacoes && (
                  <div>
                    <SectionHeader icon={MessageSquare} label="Observações" />
                    <SectionCard>
                      <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {audiencia.observacoes}
                      </p>
                    </SectionCard>
                  </div>
                )}

                {/* ── Histórico ── */}
                <div>
                  <SectionHeader icon={Clock} label="Histórico de Alterações" />
                  <AudienciaTimeline audienciaId={audiencia.id} audiencia={audiencia} />
                </div>
              </div>
            )}
          </div>

          {/* ══ FOOTER (fixo) ══ */}
          <div className="shrink-0 px-7 py-4 border-t border-border/20 flex items-center justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {audiencia && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAlterarResponsavelOpen(true)}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {audiencia && (
        <EditarAudienciaDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            onOpenChange(false);
          }}
          audiencia={audiencia}
        />
      )}

      {audiencia && (
        <AudienciasAlterarResponsavelDialog
          open={isAlterarResponsavelOpen}
          onOpenChange={setIsAlterarResponsavelOpen}
          audiencia={audiencia}
          usuarios={usuarios}
          onSuccess={() => {
            setIsAlterarResponsavelOpen(false);
          }}
        />
      )}
    </>
  );
}
