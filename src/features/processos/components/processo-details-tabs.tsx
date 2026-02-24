'use client';

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  FileText,
  Microscope,
  Loader2,
  ExternalLink,
  Video,
  MapPin,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actionObterDetalhesComplementaresProcesso } from '../actions';
import type { Audiencia } from '@/features/audiencias/domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  type ModalidadeAudiencia,
} from '@/features/audiencias/domain';
import type { Expediente } from '@/features/expedientes/domain';
import type { Pericia } from '@/features/pericias/domain';
import { SITUACAO_PERICIA_LABELS, type SituacaoPericiaCodigo } from '@/features/pericias/domain';

interface ProcessoDetailsTabsProps {
  processoId: number;
  numeroProcesso: string;
}

function formatarData(data: string | null | undefined): string {
  if (!data) return '--';
  try {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '--';
  }
}

function formatarDataHora(data: string | null | undefined): string {
  if (!data) return '--';
  try {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '--';
  }
}

// ─── Status Badges ──────────────────────────────────────────────────────────

function StatusAudienciaBadge({ status }: { status: StatusAudiencia }) {
  const label = STATUS_AUDIENCIA_LABELS[status] || status;
  const variant =
    status === StatusAudiencia.Marcada
      ? 'default'
      : status === StatusAudiencia.Finalizada
        ? 'secondary'
        : 'outline';
  const className =
    status === StatusAudiencia.Cancelada
      ? 'text-muted-foreground line-through'
      : '';
  return (
    <AppBadge variant={variant} className={className}>
      {label}
    </AppBadge>
  );
}

function PrazoVencidoBadge({ vencido }: { vencido: boolean }) {
  return vencido ? (
    <AppBadge variant="destructive" className="text-xs">
      Vencido
    </AppBadge>
  ) : (
    <AppBadge variant="outline" className="text-xs">
      No prazo
    </AppBadge>
  );
}

function SituacaoPericiaBadge({ codigo }: { codigo: SituacaoPericiaCodigo }) {
  const label = SITUACAO_PERICIA_LABELS[codigo] || codigo;
  return <AppBadge variant="outline">{label}</AppBadge>;
}

// ─── Tabelas ────────────────────────────────────────────────────────────────

function AudienciasTable({ audiencias }: { audiencias: Audiencia[] }) {
  const sorted = useMemo(
    () =>
      [...audiencias].sort(
        (a, b) =>
          new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime()
      ),
    [audiencias]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma audiência encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Data prevista
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Tipo de Audiência
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Sala
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Status
            </th>
            <th className="pb-2 font-medium text-muted-foreground">
              Modalidade
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((aud) => (
            <tr key={aud.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {formatarDataHora(aud.dataInicio)}
              </td>
              <td className="py-2.5 pr-4">
                {aud.tipoDescricao || '--'}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {aud.salaAudienciaNome || '--'}
              </td>
              <td className="py-2.5 pr-4">
                <StatusAudienciaBadge status={aud.status} />
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1.5">
                  {aud.modalidade && (
                    <span className="text-xs text-muted-foreground">
                      {MODALIDADE_AUDIENCIA_LABELS[aud.modalidade]}
                    </span>
                  )}
                  {aud.urlAudienciaVirtual && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              window.open(aud.urlAudienciaVirtual!, '_blank')
                            }
                          >
                            <Video className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir sala virtual</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {aud.urlAtaAudiencia && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() =>
                              window.open(aud.urlAtaAudiencia!, '_blank')
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver ata da audiência</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpedientesTable({ expedientes }: { expedientes: Expediente[] }) {
  const sorted = useMemo(
    () =>
      [...expedientes].sort((a, b) => {
        const dateA = a.dataCriacaoExpediente
          ? new Date(a.dataCriacaoExpediente).getTime()
          : 0;
        const dateB = b.dataCriacaoExpediente
          ? new Date(b.dataCriacaoExpediente).getTime()
          : 0;
        return dateB - dateA;
      }),
    [expedientes]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum expediente encontrado para este processo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Origem
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Data Criação
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Data Ciência
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Prazo
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Status
            </th>
            <th className="pb-2 font-medium text-muted-foreground">
              Baixado em
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((exp) => (
            <tr key={exp.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4 capitalize text-xs">
                {exp.origem.replace('_', ' ')}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {formatarData(exp.dataCriacaoExpediente)}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {formatarData(exp.dataCienciaParte)}
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="whitespace-nowrap">
                    {formatarData(exp.dataPrazoLegalParte)}
                  </span>
                  {exp.dataPrazoLegalParte && !exp.baixadoEm && (
                    <PrazoVencidoBadge vencido={exp.prazoVencido} />
                  )}
                </div>
              </td>
              <td className="py-2.5 pr-4">
                {exp.baixadoEm ? (
                  <AppBadge variant="secondary" className="text-xs">
                    Respondido
                  </AppBadge>
                ) : (
                  <AppBadge variant="default" className="text-xs">
                    Pendente
                  </AppBadge>
                )}
              </td>
              <td className="py-2.5 whitespace-nowrap">
                {formatarData(exp.baixadoEm)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PericiasTable({ pericias }: { pericias: Pericia[] }) {
  const sorted = useMemo(
    () =>
      [...pericias].sort(
        (a, b) =>
          new Date(b.dataCriacao).getTime() -
          new Date(a.dataCriacao).getTime()
      ),
    [pericias]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma perícia encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Situação
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Especialidade
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Perito
            </th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">
              Prazo Entrega
            </th>
            <th className="pb-2 font-medium text-muted-foreground">
              Laudo
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((per) => (
            <tr key={per.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4">
                <SituacaoPericiaBadge codigo={per.situacaoCodigo} />
              </td>
              <td className="py-2.5 pr-4">
                {per.especialidade?.descricao || '--'}
              </td>
              <td className="py-2.5 pr-4">
                {per.perito?.nome || '--'}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap">
                {formatarData(per.prazoEntrega)}
              </td>
              <td className="py-2.5">
                {per.laudoJuntado ? (
                  <AppBadge variant="secondary" className="text-xs">
                    Juntado
                  </AppBadge>
                ) : (
                  <span className="text-muted-foreground">Pendente</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ProcessoDetailsTabs({
  processoId,
  numeroProcesso,
}: ProcessoDetailsTabsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result =
          await actionObterDetalhesComplementaresProcesso(
            processoId,
            numeroProcesso
          );

        if (cancelled) return;

        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes complementares:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;
  const total = totalAudiencias + totalExpedientes + totalPericias;

  // Se não há dados e não está carregando, não mostra nada
  if (!isLoading && total === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="audiencias">
        <div className="border-b px-4 pt-2">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="audiencias" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Audiências
              {!isLoading && totalAudiencias > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({totalAudiencias})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="expedientes" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Expedientes
              {!isLoading && totalExpedientes > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({totalExpedientes})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pericias" className="gap-1.5">
              <Microscope className="h-3.5 w-3.5" />
              Perícias
              {!isLoading && totalPericias > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({totalPericias})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Carregando...
            </span>
          </div>
        ) : (
          <>
            <TabsContent value="audiencias" className="p-4 mt-0">
              <AudienciasTable audiencias={audiencias} />
            </TabsContent>
            <TabsContent value="expedientes" className="p-4 mt-0">
              <ExpedientesTable expedientes={expedientes} />
            </TabsContent>
            <TabsContent value="pericias" className="p-4 mt-0">
              <PericiasTable pericias={pericias} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </Card>
  );
}
