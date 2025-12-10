'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { isSameDay, parseISO } from 'date-fns';
import { staggerContainer, transition } from '@/components/animations';
import { getCalendarCells, calculateMonthEventPositions } from '@/components/helpers';
import type { Audiencia } from '@/core/audiencias/domain';
import { AudienciasMonthDayCell } from './audiencias-month-day-cell';
import { AudienciaDetailSheet } from './audiencia-detail-sheet';

interface ICalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color?: string;
  originalAudiencia: Audiencia;
}

interface AudienciasCalendarMonthViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function audienciaToICalendarEvent(audiencia: Audiencia): ICalendarEvent {
  return {
    id: audiencia.id.toString(),
    title: audiencia.numeroProcesso,
    startDate: audiencia.dataInicio,
    endDate: audiencia.dataFim,
    allDay: false,
    originalAudiencia: audiencia,
    color: audiencia.status === 'M' ? 'blue' : audiencia.status === 'F' ? 'green' : 'red',
  };
}

function toIEvent(event: ICalendarEvent): {
  id: string;
  startDate: string;
  endDate: string;
  title: string;
  color: string;
  description: string;
  user: { id: number; name: string; avatar: string };
} {
  return {
    id: event.id,
    startDate: event.startDate,
    endDate: event.endDate,
    title: event.title,
    color: event.color || 'blue',
    description: '',
    user: { id: 0, name: '', avatar: '' },
  };
}

export function AudienciasCalendarMonthView({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasCalendarMonthViewProps) {
  const cells = useMemo(() => getCalendarCells(currentDate), [currentDate]);
  const iEvents = useMemo(() => audiencias.map(audienciaToICalendarEvent), [audiencias]);

  const multiDayEvents = useMemo(
    () => iEvents.filter((e) => !isSameDay(parseISO(e.startDate), parseISO(e.endDate))),
    [iEvents]
  );
  const singleDayEvents = useMemo(
    () => iEvents.filter((e) => isSameDay(parseISO(e.startDate), parseISO(e.endDate))),
    [iEvents]
  );

  const eventPositions = useMemo(
    () =>
      calculateMonthEventPositions(
        multiDayEvents.map(toIEvent),
        singleDayEvents.map(toIEvent),
        currentDate
      ),
    [multiDayEvents, singleDayEvents, currentDate]
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedAudienciaId, setSelectedAudienciaId] = useState<number | null>(null);

  const handleAudienciaClick = (audienciaId: number) => {
    setSelectedAudienciaId(audienciaId);
    setSheetOpen(true);
  };

  const handleAddAudiencia = (date: Date) => {
    console.log('Add Audiencia for date:', date);
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer}>
      <div className="grid grid-cols-7 border-t border-l">
        {WEEK_DAYS.map((day, index) => (
          <motion.div
            key={day}
            className="flex items-center justify-center border-b border-r py-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <span className="text-xs font-medium text-t-quaternary">{day}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, index) => {
          const audienciasForCell = audiencias.filter(
            (aud) =>
              isSameDay(parseISO(aud.dataInicio), cell.date) ||
              isSameDay(parseISO(aud.dataFim), cell.date) ||
              (parseISO(aud.dataInicio) < cell.date && parseISO(aud.dataFim) > cell.date)
          );

          return (
            <AudienciasMonthDayCell
              key={index}
              cell={cell}
              audiencias={audienciasForCell}
              eventPositions={eventPositions}
              onAudienciaClick={handleAudienciaClick}
              onAddAudiencia={handleAddAudiencia}
            />
          );
        })}
      </div>
      {selectedAudienciaId !== null && (
        <AudienciaDetailSheet
          audienciaId={selectedAudienciaId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </motion.div>
  );
}
