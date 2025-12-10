'use client';

/**
 * ContratoViewSheet - Sheet de Visualização de Contrato
 *
 * Componente read-only para exibir detalhes completos de um contrato.
 */

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Calendar,
  User,
  Users,
  Briefcase,
  Scale,
  FileText,
  Clock,
} from 'lucide-react';
import type { Contrato } from '@/core/contratos/domain';
import {
  AREA_DIREITO_LABELS,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from '@/core/contratos/domain';

// =============================================================================
// TIPOS
// =============================================================================

interface ContratoViewSheetProps {
  contrato: Contrato;
  clienteNome: string;
  parteContrariaNome?: string;
  responsavelNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

function formatarDataHora(dataISO: string | null | undefined): string {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

function getStatusVariant(status: Contrato['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'contratado':
      return 'default';
    case 'distribuido':
      return 'secondary';
    case 'desistencia':
      return 'destructive';
    case 'em_contratacao':
    default:
      return 'outline';
  }
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function InfoItem({ label, value, icon, className }: InfoItemProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="text-sm font-medium">{value || '-'}</dd>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratoViewSheet({
  contrato,
  clienteNome,
  parteContrariaNome,
  responsavelNome,
  open,
  onOpenChange,
}: ContratoViewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato #{contrato.id}
            </SheetTitle>
            <Badge variant={getStatusVariant(contrato.status)}>
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </Badge>
          </div>
          <SheetDescription>
            Detalhes do contrato jurídico
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-6">
            {/* Informações Básicas */}
            <Section title="Informações Básicas" icon={<Briefcase className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Área de Direito"
                  value={
                    <Badge variant="outline">
                      {AREA_DIREITO_LABELS[contrato.areaDireito]}
                    </Badge>
                  }
                  icon={<Scale className="h-3.5 w-3.5" />}
                />
                <InfoItem
                  label="Tipo de Contrato"
                  value={
                    <Badge variant="secondary">
                      {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
                    </Badge>
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Tipo de Cobrança"
                  value={TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
                />
                <InfoItem
                  label="Status"
                  value={
                    <Badge variant={getStatusVariant(contrato.status)}>
                      {STATUS_CONTRATO_LABELS[contrato.status]}
                    </Badge>
                  }
                />
              </div>
            </Section>

            <Separator />

            {/* Partes */}
            <Section title="Partes do Contrato" icon={<Users className="h-4 w-4" />}>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Cliente</span>
                    <Badge variant="outline" className="text-xs">
                      {POLO_PROCESSUAL_LABELS[contrato.poloCliente]}
                    </Badge>
                  </div>
                  <p className="font-medium">{clienteNome}</p>
                </div>

                {contrato.parteContrariaId && parteContrariaNome && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Parte Contrária
                    </span>
                    <p className="font-medium">{parteContrariaNome}</p>
                  </div>
                )}

                {contrato.parteAutora && contrato.parteAutora.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <span className="text-xs text-muted-foreground block mb-2">
                      Parte Autora ({contrato.qtdeParteAutora})
                    </span>
                    <ul className="space-y-1">
                      {contrato.parteAutora.map((parte, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {parte.nome}
                          <Badge variant="outline" className="text-xs ml-auto">
                            {parte.tipo === 'cliente' ? 'Cliente' : 'Parte Contrária'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {contrato.parteRe && contrato.parteRe.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <span className="text-xs text-muted-foreground block mb-2">
                      Parte Ré ({contrato.qtdeParteRe})
                    </span>
                    <ul className="space-y-1">
                      {contrato.parteRe.map((parte, idx) => (
                        <li key={idx} className="text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          {parte.nome}
                          <Badge variant="outline" className="text-xs ml-auto">
                            {parte.tipo === 'cliente' ? 'Cliente' : 'Parte Contrária'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            <Separator />

            {/* Datas */}
            <Section title="Datas" icon={<Calendar className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Data de Contratação"
                  value={formatarData(contrato.dataContratacao)}
                />
                <InfoItem
                  label="Data de Assinatura"
                  value={formatarData(contrato.dataAssinatura)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Data de Distribuição"
                  value={formatarData(contrato.dataDistribuicao)}
                />
                <InfoItem
                  label="Data de Desistência"
                  value={formatarData(contrato.dataDesistencia)}
                />
              </div>
            </Section>

            {/* Responsável */}
            {(responsavelNome || contrato.responsavelId) && (
              <>
                <Separator />
                <Section title="Responsável" icon={<User className="h-4 w-4" />}>
                  <InfoItem
                    label="Responsável pelo Contrato"
                    value={responsavelNome || `Usuário #${contrato.responsavelId}`}
                  />
                </Section>
              </>
            )}

            {/* Observações */}
            {contrato.observacoes && (
              <>
                <Separator />
                <Section title="Observações" icon={<FileText className="h-4 w-4" />}>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm whitespace-pre-wrap">{contrato.observacoes}</p>
                  </div>
                </Section>
              </>
            )}

            <Separator />

            {/* Metadados */}
            <Section title="Metadados" icon={<Clock className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <InfoItem
                  label="Criado em"
                  value={formatarDataHora(contrato.createdAt)}
                />
                <InfoItem
                  label="Atualizado em"
                  value={formatarDataHora(contrato.updatedAt)}
                />
              </div>
              {contrato.createdBy && (
                <InfoItem
                  label="Criado por"
                  value={`Usuário #${contrato.createdBy}`}
                />
              )}
            </Section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
