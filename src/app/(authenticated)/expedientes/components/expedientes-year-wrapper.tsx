'use client';

import { cn } from '@/lib/utils';
import { ExpedientesYearHeatmap } from './expedientes-year-heatmap';
import type { Expediente } from '../domain';

export interface ExpedientesYearWrapperProps {
  expedientes: Expediente[];
  currentDate?: Date;
}

export function ExpedientesYearWrapper({
  expedientes,
  currentDate = new Date(),
}: ExpedientesYearWrapperProps) {
  return (
    <div className={cn("flex flex-col inline-default")}>
      <ExpedientesYearHeatmap
        expedientes={expedientes}
        currentDate={currentDate}
      />
    </div>
  );
}
