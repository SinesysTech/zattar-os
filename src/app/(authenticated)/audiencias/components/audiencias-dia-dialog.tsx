'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Building2,
  Gavel,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconContainer } from '@/components/ui/icon-container';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { TabPills } from '@/components/dashboard/tab-pills';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';

import type { Audiencia } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '../domain';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from './audiencia-responsavel-popover';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasDiaDialogProps {
  audiencias: Audiencia[];
  data: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// =============================================================================
// TIPOS
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatarHora = (dataISO: string): string => {
  try {
    return format(new Date(dataISO), 'HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
};


// =============================================================================
// AUDIÊNCIA CONTENT — flat layout, no nested containers
// =============================================================================

function AudienciaContent({
  audiencia,
  usuarios,
  onSuccess,
}: {
  audiencia: Audiencia;
  usuarios: Usuario[];
  onSuccess?: () => void;
}) {
  const [activeTab, setActiveTab] = React.useState<string>('detalhes');
  const { logs, isLoading: loadingLogs } = useAuditLogs('audiencias', audiencia.id);

  return (
    <>
      {/* ── Processo + Status ── */}
      <div className={cn("flex items-start justify-between inline-medium mb-1")}>
        <div className="flex-1 min-w-0">
          <div
            className={cn(/* design-system-escape: tracking-tight sem token DS */ "text-label font-semibold tabular-nums tracking-tight truncate")}
            title={audiencia.numeroProcesso}
          >
            {audiencia.numeroProcesso}
          </div>
        </div>
        <AudienciaStatusBadge status={audiencia.status} />
      </div>

      {/* ── Badges + meta inline ── */}
      <div className={cn("flex items-center inline-tight flex-wrap mb-5")}>
        <SemanticBadge category="tribunal" value={audiencia.trt} className="text-micro-badge">
          {audiencia.trt}
        </SemanticBadge>
        <SemanticBadge category="grau" value={audiencia.grau} className="text-micro-badge">
          {GRAU_TRIBUNAL_LABELS[audiencia.grau] || audiencia.grau}
        </SemanticBadge>
        <span className="text-muted-foreground/55">|</span>
        <div className={cn("flex items-center inline-snug")}>
          <Clock className="size-3.5 text-muted-foreground/70" />
          <span className="text-label tabular-nums">
            {formatarHora(audiencia.dataInicio)}
            {audiencia.dataFim && ` – ${formatarHora(audiencia.dataFim)}`}
          </span>
        </div>
        {audiencia.modalidade && (
          <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
        )}
      </div>

      {/* ── Tabs ── */}
      <TabPills
        tabs={[
          { id: 'detalhes', label: 'Detalhes' },
          { id: 'historico', label: 'Histórico' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'detalhes' && (
        <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "mt-5 space-y-5")}>
          {/* Tipo */}
          {audiencia.tipoDescricao && (
            <div>
              <div className="text-meta-label mb-1">Tipo</div>
              <span className="text-label">{audiencia.tipoDescricao}</span>
            </div>
          )}

          {/* Local */}
          {(audiencia.salaAudienciaNome || audiencia.urlAudienciaVirtual) && (
            <div>
              <div className="text-meta-label mb-1">Local</div>
              <div className={cn("flex items-center inline-snug text-body-sm")}>
                {audiencia.modalidade === 'presencial' ? (
                  <Building2 className="size-3.5 text-muted-foreground/70 shrink-0" />
                ) : (
                  <Video className="size-3.5 text-muted-foreground/70 shrink-0" />
                )}
                {audiencia.salaAudienciaNome && (
                  <span className="text-label">{audiencia.salaAudienciaNome}</span>
                )}
                {audiencia.urlAudienciaVirtual && (
                  <a
                    href={audiencia.urlAudienciaVirtual}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-primary hover:underline inline-flex items-center inline-micro")}
                  >
                    Entrar na sala
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Partes — grid simples, sem boxes */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div>
              <div className="text-meta-label mb-1">Polo Ativo</div>
              <div className="text-label truncate" title={audiencia.poloAtivoNome || ''}>
                {audiencia.poloAtivoNome || '—'}
              </div>
            </div>
            <div>
              <div className="text-meta-label mb-1">Polo Passivo</div>
              <div className="text-label truncate" title={audiencia.poloPassivoNome || ''}>
                {audiencia.poloPassivoNome || '—'}
              </div>
            </div>
          </div>

          {/* Responsável — inline popover */}
          <div>
            <div className="text-meta-label mb-1.5">Responsável</div>
            <AudienciaResponsavelPopover
              audienciaId={audiencia.id}
              responsavelId={audiencia.responsavelId}
              usuarios={usuarios}
              onSuccess={() => onSuccess?.()}
            >
              <ResponsavelTriggerContent
                responsavelId={audiencia.responsavelId}
                usuarios={usuarios}
                size="md"
              />
            </AudienciaResponsavelPopover>
          </div>

          {/* Observações */}
          {audiencia.observacoes && (
            <div>
              <div className="text-meta-label mb-1.5">Observações</div>
              <p className={cn("text-caption whitespace-pre-wrap leading-relaxed")}>
                {audiencia.observacoes}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="mt-4">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-100" />
        </div>
      )}
    </>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasDiaDialog({
  audiencias,
  data,
  open,
  onOpenChange,
  onSuccess,
}: AudienciasDiaDialogProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { usuarios } = useUsuarios({ enabled: open });

  React.useEffect(() => {
    if (open) setCurrentIndex(0);
  }, [open, audiencias]);

  const total = audiencias.length;
  const audienciaAtual = audiencias[currentIndex];

  const handlePrevious = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleNext = () =>
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : prev));

  const dataFormatada = format(data, "EEEE, dd 'de' MMMM", { locale: ptBR });

  if (!audienciaAtual) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: p-0 → usar <Inset>; gap-0 gap sem token DS */ "sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden")}>
        <DialogDescription className="sr-only">Audiências do dia</DialogDescription>
        <DialogHeader className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; pt-5 padding direcional sem Inset equiv.; pb-4 padding direcional sem Inset equiv. */ "shrink-0 gap-0 px-6 pt-5 pb-4 border-b border-border/40")}>
          <div className={cn("flex items-center justify-between inline-medium")}>
            <div className={cn("flex items-center inline-medium min-w-0")}>
              <IconContainer size="md" className="bg-primary/10 shrink-0">
                <Gavel className="size-4 text-primary" />
              </IconContainer>
              <div className="min-w-0">
                <DialogTitle className="text-card-title capitalize truncate">{dataFormatada}</DialogTitle>
                <p className="text-widget-sub mt-0.5">
                  {total} audiência{total > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Navegação inline no header */}
            {total > 1 && (
              <div className={cn("flex items-center inline-micro shrink-0")}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-widget-sub tabular-nums w-8 text-center">
                  {currentIndex + 1}/{total}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleNext}
                  disabled={currentIndex === total - 1}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* ── BODY — conteúdo direto, sem cards aninhados ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className={cn("px-6 py-5")}>
            <AudienciaContent
              audiencia={audienciaAtual}
              usuarios={usuarios}
              onSuccess={onSuccess}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
