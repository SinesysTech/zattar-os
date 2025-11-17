'use client';

// Componente de visualização de expedientes por mês em calendário

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExpedienteDetalhesDialog } from '@/components/expediente-detalhes-dialog';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

/**
 * Formata data para exibição
 */
const formatarData = (dataISO: string): string => {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR');
};

interface ExpedientesVisualizacaoMesProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
}

export function ExpedientesVisualizacaoMes({ expedientes, isLoading }: ExpedientesVisualizacaoMesProps) {
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const [expedienteSelecionado, setExpedienteSelecionado] = React.useState<PendenteManifestacao | null>(null);
  const [expedientesDia, setExpedientesDia] = React.useState<PendenteManifestacao[]>([]);
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

  // Agrupar expedientes por dia (usando data de prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, PendenteManifestacao[]>();
    const anoAtual = mesAtual.getFullYear();
    const mesAtualNum = mesAtual.getMonth();

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte) return;

      const data = new Date(expediente.data_prazo_legal_parte);

      // Verificar se o expediente está no mês/ano selecionado
      if (data.getFullYear() === anoAtual && data.getMonth() === mesAtualNum) {
        const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;

        if (!mapa.has(chave)) {
          mapa.set(chave, []);
        }
        mapa.get(chave)!.push(expediente);
      }
    });

    return mapa;
  }, [expedientes, mesAtual]);

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

  const getExpedientesDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    return expedientesPorDia.get(chave) || [];
  };

  const handleExpedienteClick = (expediente: PendenteManifestacao) => {
    setExpedienteSelecionado(expediente);
    setExpedientesDia([]);
    setDialogOpen(true);
  };

  const handleMaisClick = (dia: Date) => {
    const expedientes = getExpedientesDia(dia);
    setExpedientesDia(expedientes);
    setExpedienteSelecionado(null);
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
            const expedientesDia = getExpedientesDia(dia);
            const temExpedientes = expedientesDia.length > 0;
            const hoje = ehHoje(dia);

            return (
              <div
                key={index}
                className={`
                  min-h-[120px] border-r border-b p-2
                  ${!dia ? 'bg-muted/50' : ''}
                  ${hoje ? 'bg-blue-50 dark:bg-blue-950' : ''}
                  ${temExpedientes ? 'hover:bg-accent cursor-pointer' : ''}
                `}
              >
                {dia && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${hoje ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      {dia.getDate()}
                    </div>
                    {temExpedientes && (
                      <div className="space-y-1">
                        {expedientesDia.slice(0, 3).map((expediente) => (
                          <div
                            key={expediente.id}
                            className="text-xs bg-primary/10 hover:bg-primary/20 rounded px-1 py-0.5 truncate cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExpedienteClick(expediente);
                            }}
                          >
                            {expediente.classe_judicial} {expediente.numero_processo}
                          </div>
                        ))}
                        {expedientesDia.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaisClick(dia);
                            }}
                          >
                            +{expedientesDia.length - 3} mais
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
      <ExpedienteDetalhesDialog
        expediente={expedienteSelecionado}
        expedientes={expedientesDia.length > 0 ? expedientesDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
