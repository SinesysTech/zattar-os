'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  FileText,
  Microscope,
  Loader2,
  ExternalLink,
  Video,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SemanticBadge } from '@/components/ui/semantic-badge';
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
} from '@/features/audiencias/domain';
import type { Expediente } from '@/features/expedientes/domain';
import { ORIGEM_EXPEDIENTE_LABELS, type OrigemExpediente } from '@/features/expedientes/domain';
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

function formatarDataRelativa(data: string | null | undefined): string | null {
  if (!data) return null;
  try {
    return formatDistanceToNow(new Date(data), { locale: ptBR, addSuffix: true });
  } catch {
    return null;
  }
}

// ─── Status Badges ──────────────────────────────────────────────────────────

function StatusAudienciaBadge({ status }: { status: StatusAudiencia }) {
  const label = STATUS_AUDIENCIA_LABELS[status] || status;

  return (
    <SemanticBadge category="audiencia_status" value={status} className="text-xs">
      {label}
    </SemanticBadge>
  );
}

function PrazoBadge({ data, baixadoEm }: { data: string | null | undefined; baixadoEm: string | null | undefined }) {
  if (!data) return <span className="text-muted-foreground text-xs">Sem prazo</span>;

  const vencido = isPast(new Date(data));
  const respondido = !!baixadoEm;

  if (respondido) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs whitespace-nowrap">{formatarData(data)}</span>
        <SemanticBadge category="status" value="respondido" variantOverride="success" toneOverride="soft" className="text-xs">
          <CheckCircle2 className="h-3 w-3 mr-0.5" />
          Respondido
        </SemanticBadge>
      </div>
    );
  }

  if (vencido) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs whitespace-nowrap text-destructive font-medium">{formatarData(data)}</span>
        <SemanticBadge category="status" value="vencido" variantOverride="destructive" toneOverride="soft" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-0.5" />
          Vencido
        </SemanticBadge>
      </div>
    );
  }

  const relativa = formatarDataRelativa(data);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs whitespace-nowrap">{formatarData(data)}</span>
      <SemanticBadge category="status" value="no-prazo" variantOverride="warning" toneOverride="soft" className="text-xs">
        <Clock className="h-3 w-3 mr-0.5" />
        {relativa || 'No prazo'}
      </SemanticBadge>
    </div>
  );
}

function SituacaoPericiaBadge({ codigo }: { codigo: SituacaoPericiaCodigo }) {
  const label = SITUACAO_PERICIA_LABELS[codigo] || codigo;
  return <SemanticBadge category="status" value={codigo} variantOverride="outline" className="text-xs">{label}</SemanticBadge>;
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
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhuma audiência encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((aud) => (
        <div
          key={aud.id}
          className="rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground">
                  {aud.tipoDescricao || 'Audiência'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatarDataHora(aud.dataInicio)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {aud.salaAudienciaNome && <span>Sala {aud.salaAudienciaNome}</span>}
                {aud.modalidade && (
                  <span>{MODALIDADE_AUDIENCIA_LABELS[aud.modalidade]}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <StatusAudienciaBadge status={aud.status} />
              {aud.urlAudienciaVirtual && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => window.open(aud.urlAudienciaVirtual!, '_blank')}
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
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => window.open(aud.urlAtaAudiencia!, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver ata da audiência</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpedientesTable({ expedientes }: { expedientes: Expediente[] }) {
        const vencido = exp.dataPrazoLegalParte && !exp.baixadoEm && exp.prazoVencido;
    () =>
      [...expedientes].sort((a, b) => {
        const dateA = a.dataCriacaoExpediente ? new Date(a.dataCriacaoExpediente).getTime() : 0;
        const dateB = b.dataCriacaoExpediente ? new Date(b.dataCriacaoExpediente).getTime() : 0;
        return dateB - dateA;
      }),
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SemanticBadge category="status" value={origemLabel} variantOverride="secondary" toneOverride="soft" className="text-xs">
                    {origemLabel}
                  </SemanticBadge>
                  {exp.siglaOrgaoJulgador && (
                    <span className="text-xs text-muted-foreground">{exp.siglaOrgaoJulgador}</span>
                  )}
                  {exp.baixadoEm && (
                    <SemanticBadge category="status" value="baixado" variantOverride="success" toneOverride="soft" className="text-xs">
                      Baixado
                    </SemanticBadge>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span>Criado em {formatarData(exp.dataCriacaoExpediente)}</span>
                  {exp.dataCienciaParte && <span>Ciência em {formatarData(exp.dataCienciaParte)}</span>}
                </div>

                {exp.arquivoNome && (
                  <p className="truncate text-xs text-muted-foreground">{exp.arquivoNome}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <PrazoBadge data={exp.dataPrazoLegalParte} baixadoEm={exp.baixadoEm} />
                {exp.arquivoUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => window.open(exp.arquivoUrl!, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Abrir documento do expediente</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PericiasTable({ pericias }: { pericias: Pericia[] }) {
  const sorted = useMemo(
    () =>
      [...pericias].sort(
        (a, b) =>
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      ),
    [pericias]
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhuma perícia encontrada para este processo.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Situação</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Especialidade</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Perito</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-xs">Prazo Entrega</th>
            <th className="pb-2 font-medium text-muted-foreground text-xs">Laudo</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((per) => (
            <tr key={per.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
              <td className="py-2.5 pr-4">
                <SituacaoPericiaBadge codigo={per.situacaoCodigo} />
              </td>
              <td className="py-2.5 pr-4 text-xs">
                {per.especialidade?.descricao || '--'}
              </td>
              <td className="py-2.5 pr-4 text-xs">
                {per.perito?.nome || '--'}
              </td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-xs">
                {formatarData(per.prazoEntrega)}
              </td>
              <td className="py-2.5">
                {per.laudoJuntado ? (
                  <SemanticBadge category="status" value="juntado" variantOverride="success" toneOverride="soft" className="text-xs">
                    Juntado
                  </SemanticBadge>
                ) : (
                  <span className="text-muted-foreground text-xs">Pendente</span>
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
        const result = await actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso);
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
    return () => { cancelled = true; };
  }, [processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;
  const total = totalAudiencias + totalExpedientes + totalPericias;

  if (!isLoading && total === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Tabs defaultValue="expedientes">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="expedientes" className="gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            Expedientes
            {!isLoading && totalExpedientes > 0 && (
              <SemanticBadge category="status" value={totalExpedientes} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalExpedientes}
              </SemanticBadge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audiencias" className="gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            Audiências
            {!isLoading && totalAudiencias > 0 && (
              <SemanticBadge category="status" value={totalAudiencias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalAudiencias}
              </SemanticBadge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pericias" className="gap-1.5 text-sm">
            <Microscope className="h-3.5 w-3.5" />
            Perícias
            {!isLoading && totalPericias > 0 && (
              <SemanticBadge category="status" value={totalPericias} variantOverride="secondary" toneOverride="soft" className="ml-1 text-[10px] px-1.5 py-0">
                {totalPericias}
              </SemanticBadge>
            )}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <TabsContent value="expedientes" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <ExpedientesTable expedientes={expedientes} />
              </div>
            </TabsContent>
            <TabsContent value="audiencias" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <AudienciasTable audiencias={audiencias} />
              </div>
            </TabsContent>
            <TabsContent value="pericias" className="mt-0 rounded-xl border bg-background/70 p-3">
              <div className="max-h-96 overflow-y-auto pr-1">
                <PericiasTable pericias={pericias} />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
