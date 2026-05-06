'use client';

/**
 * PericiaDetalhesDialog — Glass Dialog de detalhes da perícia
 * ============================================================================
 * Exibe uma perícia (modo detalhe) ou lista de perícias do dia (modo lista).
 * Migrado de DetailSheet para Dialog + GlassPanel (alinhado ao Glass Briefing).
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Calendar as CalendarIcon,
  ClipboardList,
  Clock,
  FileCheck2,
  ListTodo,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassPanel } from '@/components/shared/glass-panel';

import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';

import type { Pericia } from '../domain';
import { SITUACAO_PERICIA_LABELS } from '../domain';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

interface PericiaDetalhesDialogProps {
  pericia: Pericia | null;
  pericias?: Pericia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatarData(dataISO: string | null): string {
  if (!dataISO) return '-';
  try {
    return format(new Date(dataISO), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// =============================================================================
// INTERNAL COMPONENTS (substitutos para primitivos DetailSheet)
// =============================================================================

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("stack-tight")}>
      <header className={cn("flex items-center inline-tight")}>
        {icon}
        <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70")}>
          {title}
        </h3>
      </header>
      <div className={cn(/* design-system-escape: pl-5.5 padding direcional sem Inset equiv. */ "pl-5.5")}>{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(/* design-system-escape: py-1.5 padding direcional sem Inset equiv. */ "grid grid-cols-[120px_1fr] inline-medium py-1.5 text-body-sm")}>
      <dt className="text-[12px] text-muted-foreground/60">{label}</dt>
      <dd className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>{children}</dd>
    </div>
  );
}

function MetaItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col inline-micro min-w-0")}>
      <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[10px] uppercase tracking-wider text-muted-foreground/55")}>
        {label}
      </span>
      <div className={cn("flex items-center inline-snug text-body-sm")}>{children}</div>
    </div>
  );
}

// =============================================================================
// LIST ITEM (modo lista de perícias do dia)
// =============================================================================

