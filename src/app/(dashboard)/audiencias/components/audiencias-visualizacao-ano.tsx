'use client';

import * as React from 'react';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { AudienciaDetalhesDialog } from './audiencia-detalhes-dialog';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface AudienciasVisualizacaoAnoProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  anoAtual: number;
}

/**
 * Formata o caption do mês em português com "de" minúsculo
 * Ex: "Janeiro de 2025"
 */
const formatarMesAnoCalendario = (date: Date): string => {
  const mes = date.toLocaleDateString('pt-BR', { month: 'long' });
  const ano = date.getFullYear();
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
  return `${mesCapitalizado} de ${ano}`;
};

export function AudienciasVisualizacaoAno({ audiencias, isLoading, anoAtual }: AudienciasVisualizacaoAnoProps) {
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const hasAudFor = React.useCallback((date: Date) => {
    return audiencias.some((aud) => {
      const d = new Date(aud.data_inicio);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
  }, [audiencias]);

  const listFor = React.useCallback((date: Date) => {
    return audiencias.filter((aud) => {
      const d = new Date(aud.data_inicio);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
  }, [audiencias]);

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const months = Array.from({ length: 12 }, (_, m) => new Date(anoAtual, m, 1));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {months.map((month, idx) => (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <Calendar
              locale={ptBR}
              month={month}
              showOutsideDays={false}
              captionLayout="label"
              hideNavigation
              mode="single"
              onDayClick={(day) => {
                if (hasAudFor(day)) {
                  setAudienciasDia(listFor(day));
                  setDialogOpen(true);
                }
              }}
              modifiers={{ hasAud: hasAudFor }}
              formatters={{
                formatCaption: formatarMesAnoCalendario,
              }}
              className="w-full p-2 text-xs [--cell-size:1.75rem]"
              classNames={{
                month_caption: 'text-xs font-medium mb-2 text-center',
                weekdays: 'flex w-full mb-1',
                weekday: 'text-[0.65rem] flex-1 text-center text-muted-foreground',
                week: 'flex w-full',
                day: 'text-[0.7rem] flex-1 p-0.5',
              }}
              modifiersClassNames={{ hasAud: 'bg-primary text-primary-foreground rounded-sm' }}
            />
          </div>
        ))}
      </div>

      <AudienciaDetalhesDialog
        audiencia={null}
        audiencias={audienciasDia.length > 0 ? audienciasDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
