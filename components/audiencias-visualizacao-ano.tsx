'use client';

// Componente de visualização de audiências por ano com calendários mensais

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface AudienciasVisualizacaoAnoProps {
  audiencias: Audiencia[];
  isLoading: boolean;
}

export function AudienciasVisualizacaoAno({ audiencias, isLoading }: AudienciasVisualizacaoAnoProps) {
  const [anoAtual, setAnoAtual] = React.useState(new Date().getFullYear());

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

  const navegarAno = (direcao: 'anterior' | 'proximo') => {
    setAnoAtual(direcao === 'proximo' ? anoAtual + 1 : anoAtual - 1);
  };

  const temAudiencia = (ano: number, mes: number, dia: number) => {
    const chave = `${ano}-${mes}-${dia}`;
    return audienciasPorDia.has(chave);
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
      {/* Navegação de ano */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarAno('anterior')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold min-w-[100px] text-center">
            {anoAtual}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegarAno('proximo')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setAnoAtual(new Date().getFullYear())}
        >
          Ano Atual
        </Button>
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meses.map((nomeMes, mes) => {
          const diasMes = getDiasMes(mes);

          return (
            <div key={mes} className="border rounded-lg p-3">
              {/* Nome do mês */}
              <div className="text-sm font-semibold mb-2 text-center">
                {nomeMes}
              </div>

              {/* Mini calendário */}
              <div className="space-y-1">
                {/* Cabeçalho dos dias da semana */}
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, i) => (
                    <div key={i} className="text-center text-xs text-muted-foreground">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Grade de dias */}
                <div className="grid grid-cols-7 gap-1">
                  {diasMes.map((dia, index) => {
                    const temAud = dia ? temAudiencia(anoAtual, mes, dia) : false;
                    const hoje = dia ? ehHoje(mes, dia) : false;

                    return (
                      <div
                        key={index}
                        className={`
                          aspect-square flex items-center justify-center text-xs rounded
                          ${!dia ? 'invisible' : ''}
                          ${hoje ? 'bg-blue-500 text-white font-semibold' : ''}
                          ${temAud && !hoje ? 'bg-primary text-primary-foreground font-medium' : ''}
                          ${!temAud && !hoje ? 'text-muted-foreground' : ''}
                        `}
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
          <span>Com audiências</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded"></div>
          <span>Sem audiências</span>
        </div>
      </div>
    </div>
  );
}
