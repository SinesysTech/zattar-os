'use client';

import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { HearingEventCard } from './hearing-event-card';
import { PaymentEventCard } from './payment-event-card';
import {
  ProcessoSinesys,
  AudienciaSinesys,
  AcordoCondenacaoSinesys
} from '../types/sinesys';

interface UpcomingEventsProps {
  audiencias: AudienciaSinesys[];
  pagamentos?: AcordoCondenacaoSinesys[];
  processos?: ProcessoSinesys[];
  maxEvents?: number;
}

type EventItem =
  | (AudienciaSinesys & { type: 'audiencia'; dateObj: Date })
  | (AcordoCondenacaoSinesys & { type: 'pagamento'; dateObj: Date });

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  audiencias,
  pagamentos = [],
  processos = [],
  maxEvents = 6,
}) => {
  // Helper para buscar info do processo
  const getProcessoInfo = (processoId: number) => {
    const proc = processos.find(p => p.id === processoId); // Assumindo que ProcessoSinesys tem id (adicionado no types)
    // Se não tiver ID no ProcessoSinesys, teremos que tentar encontrar de outra forma ou assumir que não temos
    return proc;
  };

  // Filtrar e combinar eventos futuros
  const futureEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset para início do dia

    // Filtrar audiências futuras
    const futureAudiencias = audiencias
      .map(audiencia => {
        // Formato YYYY-MM-DD
        const [year, month, day] = audiencia.data.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return { ...audiencia, type: 'audiencia' as const, dateObj };
      })
      .filter((item) => item.dateObj >= today);

    // Filtrar pagamentos com data de vencimento futura e status pendente/atrasado
    const futurePagamentos = pagamentos
      .filter((pagamento) => {
        if (!pagamento.dataVencimentoPrimeiraParcela) return false;

        // Ignorar se já pago totalmente
        if (pagamento.status === 'pago_total') return false;

        const [year, month, day] = pagamento.dataVencimentoPrimeiraParcela.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj >= today;
      })
      .map(pagamento => {
        const [year, month, day] = pagamento.dataVencimentoPrimeiraParcela.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return { ...pagamento, type: 'pagamento' as const, dateObj };
      });

    // Combinar e ordenar por data
    const allEvents: EventItem[] = [...futureAudiencias, ...futurePagamentos]
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(0, maxEvents);

    return allEvents;
  }, [audiencias, pagamentos, maxEvents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Próximos Eventos
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {futureEvents.length > 0 ? (
          futureEvents.map((event, index) => {
            if (event.type === 'audiencia') {
              return <HearingEventCard key={`audiencia-${index}`} audiencia={event} />;
            } else {
              // Enriquecer dados do pagamento
              const proc = getProcessoInfo(event.processoId);
              const partesNomes = proc
                ? `${proc.partes.polo_ativo} x ${proc.partes.polo_passivo}`
                : undefined;

              return (
                <PaymentEventCard
                  key={`acordo-${index}`}
                  pagamento={event}
                  numeroProcesso={proc?.numero}
                  partesNomes={partesNomes}
                />
              );
            }
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <ShieldCheck className="h-10 w-10 mb-2 opacity-50" />
            <h3 className="text-lg font-medium">Tudo quieto por aqui.</h3>
            <p className="text-sm mt-2 max-w-md">
              Não há audiências ou pagamentos próximos agendados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
