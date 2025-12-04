'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { AudienciaDetalhesDialog } from './audiencia-detalhes-dialog';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface AudienciasVisualizacaoAnoProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  anoAtual: number;
}

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month, idx) => (
          <div key={idx} className="border rounded-lg p-2">
            <Calendar
              month={month}
              showOutsideDays={false}
              captionLayout="label"
              mode="single"
              onDayClick={(day) => {
                if (hasAudFor(day)) {
                  setAudienciasDia(listFor(day));
                  setDialogOpen(true);
                }
              }}
              modifiers={{ hasAud: hasAudFor }}
              modifiersClassNames={{ hasAud: 'bg-primary text-primary-foreground' }}
              className="p-1"
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
