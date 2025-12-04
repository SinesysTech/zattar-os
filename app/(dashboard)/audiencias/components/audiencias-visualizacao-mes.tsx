'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { AudienciaDetalhesDialog } from './audiencia-detalhes-dialog';
import type { Audiencia } from '@/backend/types/audiencias/types';

interface AudienciasVisualizacaoMesProps {
  audiencias: Audiencia[];
  isLoading: boolean;
  mesAtual: Date;
}

export function AudienciasVisualizacaoMes({ audiencias, isLoading, mesAtual }: AudienciasVisualizacaoMesProps) {
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const audienciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Audiencia[]>();
    audiencias.forEach((audiencia) => {
      const data = new Date(audiencia.data_inicio);
      const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave)!.push(audiencia);
    });
    return mapa;
  }, [audiencias]);

  const hasAud = (date: Date) => {
    const chave = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (audienciasPorDia.get(chave)?.length || 0) > 0;
  };

  const getAudienciasDia = (date: Date) => {
    const chave = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return audienciasPorDia.get(chave) || [];
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <Calendar
        month={mesAtual}
        showOutsideDays
        mode="single"
        onDayClick={(day) => {
          const lista = getAudienciasDia(day);
          if (lista.length > 0) {
            setAudienciasDia(lista);
            setDialogOpen(true);
          }
        }}
        modifiers={{ hasAud }}
        modifiersClassNames={{ hasAud: 'bg-primary text-primary-foreground' }}
        className="p-2"
      />

      <AudienciaDetalhesDialog
        audiencia={null}
        audiencias={audienciasDia.length > 0 ? audienciasDia : undefined}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
