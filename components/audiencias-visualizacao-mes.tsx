'use client';

// Componente de visualização de audiências por mês em calendário

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AudienciaDetalhesDialog } from '@/components/audiencia-detalhes-dialog';
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
}

export function AudienciasVisualizacaoMes({ audiencias, isLoading }: AudienciasVisualizacaoMesProps) {
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const [audienciaSelecionada, setAudienciaSelecionada] = React.useState<Audiencia | null>(null);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

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

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual);
    if (direcao === 'proximo') {
      novoMes.setMonth(novoMes.getMonth() + 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() - 1);
    }
    setMesAtual(novoMes);
  };

  const formatarMesAno = () => {
    return mesAtual.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  };

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
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarMes('anterior')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold capitalize min-w-[200px] text-center">
            {formatarMesAno()}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarMes('proximo')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setMesAtual(new Date())}
        >
          Mês Atual
        </Button>
      </div>

      {/* Calendário */}
      <div className="border rounded-lg overflow-hidden">
        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 bg-muted">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
            <div key={dia} className="p-2 text-center text-sm font-medium">
              {dia}
            </div>
          ))}
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7">
          {diasMes.map((dia, index) => {
            const audienciasDia = getAudienciasDia(dia);
            const temAudiencias = audienciasDia.length > 0;
            const hoje = ehHoje(dia);

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] border-r border-b p-2
                  ${!dia ? 'bg-muted/50' : ''}
                  ${hoje ? 'bg-blue-50 dark:bg-blue-950' : ''}
                  ${temAudiencias ? 'hover:bg-accent cursor-pointer' : ''}
                `}
              >
                {dia && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${hoje ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {dia.getDate()}
                    </div>
                    {temAudiencias && (
                      <div className="space-y-1">
                        {audienciasDia.slice(0, 3).map((audiencia) => (
                          <div
                            key={audiencia.id}
                            className="text-xs bg-primary/10 hover:bg-primary/20 rounded px-1 py-0.5 truncate cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAudienciaClick(audiencia);
                            }}
                          >
                            {formatarHora(audiencia.data_inicio)} - {audiencia.numero_processo}
                          </div>
                        ))}
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
    </div>
  );
}
