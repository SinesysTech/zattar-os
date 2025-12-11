import { getYear, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  staggerContainer,
  transition,
} from "@/components/ui/animations";
import { getCalendarCells } from "@/components/calendar/helpers";
import { Audiencia } from '@/features/audiencias';
import { ptBR } from 'date-fns/locale';

interface AudienciasCalendarYearViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]; // Abbreviated Portuguese weekdays

export function AudienciasCalendarYearView({
  audiencias,
  currentDate,
  onDateChange,
}: AudienciasCalendarYearViewProps) {
  const currentYear = getYear(currentDate);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {MONTHS.map((month, monthIndex) => {
          const monthDate = new Date(currentYear, monthIndex, 1);
          const cells = getCalendarCells(monthDate);

          return (
            <motion.div
              key={month}
              className="flex flex-col overflow-hidden rounded-lg border border-border shadow-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: monthIndex * 0.05, ...transition }}
              role="region"
              aria-label={`Calendário de ${month} de ${currentYear}`}
            >
              {/* Month header */}
              <div
                className="cursor-pointer px-3 py-2 text-center text-sm font-semibold transition-colors hover:bg-primary/20 sm:text-base"
                onClick={() => onDateChange(new Date(currentYear, monthIndex, 1))}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onDateChange(new Date(currentYear, monthIndex, 1));
                  }
                }}
                aria-label={`Selecionar ${month}`}
              >
                {month}
              </div>

              <div className="grid grid-cols-7 py-2 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="p-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex-grow grid grid-cols-7 gap-0.5 p-1.5 text-xs">
                {cells.map((cell) => {
                  const isCurrentMonth = isSameMonth(cell.date, monthDate);
                  const isTodayCell = isSameDay(cell.date, new Date());
                  const audienciasForDay = audiencias.filter((aud) =>
                    isSameDay(new Date(aud.dataInicio), cell.date)
                  );
                  const hasAudiencias = audienciasForDay.length > 0;

                  return (
                    <div
                      key={cell.date.toISOString()}
                      className={cn(
                        "relative flex min-h-[2rem] flex-col items-center justify-start p-1",
                        !isCurrentMonth && "text-muted-foreground/40",
                        hasAudiencias && isCurrentMonth
                          ? "cursor-pointer hover:bg-accent/20 hover:rounded-md"
                          : "cursor-default",
                      )}
                      onClick={() => onDateChange(cell.date)} // Navigate to day/month view on click
                    >
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center font-medium",
                          isTodayCell && "rounded-full bg-primary text-primary-foreground",
                        )}
                      >
                        {cell.day}
                      </span>
                      {hasAudiencias && isCurrentMonth && (
                        <span className="text-[0.6rem] font-semibold text-muted-foreground">
                          {audienciasForDay.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
