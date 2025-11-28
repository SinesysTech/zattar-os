'use client';

// Componente de visualização de audiências por mês em calendário

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Typography } from '@/components/ui/typography';
import { AudienciaDetalhesDialog } from './audiencia-detalhes-dialog';
import { FileText } from 'lucide-react';
import { PdfViewerDialog } from '@/app/(dashboard)/expedientes/components/pdf-viewer-dialog';
import type { Audiencia } from '@/backend/types/audiencias/types';

/**
 * Formata hora para exibição
 */
const formatarHora = (dataISO: string): string => {
  const data = new Date(dataISO);
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface AudienciasVisualizacaoMesProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  mesAtual: Date;
}

export function AudienciasVisualizacaoMes({ audiencias, isLoading, mesAtual }: AudienciasVisualizacaoMesProps) {
  const [audienciaSelecionada, setAudienciaSelecionada] = React.useState<Audiencia | null>(null);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [pdfKey, setPdfKey] = React.useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = React.useState<string>('Ata da audiência');

  const extractKeyFromBackblazeUrl = (u: string | null): string | null => {
    if (!u) return null;
    try {
      const urlObj = new URL(u);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length < 2) return null;
      return parts.slice(1).join('/');
    } catch {
      return null;
    }
  };

  // Gerar dias do mês
  const diasMes = React.useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasAnteriores = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1;

    const dias: (Date | null)[] = [];

    // Dias do mês anterior (vazios)
    for (let i = 0; i < diasAnteriores; i++) {
      dias.push(null);
    }

    // Dias do mês atual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(ano, mes, dia));
    }

    return dias;
  }, [mesAtual]);

  // Agrupar audiências por dia
  const audienciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Audiencia[]>();

    audiencias.forEach((audiencia) => {
      const data = new Date(audiencia.data_inicio);
      const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, []);
      }
      mapa.get(chave)!.push(audiencia);
    });

    return mapa;
  }, [audiencias]);

  const getAudienciasDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    return audienciasPorDia.get(chave) || [];
  };

  const handleAudienciaClick = (audiencia: Audiencia) => {
    setAudienciaSelecionada(audiencia);
    setAudienciasDia([]);
    setDialogOpen(true);
  };

  const handleMaisClick = (dia: Date) => {
    const audiencias = getAudienciasDia(dia);
    setAudienciasDia(audiencias);
    setAudienciaSelecionada(null);
    setDialogOpen(true);
  };

  const ehHoje = (dia: Date | null) => {
    if (!dia) return false;
    const hoje = new Date();
    return (
      dia.getDate() === hoje.getDate() &&
      dia.getMonth() === hoje.getMonth() &&
      dia.getFullYear() === hoje.getFullYear()
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Calendário */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-muted">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, i) => {
            const isSabadoDomingo = i >= 5;
            return (
              <div
                key={dia}
                className={`p-2 text-center text-sm font-bold ${isSabadoDomingo ? 'text-muted-foreground/70' : ''}`}
              >
                {dia}
              </div>
            );
          })}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7">
          {diasMes.map((dia, index) => {
            const audienciasDia = getAudienciasDia(dia);
            const temAudiencias = audienciasDia.length > 0;
            const hoje = ehHoje(dia);
            const diaSemana = dia ? dia.getDay() : 0;
            const isSabadoDomingo = diaSemana === 0 || diaSemana === 6;

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] border-r border-b p-1.5
                  ${!dia ? 'bg-muted/50' : ''}
                  ${hoje ? 'bg-blue-50 dark:bg-blue-950' : ''}
                  ${temAudiencias ? 'hover:bg-accent cursor-pointer' : ''}
                  ${isSabadoDomingo && !hoje ? 'bg-muted/30' : ''}
                `}
              >
                {dia && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${hoje ? 'text-blue-600 dark:text-blue-400' : ''} ${isSabadoDomingo && !hoje ? 'text-muted-foreground/70' : ''}`}>
                      {dia.getDate()}
                    </div>
                    {temAudiencias && (
                      <div className="space-y-1">
                        {audienciasDia.slice(0, 3).map((audiencia) => {
                          const key = extractKeyFromBackblazeUrl(audiencia.url_ata_audiencia);
                          const canOpenAta = audiencia.status === 'F' && key !== null;
                          return (
                            <div
                              key={audiencia.id}
                              className="text-xs bg-primary/10 hover:bg-primary/20 rounded px-1 py-0.5 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAudienciaClick(audiencia);
                              }}
                            >
                              <div className="truncate">
                                {formatarHora(audiencia.data_inicio)} - {audiencia.classe_judicial ? audiencia.classe_judicial + ' ' : ''}{audiencia.numero_processo}
                              </div>
                              {canOpenAta && (
                                <div className="flex items-center justify-center mt-1">
                                  <button
                                    className="h-5 w-5 flex items-center justify-center rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPdfKey(key);
                                      setPdfTitle(`Ata da audiência ${audiencia.numero_processo}`);
                                      setPdfOpen(true);
                                    }}
                                    title="Ver Ata de Audiência"
                                  >
                                    <FileText className="h-4 w-4 text-primary" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {audienciasDia.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaisClick(dia);
                            }}
                          >
                            +{audienciasDia.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog de detalhes */}
      <AudienciaDetalhesDialog
        audiencia={audienciaSelecionada}
        audiencias={audienciasDia.length > 0 ? audienciasDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <PdfViewerDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        fileKey={pdfKey}
        documentTitle={pdfTitle}
      />
    </div>
  );
}
