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
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col gap-4")}>
      <ExpedientesYearHeatmap
        expedientes={expedientes}
        currentDate={currentDate}
      />
    </div>
  );
}
