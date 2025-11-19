'use client';

// Componente de visualização de expedientes por ano com calendários mensais

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExpedienteDetalhesDialog } from '@/components/expediente-detalhes-dialog';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

interface ExpedientesVisualizacaoAnoProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
}

export function ExpedientesVisualizacaoAno({ expedientes, isLoading }: ExpedientesVisualizacaoAnoProps) {
  const [anoAtual, setAnoAtual] = React.useState(new Date().getFullYear());
  const [expedientesDia, setExpedientesDia] = React.useState<PendenteManifestacao[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Agrupar expedientes por dia (usando data de prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Set<string>();

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte) return;

      const data = new Date(expediente.data_prazo_legal_parte);

      // Verificar se o expediente está no ano selecionado
      if (data.getFullYear() === anoAtual) {
        const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
        mapa.add(chave);
      }
    });

    return mapa;
  }, [expedientes, anoAtual]);

  const navegarAno = (direcao: 'anterior' | 'proximo') => {
    setAnoAtual(direcao === 'proximo' ? anoAtual + 1 : anoAtual - 1);
  };

  const temExpediente = (ano: number, mes: number, dia: number) => {
    const chave = `${ano}-${mes}-${dia}`;
    return expedientesPorDia.has(chave);
  };

  const getExpedientesDia = (ano: number, mes: number, dia: number): PendenteManifestacao[] => {
    // Apenas retornar expedientes do ano selecionado
    if (ano !== anoAtual) return [];

    return expedientes.filter((exp) => {
      if (!exp.data_prazo_legal_parte) return false;

      const data = new Date(exp.data_prazo_legal_parte);
      return (
        data.getFullYear() === ano &&
        data.getMonth() === mes &&
        data.getDate() === dia
      );
    });
  };

  const handleDiaClick = (ano: number, mes: number, dia: number) => {
    const expedientes = getExpedientesDia(ano, mes, dia);
    if (expedientes.length > 0) {
      setExpedientesDia(expedientes);
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
                    const temExp = dia ? temExpediente(anoAtual, mes, dia) : false;
                    const hoje = dia ? ehHoje(mes, dia) : false;

                    return (
                      <div
                        key={index}
                        className={`
                          aspect-square flex items-center justify-center text-xs rounded
                          ${!dia ? 'invisible' : ''}
                          ${hoje ? 'bg-blue-500 text-white font-semibold' : ''}
                          ${temExp && !hoje ? 'bg-primary text-primary-foreground font-medium cursor-pointer hover:opacity-80 transition-opacity' : ''}
                          ${!temExp && !hoje ? 'text-muted-foreground' : ''}
                        `}
                        onClick={() => dia && temExp && handleDiaClick(anoAtual, mes, dia)}
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
          <span>Com expedientes (clique para ver)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border rounded"></div>
          <span>Sem expedientes</span>
        </div>
      </div>

      {/* Dialog de detalhes */}
      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDia.length > 0 ? expedientesDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
