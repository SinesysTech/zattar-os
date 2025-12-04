'use client';

// Componente de visualização de expedientes por mês em calendário

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { DayButton } from 'react-day-picker';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';
import type { PendenteManifestacao } from '@/backend/types/expedientes/types';

interface ExpedientesVisualizacaoMesProps {
  expedientes: PendenteManifestacao[];
  isLoading: boolean;
  mesAtual?: Date;
}

export function ExpedientesVisualizacaoMes({
  expedientes,
  isLoading,
  mesAtual,
}: ExpedientesVisualizacaoMesProps) {
  const [mesLocal, setMesLocal] = React.useState(new Date());
  const mesSelecionado = mesAtual ?? mesLocal;

  React.useEffect(() => {
    if (mesAtual) {
      setMesLocal(mesAtual);
    }
  }, [mesAtual]);
  const [expedienteSelecionado, setExpedienteSelecionado] = React.useState<PendenteManifestacao | null>(null);
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

  // Gerar dias do mês
  const diasMes = React.useMemo(() => {
    const ano = mesSelecionado.getFullYear();
    const mes = mesSelecionado.getMonth();
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
  }, [mesSelecionado]);

  // Agrupar expedientes por dia (usando data de prazo legal)
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, PendenteManifestacao[]>();
    const anoAtual = mesSelecionado.getFullYear();
    const mesAtualNum = mesSelecionado.getMonth();

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

    // Ordenar expedientes de cada dia por data de vencimento (mais antigas primeiro)
    mapa.forEach((expedientesDia) => {
      expedientesDia.sort((a, b) => {
        const dataA = a.data_prazo_legal_parte ? new Date(a.data_prazo_legal_parte).getTime() : 0;
        const dataB = b.data_prazo_legal_parte ? new Date(b.data_prazo_legal_parte).getTime() : 0;
        return dataA - dataB; // Crescente: mais antigas primeiro
      });
    });

    return mapa;
  }, [expedientes, mesSelecionado]);

  const getExpedientesDia = (dia: Date | null) => {
    if (!dia) return [];
    const chave = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`;
    const lista = expedientesPorDia.get(chave) || [];
    const restantes = lista.filter((e) => !pinnedIds.has(e.id));
    return [...semPrazoPendentes, ...vencidosPendentes, ...restantes];
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

  const CustomDayButton = ({ day, modifiers, className, ...props }: React.ComponentProps<typeof DayButton>) => {
    const date = day.date;
    const lista = getExpedientesDia(date);
    return (
      <button
        {...props}
        className={`relative w-full h-full p-1 text-left aspect-square ${className || ''}`}
        onClick={(e) => {
          if (lista.length > 0) {
            e.stopPropagation();
            handleMaisClick(date);
          }
        }}
      >
        <div className="text-xs font-medium mb-1">{date.getDate()}</div>
        {lista.length > 0 && (
          <div className="space-y-1">
            {lista.slice(0, 3).map((expediente) => (
              <div
                key={expediente.id}
                className="text-[10px] bg-primary/10 hover:bg-primary/20 rounded px-1 py-0.5 truncate cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpedienteClick(expediente);
                }}
              >
                {expediente.classe_judicial} {expediente.numero_processo}
              </div>
            ))}
            {lista.length > 3 && (
              <Badge
                variant="secondary"
                className="text-[10px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaisClick(date);
                }}
              >
                +{lista.length - 3} mais
              </Badge>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <Calendar
        month={mesSelecionado}
        onMonthChange={(m) => setMesLocal(m)}
        showOutsideDays
        components={{ DayButton: CustomDayButton as any }}
      />
      <ExpedienteDetalhesDialog
        expediente={expedienteSelecionado}
        expedientes={expedientesDia.length > 0 ? expedientesDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
