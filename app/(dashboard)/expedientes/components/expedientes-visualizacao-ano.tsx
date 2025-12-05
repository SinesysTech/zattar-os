'use client';

// Componente de visualização de expedientes por ano com calendários mensais

import * as React from 'react';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';
import type { PendenteManifestacao } from '@/backend/types/expedientes/types';

interface ExpedientesVisualizacaoAnoProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
  anoAtual?: Date;
}

export function ExpedientesVisualizacaoAno({
  expedientes,
  isLoading,
  anoAtual,
}: ExpedientesVisualizacaoAnoProps) {
  const [anoLocal, setAnoLocal] = React.useState(new Date());
  const anoSelecionado = (anoAtual ?? anoLocal).getFullYear();

  React.useEffect(() => {
    if (anoAtual) {
      setAnoLocal(anoAtual);
    }
  }, [anoAtual]);

  const [expedientesDia, setExpedientesDia] = React.useState<PendenteManifestacao[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Itens especiais: sem prazo e vencidos (pendentes)
  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixado_em && !e.data_prazo_legal_parte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixado_em && e.prazo_vencido === true),
    [expedientes]
  );
  const pinnedIds = React.useMemo(
    () => new Set<number>([...semPrazoPendentes.map((e) => e.id), ...vencidosPendentes.map((e) => e.id)]),
    [semPrazoPendentes, vencidosPendentes]
  );

  // Agrupar expedientes por dia (usando data de prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Set<string>();

    expedientes.forEach((expediente) => {
      if (!expediente.data_prazo_legal_parte) return;

      const data = new Date(expediente.data_prazo_legal_parte);

      // Verificar se o expediente está no ano selecionado
      if (data.getFullYear() === anoSelecionado) {
        const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
        mapa.add(chave);
      }
    });

    return mapa;
  }, [expedientes, anoSelecionado]);

  const temExpediente = (ano: number, mes: number, dia: number) => {
    const chave = `${ano}-${mes}-${dia}`;
    // Se há itens pinned (sem prazo ou vencidos pendentes), considerar que há expedientes em todos os dias
    if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;
    return expedientesPorDia.has(chave);
  };

  const getExpedientesDia = (ano: number, mes: number, dia: number): PendenteManifestacao[] => {
    // Apenas retornar expedientes do ano selecionado
    if (ano !== anoSelecionado) return [];

    const expedientesDoDia = expedientes.filter((exp) => {
      if (!exp.data_prazo_legal_parte) return false;

      const data = new Date(exp.data_prazo_legal_parte);
      return (
        data.getFullYear() === ano &&
        data.getMonth() === mes &&
        data.getDate() === dia
      );
    });

    // Ordenar por data de vencimento (mais antigas primeiro)
    const restantes = expedientesDoDia.filter((e) => !pinnedIds.has(e.id));
    restantes.sort((a, b) => {
      const dataA = a.data_prazo_legal_parte ? new Date(a.data_prazo_legal_parte).getTime() : 0;
      const dataB = b.data_prazo_legal_parte ? new Date(b.data_prazo_legal_parte).getTime() : 0;
      return dataA - dataB; // Crescente: mais antigas primeiro
    });
    // Prefixar pinned
    return [...semPrazoPendentes, ...vencidosPendentes, ...restantes];
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
    const primeiroDia = new Date(anoSelecionado, mes, 1);
    const ultimoDia = new Date(anoSelecionado, mes + 1, 0);
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
      anoSelecionado === hoje.getFullYear()
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meses.map((nomeMes, mes) => {
          const diasMes = getDiasMes(mes);
          return (
            <div key={mes} className="border rounded-lg p-3">
              <div className="text-sm font-semibold mb-2 text-center">
                {nomeMes}
              </div>
              <div className="space-y-1">
                <div className="grid grid-cols-7 gap-1">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, i) => (
                    <div key={i} className="text-center text-xs text-muted-foreground">
                      {dia}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {diasMes.map((dia, index) => {
                    const temExp = dia ? temExpediente(anoSelecionado, mes, dia) : false;
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
                        onClick={() => dia && temExp && handleDiaClick(anoSelecionado, mes, dia)}
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
      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDia.length > 0 ? expedientesDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
