'use client';

// Componente de visualização de audiências por ano com calendários mensais

import * as React from 'react';
import { AudienciaDetalhesDialog } from '@/components/audiencia-detalhes-dialog';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface AudienciasVisualizacaoAnoProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  anoAtual: number;
}

export function AudienciasVisualizacaoAno({ audiencias, isLoading, anoAtual }: AudienciasVisualizacaoAnoProps) {
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Agrupar audiências por dia
  const audienciasPorDia = React.useMemo(() => {
    const mapa = new Set<string>();

    audiencias.forEach((audiencia) => {
      const data = new Date(audiencia.data_inicio);
      const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
      mapa.add(chave);
    });

    return mapa;
  }, [audiencias]);

  const temAudiencia = (ano: number, mes: number, dia: number) => {
    const chave = `${ano}-${mes}-${dia}`;
    return audienciasPorDia.has(chave);
  };

  const getAudienciasDia = (ano: number, mes: number, dia: number): Audiencia[] => {
    return audiencias.filter((aud) => {
      const data = new Date(aud.data_inicio);
      return (
        data.getFullYear() === ano &&
        data.getMonth() === mes &&
        data.getDate() === dia
      );
    });
  };

  const handleDiaClick = (ano: number, mes: number, dia: number) => {
    const audiencias = getAudienciasDia(ano, mes, dia);
    if (audiencias.length > 0) {
      setAudienciasDia(audiencias);
      setDialogOpen(true);
    }
  };

  // Gerar dias de um mês específico
  const getDiasMes = (mes: number) => {
    const primeiroDia = new Date(anoAtual, mes, 1);
    const ultimoDia = new Date(anoAtual, mes + 1, 0);
    const diasAnteriores = primeiroDia.getDay() === 0 ? 6 : primeiroDia.getDay() - 1;

    const dias: (number | null)[] = [];

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < diasAnteriores; i++) {
      dias.push(null);
    }

    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(dia);
    }

    return dias;
  };

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const ehHoje = (mes: number, dia: number) => {
    const hoje = new Date();
    return (
      dia === hoje.getDate() &&
      mes === hoje.getMonth() &&
      anoAtual === hoje.getFullYear()
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meses.map((nomeMes, mes) => {
          const diasMes = getDiasMes(mes);

          return (
            <div key={mes} className="border rounded-lg p-1.5">
              {/* Nome do mês */}
              <div className="text-xs font-semibold mb-2 text-center">
                {nomeMes}
              </div>

              {/* Mini calendário */}
              <div className="space-y-0.5">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-px">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, i) => {
                    const isSabadoDomingo = i >= 5;
                    return (
                      <div
                        key={i}
                        className={`text-center text-[10px] font-bold h-3 flex items-center justify-center ${isSabadoDomingo ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>

                {/* Grade de dias */}
                <div className="grid grid-cols-7 gap-px">
                  {diasMes.map((dia, index) => {
                    const temAud = dia ? temAudiencia(anoAtual, mes, dia) : false;
                    const hoje = dia ? ehHoje(mes, dia) : false;
                    const diaSemana = dia ? new Date(anoAtual, mes, dia).getDay() : 0;
                    const isSabadoDomingo = diaSemana === 0 || diaSemana === 6;

                    return (
                      <div
                        key={index}
                        className={`
                          h-5 w-5 flex items-center justify-center text-[10px] rounded-sm
                          ${!dia ? 'invisible' : ''}
                          ${hoje ? 'bg-blue-500 text-white font-semibold' : ''}
                          ${temAud && !hoje ? 'bg-primary text-primary-foreground font-medium cursor-pointer hover:opacity-80 transition-opacity' : ''}
                          ${!temAud && !hoje && isSabadoDomingo ? 'text-muted-foreground/60' : ''}
                          ${!temAud && !hoje && !isSabadoDomingo ? 'text-muted-foreground' : ''}
                        `}
                        onClick={() => dia && temAud && handleDiaClick(anoAtual, mes, dia)}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded"></div>
          <span>Com audiências (clique para ver)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded"></div>
          <span>Sem audiências</span>
        </div>
      </div>

      {/* Dialog de detalhes */}
      <AudienciaDetalhesDialog
        audiencia={null}
        audiencias={audienciasDia.length > 0 ? audienciasDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