function PericiaListItem({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  return (
    <GlassPanel depth={1} className={cn("inset-card-compact mb-3")}>
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className={cn(/* design-system-escape: p-1 → usar <Inset> */ "grid w-full grid-cols-2 mb-4 bg-muted/40 p-1")}>
          <TabsTrigger value="detalhes" className="rounded-md">
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-md">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className={cn("stack-default mt-0")}>
          <div className={cn("flex items-start justify-between inline-medium")}>
            <div className="min-w-0">
              <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-body-sm font-semibold tabular-nums tracking-tight text-foreground truncate")}>
                {pericia.numeroProcesso}
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                {pericia.trt} • {pericia.grau}
              </div>
            </div>
            <div className="shrink-0">
              <SemanticBadge
                category="pericia_situacao"
                value={pericia.situacaoCodigo}
              >
                {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
              </SemanticBadge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">
                Prazo Entrega
              </div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>
                {formatarData(pericia.prazoEntrega)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">
                Laudo Juntado
              </div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>
                {pericia.laudoJuntado ? 'Sim' : 'Não'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">
                Especialidade
              </div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>
                {pericia.especialidade?.descricao || '-'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground/60 mb-0.5">
                Perito
              </div>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>
                {pericia.perito?.nome || '-'}
              </div>
            </div>
          </div>

          {pericia.observacoes && (
            <GlassPanel depth={1} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "p-3 bg-muted/20")}>
              <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "font-semibold text-foreground/70 mb-1 text-[11px] uppercase tracking-wider")}>
                Observações
              </div>
              <Text variant="caption" className="whitespace-pre-wrap text-foreground/80">
                {pericia.observacoes}
              </Text>
            </GlassPanel>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline
            logs={logs || []}
            isLoading={loadingLogs}
            className="h-62.5"
          />
        </TabsContent>
      </Tabs>
    </GlassPanel>
  );
}

// =============================================================================
// SINGLE DETAILS (modo perícia única)
// =============================================================================

function PericiaSingleDetails({ pericia }: { pericia: Pericia }) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('pericias', pericia.id);

  const responsavelNome = pericia.responsavel?.nomeExibicao || 'Sem responsável';
  const responsavelAvatar = (pericia.responsavel as { avatarUrl?: string })
    ?.avatarUrl;

  return (
    <div className={cn(/* design-system-escape: pb-6 padding direcional sem Inset equiv. */ "stack-loose pb-6")}>
      {/* Meta Grid */}
      <GlassPanel depth={1} className={cn("inset-card-compact bg-muted/20")}>
        <div className={cn("grid grid-cols-3 inline-medium")}>
          <MetaItem label="Prazo">
            <CalendarIcon className="size-3.5 text-muted-foreground/50" />
            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "tabular-nums font-medium text-foreground/90")}>
              {formatarData(pericia.prazoEntrega)}
            </span>
          </MetaItem>
          <MetaItem label="Laudo Juntado">
            <FileCheck2 className="size-3.5 text-muted-foreground/50" />
            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/90")}>
              {pericia.laudoJuntado ? 'Sim' : 'Não'}
            </span>
          </MetaItem>
          <MetaItem label="Responsável">
            <Avatar size="xs">
              <AvatarImage src={responsavelAvatar || undefined} alt={responsavelNome} />
              <AvatarFallback className="text-[9px]">
                {getInitials(responsavelNome)}
              </AvatarFallback>
            </Avatar>
            <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "truncate font-medium text-foreground/90")}>
              {responsavelNome}
            </span>
          </MetaItem>
        </div>
      </GlassPanel>

      <Section
        icon={<ClipboardList className="size-3.5 text-muted-foreground/50" />}
        title="Dados da Perícia"
      >
        <InfoRow label="Especialidade">
          {pericia.especialidade?.descricao || '-'}
        </InfoRow>
        <InfoRow label="Perito">{pericia.perito?.nome || '-'}</InfoRow>
      </Section>

      <Section
        icon={<Building2 className="size-3.5 text-muted-foreground/50" />}
        title="Processo"
      >
        <div className={cn("stack-nano")}>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-tight sem token DS */ "block text-body-sm font-semibold tabular-nums tracking-tight text-foreground")}>
            {pericia.numeroProcesso}
          </span>
          <span className="block text-[11px] text-muted-foreground/60 mt-1">
            {pericia.trt} • {pericia.grau}
          </span>
        </div>
      </Section>

      {pericia.observacoes && (
        <Section
          icon={<ListTodo className="size-3.5 text-muted-foreground/50" />}
          title="Observações"
        >
          <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-body-sm text-foreground/80 whitespace-pre-wrap leading-relaxed")}>
            {pericia.observacoes}
          </p>
        </Section>
      )}

      <Section
        icon={<Clock className="size-3.5 text-muted-foreground/50" />}
        title="Histórico de Modificações"
      >
        <AuditLogTimeline
          logs={logs || []}
          isLoading={loadingLogs}
          className="h-62.5"
        />
      </Section>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PericiaDetalhesDialog({
  pericia,
  pericias,
  open,
  onOpenChange,
  titulo,
}: PericiaDetalhesDialogProps) {
  const exibirLista = (pericias?.length ?? 0) > 0;
  const periciaUnica = !exibirLista ? pericia : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className={cn("flex items-start inline-medium")}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="size-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn("flex items-center inline-tight flex-wrap")}>
                <DialogTitle>
                  {titulo ||
                    (exibirLista ? 'Perícias do Dia' : 'Detalhes da Perícia')}
                </DialogTitle>
                {periciaUnica && (
                  <SemanticBadge
                    category="pericia_situacao"
                    value={periciaUnica.situacaoCodigo}
                  >
                    {SITUACAO_PERICIA_LABELS[periciaUnica.situacaoCodigo]}
                  </SemanticBadge>
                )}
              </div>
              {periciaUnica?.dataCriacao && (
                <DialogDescription>
                  Criada em {formatarData(periciaUnica.dataCriacao)}
                </DialogDescription>
              )}
              {exibirLista && (
                <DialogDescription>
                  {pericias!.length} perícia{pericias!.length !== 1 ? 's' : ''} nesta data
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; pt-2 padding direcional sem Inset equiv. */ "flex-1 overflow-y-auto px-1 pt-2")}>
          {exibirLista ? (
            <div className={cn("stack-micro")}>
              {pericias!.map((p) => (
                <PericiaListItem key={p.id} pericia={p} />
              ))}
            </div>
          ) : periciaUnica ? (
            <PericiaSingleDetails pericia={periciaUnica} />
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
