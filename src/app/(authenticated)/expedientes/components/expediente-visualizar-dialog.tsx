'use client';

/**
 * ExpedienteVisualizarDialog — Dialog de detalhes do expediente com edição inline.
 * ============================================================================
 * Abre quando o usuário clica num item em qualquer view (lista, quadro,
 * semana, mês, ano). Campos editáveis (tipo, descrição, observações,
 * responsável, prazo) usam os popovers/editores inline compartilhados —
 * mesmo padrão presente nos cards do quadro e na coluna da lista.
 * Campos de processo, partes, órgão e auditoria permanecem read-only.
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Calendar,
  FileText,
  Users,
  Building2,
  Scale,
  AlertCircle,
  AlertTriangle,
  } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Heading,
  Text } from '@/components/ui/typography';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import {
  Expediente,
  GrauTribunal,
  GRAU_TRIBUNAL_LABELS,
  getExpedientePartyNames,
} from '../domain';
import { actionBuscarExpediente } from '../actions';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import {
  ExpedienteResponsavelPopover,
  ResponsavelTriggerContent,
} from './expediente-responsavel-popover';
import {
  ExpedienteTipoPopover,
  TipoTriggerContent,
} from './expediente-tipo-popover';
import {
  ExpedientePrazoPopover,
  PrazoTriggerContent,
} from './expediente-prazo-popover';
import { ExpedienteTextEditor } from './expediente-text-editor';

// =============================================================================
// TYPES
// =============================================================================

interface ExpedienteVisualizarDialogProps {
  expediente: Expediente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    return new Date(dataISO).toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    return new Date(dataISO).toLocaleString('pt-BR');
  } catch {
    return '-';
  }
};

const formatarGrau = (grau: GrauTribunal): string =>
  GRAU_TRIBUNAL_LABELS[grau] || grau;

// =============================================================================
// INTERNAL LAYOUT COMPONENTS
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
    <section className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
      <header className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
        <span className="text-muted-foreground/70">{icon}</span>
        <Text
          variant="overline"
          as="h3"
          className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold text-muted-foreground/70")}
        >
          {title}
        </Text>
      </header>
      <div className="rounded-xl border border-border/30 bg-card divide-y divide-border/20">
        {children}
      </div>
    </section>
  );
}

function DataRow({
  label,
  children,
  editable = false,
}: {
  label: string;
  children: React.ReactNode;
  editable?: boolean;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-start justify-between gap-3 px-3 py-2")}>
      <Text
        variant="caption"
        as="dt"
        className={cn(
          'shrink-0 text-muted-foreground/65',
          editable && /* design-system-escape: pt-1 padding direcional sem Inset equiv. */ 'pt-1',
        )}
      >
        {label}
      </Text>
      <dd
        className={cn(
          'min-w-0',
          editable
            ? 'flex-1 flex justify-end'
            : /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-right text-body-sm font-medium text-foreground/90',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <DataRow label={label}>{children}</DataRow>
);

const EditableRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <DataRow label={label} editable>{children}</DataRow>
);

function Separator() {
  return <hr className="border-border/20" />;
}

function MetaGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ "grid grid-cols-3 gap-3 rounded-xl border border-border/30 bg-muted/20 p-4")}>
      {children}
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
    <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1 min-w-0")}>
      <Text variant="micro-caption" className={cn(/* design-system-escape: tracking-wider sem token DS */ "uppercase tracking-wider text-muted-foreground/55")}>
        {label}
      </Text>
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 text-body-sm")}>{children}</div>
    </div>
  );
}

