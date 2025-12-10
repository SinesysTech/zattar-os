import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fadeIn, staggerContainer, transition } from '@/components/animations';
import { CalendarTimeline } from '@/components/calendar-time-line'; // Assuming this is generic
import { Audiencia } from '@/core/audiencias/domain';
import { AudienciaCard } from './audiencia-card';
import { ptBR } from 'date-fns/locale';

// This interface is based on the IEvent from the original CalendarWeekView
interface IEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color?: string;
  originalAudiencia: Audiencia; // To carry the full audiencia object
}

interface AudienciasCalendarWeekViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

// Helper to convert Audiencia to IEvent
function audienciaToIEvent(audiencia: Audiencia): IEvent {
  return {
    id: audiencia.id.toString(),
    title: audiencia.numeroProcesso,
    startDate: audiencia.dataInicio,
    endDate: audiencia.dataFim,
    allDay: false, // Audiencias have specific start/end times
    originalAudiencia: audiencia,
    // You can add color logic based on status or modalidade here
    color:
      audiencia.status === 'M'
        ? 'blue'
        : audiencia.status === 'F'
        ? 'green'
        : 'red',
  };
}

// Helper to group events by day for rendering
function groupEventsByDay(events: IEvent[], day: Date) {
  return events.filter(
    (event) =>
      isSameDay(parseISO(event.startDate), day) || isSameDay(parseISO(event.endDate), day)
  );
}

// Helper to sort events by start time
function sortEventsByTime(events: IEvent[]) {
  return [...events].sort((a, b) => {
    const timeA = parseISO(a.startDate).getTime();
    const timeB = parseISO(b.startDate).getTime();
    return timeA - timeB;
  });
}

// Render Events within the hour slots - simplified as we only render cards
const RenderAudienciaEvents = ({ events, day, hour }: { events: IEvent[]; day: Date; hour: number }) => {
  const eventsInHour = events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const hourStart = new Date(day).setHours(hour, 0, 0, 0);
    const hourEnd = new Date(day).setHours(hour, 59, 59, 999);

    return (
      (eventStart.getTime() >= hourStart && eventStart.getTime() < hourEnd) ||
      (eventEnd.getTime() > hourStart && eventEnd.getTime() <= hourEnd) ||
      (eventStart.getTime() < hourStart && eventEnd.getTime() > hourEnd)
    );
  });

  return (
    <>
      {sortEventsByTime(eventsInHour).map((event) => (
        <div
          key={event.id}
          className="absolute left-0 right-0 z-10 mx-1 mb-1"
          style={{
            top: `${parseISO(event.startDate).getMinutes() / 60 * 100}%`,
            height: `${(parseISO(event.endDate).getTime() - parseISO(event.startDate).getTime()) / (1000 * 60 * 60) * 100}%`,
          }}
        >
          <AudienciaCard audiencia={event.originalAudiencia} compact />
        </div>
      ))}
    </>
  );
};


export function AudienciasCalendarWeekView({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasCalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 for full day

  const iEvents = audiencias.map(audienciaToIEvent);

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={fadeIn} transition={transition}>
      <motion.div className="flex-col sm:flex" variants={staggerContainer}>
        {/* Week header */}
        <motion.div
          className="relative z-20 flex border-b"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
        >
          <div className="w-18"></div> {/* Time column header placeholder */}
          <div className="grid flex-1 grid-cols-7 border-l">
            {weekDays.map((day, index) => (
              <motion.span
                key={index}
                className="py-1 sm:py-2 text-center text-xs font-medium text-t-quaternary"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ...transition }}
              >
                <span className="block sm:hidden">
                  {format(day, 'EEE', { locale: ptBR }).charAt(0)}
                  <span className="block font-semibold text-t-secondary text-xs">
                    {format(day, 'd', { locale: ptBR })}
                  </span>
                </span>
                <span className="hidden sm:inline">
                  {format(day, 'EE', { locale: ptBR })}{' '}
                  <span className="ml-1 font-semibold text-t-secondary">
                    {format(day, 'd', { locale: ptBR })}
                  </span>
                </span>
              </motion.span>
            ))}
          </div>
        </motion.div>

        <ScrollArea className="h-[736px]" type="always">
          <div className="flex">
            {/* Hours column */}
            <motion.div className="relative w-18" variants={staggerContainer}>
              {hours.map((hour, index) => (
                <motion.div
                  key={hour}
                  className="relative"
                  style={{ height: '48px' }} // Adjusted for 30 min slots
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02, ...transition }}
                >
                  <div className="absolute -top-3 right-2 flex h-6 items-center">
                    {index !== 0 && (
                      <span className="text-xs text-t-quaternary">
                        {format(new Date().setHours(hour, 0, 0, 0), 'HH:00')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Week grid */}
            <motion.div className="relative flex-1 border-l" variants={staggerContainer}>
              <div className="grid grid-cols-7 divide-x">
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = groupEventsByDay(iEvents, day);

                  return (
                    <motion.div
                      key={dayIndex}
                      className="relative"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: dayIndex * 0.1, ...transition }}
                    >
                      {hours.map((hour, index) => (
                        <motion.div
                          key={hour}
                          className="relative"
                          style={{ height: '48px' }} // 30 min slot
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.01, ...transition }}
                        >
                          {index !== 0 && (
                            <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
                          )}

                          {/* Placeholder for event dropping if needed */}
                          <div className="absolute inset-0 cursor-pointer transition-colors hover:bg-secondary/50" />

                          {/* Render events within this hour slot */}
                          <RenderAudienciaEvents events={dayEvents} day={day} hour={hour} />

                        </motion.div>
                      ))}
                    </motion.div>
                  );
                })}
              </div>
              <CalendarTimeline /> {/* Assuming this is generic */}
            </motion.div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}