function Audit({
  createdAt,
  updatedAt,
}: {
  createdAt: string | null;
  updatedAt: string | null;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS; pt-3 padding direcional sem Inset equiv. */ "flex items-center justify-between gap-3 pt-3 text-muted-foreground/55")}>
      <Text variant="micro-caption">Criado em {formatarDataHora(createdAt)}</Text>
      <Text variant="micro-caption">Atualizado em {formatarDataHora(updatedAt)}</Text>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExpedienteVisualizarDialog({
  expediente,
  open,
  onOpenChange,
  onSuccess,
}: ExpedienteVisualizarDialogProps) {
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });

  // Estado interno para refletir as edições inline imediatamente — o dialog é
  // autossuficiente para mostrar o resultado das próprias edições, sem depender
  // do caller passar onSuccess corretamente. A prop `expediente` continua sendo
  // a fonte da verdade ao (re)abrir/trocar registro.
  const [displayExpediente, setDisplayExpediente] = React.useState(expediente);

  React.useEffect(() => {
    setDisplayExpediente(expediente);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ressincroniza só ao trocar registro; edições inline gerenciam o state local
  }, [expediente?.id]);

  const handleEditSuccess = React.useCallback(async () => {
    if (displayExpediente?.id) {
      const result = await actionBuscarExpediente(displayExpediente.id);
      if (result.success && result.data) {
        setDisplayExpediente(result.data);
      }
    }
    onSuccess?.();
  }, [displayExpediente?.id, onSuccess]);

  if (!expediente || !displayExpediente) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          data-density="comfortable"
          className="sm:max-w-2xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
            <DialogTitle>Expediente</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS; px-6 padding direcional sem Inset equiv.; py-12 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center")}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
                <AlertTriangle className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <Heading level="card" className={cn("text-body")}>
                Expediente não encontrado
              </Heading>
              <p className={cn("text-body-sm text-muted-foreground max-w-sm")}>
                Os detalhes do expediente não estão disponíveis.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const partes = getExpedientePartyNames(displayExpediente);

  const statusBadge = (
    <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
      <SemanticBadge
        category="status"
        value={displayExpediente.baixadoEm ? 'BAIXADO' : 'PENDENTE'}
        variantOverride={displayExpediente.baixadoEm ? 'neutral' : 'default'}
        toneOverride="soft"
      >
        {displayExpediente.baixadoEm ? 'Baixado' : 'Pendente'}
      </SemanticBadge>
      {displayExpediente.prazoVencido && !displayExpediente.baixadoEm && (
        <SemanticBadge
          category="status"
          value="PRAZO_VENCIDO"
          variantOverride="destructive"
          toneOverride="soft"
        >
          Prazo Vencido
        </SemanticBadge>
      )}
    </div>
  );

  const dialogTitle = (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-start justify-between gap-3")}>
      <div className="flex-1 min-w-0">
        <Heading level="card" as="h2" className="truncate">
          {displayExpediente.classeJudicial
            ? `${displayExpediente.classeJudicial} ${displayExpediente.numeroProcesso}`
            : displayExpediente.numeroProcesso}
        </Heading>
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-1 flex-wrap text-muted-foreground/65")}>
          <Scale className="h-3.5 w-3.5" />
          <Text variant="caption">{displayExpediente.trt}</Text>
          <Text variant="caption">·</Text>
          <Text variant="caption">{formatarGrau(displayExpediente.grau)}</Text>
          {displayExpediente.dataCriacaoExpediente && (
            <>
              <Text variant="caption">·</Text>
              <Calendar className="h-3.5 w-3.5" />
              <Text variant="caption">
                {formatarData(displayExpediente.dataCriacaoExpediente)}
              </Text>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0">{statusBadge}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-4xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle asChild>
            <div>{dialogTitle}</div>
          </DialogTitle>
          <DialogDescription className="sr-only">Detalhes e edição rápida do expediente</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin] space-y-4">
          <>
            {/* Edição rápida — popovers/inline em todos os campos editáveis */}
            <Section icon={<FileText className="h-4 w-4" />} title="Edição rápida">
              <EditableRow label="Tipo">
                <ExpedienteTipoPopover
                  expedienteId={displayExpediente.id}
                  tipoExpedienteId={displayExpediente.tipoExpedienteId}
                  tiposExpedientes={tiposExpedientes}
                  onSuccess={handleEditSuccess}
                  align="end"
                >
                  <TipoTriggerContent
                    tipoExpedienteId={displayExpediente.tipoExpedienteId}
                    tiposExpedientes={tiposExpedientes}
                    size="md"
                  />
                </ExpedienteTipoPopover>
              </EditableRow>
              <EditableRow label="Responsável">
                <ExpedienteResponsavelPopover
                  expedienteId={displayExpediente.id}
                  responsavelId={displayExpediente.responsavelId}
                  usuarios={usuarios}
                  onSuccess={handleEditSuccess}
                  align="end"
                >
                  <ResponsavelTriggerContent
                    responsavelId={displayExpediente.responsavelId}
                    usuarios={usuarios}
                    size="md"
                  />
                </ExpedienteResponsavelPopover>
              </EditableRow>
              <EditableRow label="Prazo legal">
                <ExpedientePrazoPopover
                  expedienteId={displayExpediente.id}
                  dataPrazoLegalParte={displayExpediente.dataPrazoLegalParte}
                  onSuccess={handleEditSuccess}
                  align="end"
                >
                  <PrazoTriggerContent
                    dataPrazoLegalParte={displayExpediente.dataPrazoLegalParte}
                    size="md"
                    vencido={displayExpediente.prazoVencido && !displayExpediente.baixadoEm}
                  />
                </ExpedientePrazoPopover>
              </EditableRow>
              <EditableRow label="Descrição / arquivos">
                <ExpedienteTextEditor
                  expedienteId={displayExpediente.id}
                  field="descricaoArquivos"
                  value={displayExpediente.descricaoArquivos}
                  title="Editar descrição"
                  placeholder="Descreva o conteúdo do expediente..."
                  emptyPlaceholder="Clique para adicionar descrição"
                  onSuccess={handleEditSuccess}
                  className="text-right"
                />
              </EditableRow>
              <EditableRow label="Observações">
                <ExpedienteTextEditor
                  expedienteId={displayExpediente.id}
                  field="observacoes"
                  value={displayExpediente.observacoes}
                  title="Editar observações"
                  placeholder="Adicione observações..."
                  emptyPlaceholder="Clique para adicionar observações"
                  onSuccess={handleEditSuccess}
                  className="text-right"
                />
              </EditableRow>
            </Section>

            {/* Informações do Processo */}
            <Section icon={<Scale className="h-4 w-4" />} title="Informações do Processo">
              <InfoRow label="Número do Processo">{displayExpediente.numeroProcesso}</InfoRow>
              {displayExpediente.classeJudicial && (
                <InfoRow label="Classe Judicial">{displayExpediente.classeJudicial}</InfoRow>
              )}
              <Separator />
              <InfoRow label="TRT">
                <SemanticBadge category="tribunal" value={displayExpediente.trt}>
                  {displayExpediente.trt}
                </SemanticBadge>
              </InfoRow>
              <InfoRow label="Grau">
                <SemanticBadge category="grau" value={displayExpediente.grau}>
                  {formatarGrau(displayExpediente.grau)}
                </SemanticBadge>
              </InfoRow>
              {displayExpediente.codigoStatusProcesso && (
                <InfoRow label="Status do Processo">
                  {displayExpediente.codigoStatusProcesso}
                </InfoRow>
              )}
            </Section>

            {/* Meta Grid: Flags do processo */}
            <MetaGrid>
              <MetaItem label="Prioridade">
                <SemanticBadge
                  category="status"
                  value={displayExpediente.prioridadeProcessual ? 'ALTA' : 'NORMAL'}
                  variantOverride={
                    displayExpediente.prioridadeProcessual ? 'warning' : 'neutral'
                  }
                  toneOverride="soft"
                >
                  {displayExpediente.prioridadeProcessual ? 'Sim' : 'Não'}
                </SemanticBadge>
              </MetaItem>
              <MetaItem label="Segredo de Justiça">
                <SemanticBadge
                  category="status"
                  value={displayExpediente.segredoJustica ? 'SEGREDO' : 'PUBLICO'}
                  variantOverride={
                    displayExpediente.segredoJustica ? 'destructive' : 'neutral'
                  }
                  toneOverride="soft"
                >
                  {displayExpediente.segredoJustica ? 'Sim' : 'Não'}
                </SemanticBadge>
              </MetaItem>
              <MetaItem label="Juízo Digital">
                <SemanticBadge
                  category="status"
                  value={displayExpediente.juizoDigital ? 'DIGITAL' : 'FISICO'}
                  variantOverride="neutral"
                  toneOverride="soft"
                >
                  {displayExpediente.juizoDigital ? 'Sim' : 'Não'}
                </SemanticBadge>
              </MetaItem>
            </MetaGrid>

            {/* Partes Envolvidas */}
            <Section icon={<Users className="h-4 w-4" />} title="Partes Envolvidas">
              <InfoRow label="Parte Autora">
                <span className="text-right">
                  {partes.autora || '-'}
                  {(displayExpediente.qtdeParteAutora ?? 0) > 1 && (
                    <Text variant="caption" className="block">
                      {displayExpediente.qtdeParteAutora} parte(s)
                    </Text>
                  )}
                </span>
              </InfoRow>
              <InfoRow label="Parte Ré">
                <span className="text-right">
                  {partes.re || '-'}
                  {displayExpediente.qtdeParteRe && displayExpediente.qtdeParteRe > 1 && (
                    <Text variant="caption" className="block">
                      {displayExpediente.qtdeParteRe} parte(s)
                    </Text>
                  )}
                </span>
              </InfoRow>
            </Section>

            {/* Órgão Julgador */}
            <Section icon={<Building2 className="h-4 w-4" />} title="Órgão Julgador">
              <InfoRow label="Descrição">
                {displayExpediente.descricaoOrgaoJulgador || '-'}
              </InfoRow>
              {displayExpediente.siglaOrgaoJulgador && (
                <InfoRow label="Sigla">
                  <SemanticBadge
                    category="status"
                    value={displayExpediente.siglaOrgaoJulgador}
                    variantOverride="neutral"
                    toneOverride="soft"
                  >
                    {displayExpediente.siglaOrgaoJulgador}
                  </SemanticBadge>
                </InfoRow>
              )}
            </Section>

            {/* Datas e Prazos — contextuais (read-only) */}
            <Section icon={<Calendar className="h-4 w-4" />} title="Datas e Prazos">
              <InfoRow label="Data de Autuação">
                {formatarData(displayExpediente.dataAutuacao)}
              </InfoRow>
              <InfoRow label="Data de Ciência">
                {formatarData(displayExpediente.dataCienciaParte)}
              </InfoRow>
              <InfoRow label="Criação do Expediente">
                {formatarData(displayExpediente.dataCriacaoExpediente)}
              </InfoRow>
              {displayExpediente.dataArquivamento && (
                <InfoRow label="Data de Arquivamento">
                  {formatarData(displayExpediente.dataArquivamento)}
                </InfoRow>
              )}
              {displayExpediente.baixadoEm && (
                <InfoRow label="Data de Baixa">
                  {formatarDataHora(displayExpediente.baixadoEm)}
                </InfoRow>
              )}
            </Section>

            {/* Informações de Baixa */}
            {displayExpediente.baixadoEm && (
              <Section
                icon={<AlertCircle className="h-4 w-4" />}
                title="Informações de Baixa"
              >
                {displayExpediente.protocoloId && (
                  <InfoRow label="Protocolo ID">
                    <span>{displayExpediente.protocoloId}</span>
                  </InfoRow>
                )}
                {displayExpediente.justificativaBaixa && (
                  <InfoRow label="Justificativa">
                    <span className="text-right">{displayExpediente.justificativaBaixa}</span>
                  </InfoRow>
                )}
              </Section>
            )}

            {/* Informações Técnicas */}
            <Section icon={<FileText className="h-4 w-4" />} title="Informações Técnicas">
              <InfoRow label="ID PJE">
                <span>{displayExpediente.idPje || '-'}</span>
              </InfoRow>
              {displayExpediente.idDocumento && (
                <InfoRow label="ID Documento">
                  <span>{displayExpediente.idDocumento}</span>
                </InfoRow>
              )}
            </Section>

            <Audit
              createdAt={displayExpediente.createdAt}
              updatedAt={displayExpediente.updatedAt}
            />
          </>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/app/expedientes/${displayExpediente.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir página completa
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
