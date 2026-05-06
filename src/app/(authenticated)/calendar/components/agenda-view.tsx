"use client";

import { cn } from '@/lib/utils';
import { useMemo } from "react";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import { AgendaDaysToShow, CalendarEvent, DefaultStartHour, EventItem, getAgendaEventsForDay } from "./";
import { Calendar, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
  onEventCreate?: (startTime: Date) => void;
}

export function AgendaView({ currentDate, events, onEventSelect, onEventCreate }: AgendaViewProps) {
  const days = useMemo(() => {
    return Array.from({ length: AgendaDaysToShow }, (_, i) => addDays(new Date(currentDate), i));
  }, [currentDate]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Check if there are any days with events
  const hasEvents = days.some((day) => getAgendaEventsForDay(events, day).length > 0);

  return (
    <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "border-border/70 border-t px-4")}>
      {!hasEvents ? (
        <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex min-h-[70svh] flex-col items-center justify-center py-16 text-center")}>
          <Calendar size={32} className="text-muted-foreground/50 mb-2" />
          <h3 className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-medium → className de <Text>/<Heading> */ "text-lg font-medium")}>Nenhum evento encontrado</h3>
          <p className="text-muted-foreground">
            Não há eventos agendados para este período.
          </p>
        </div>
      ) : (
        days.map((day) => {
          const dayEvents = getAgendaEventsForDay(events, day);

          if (dayEvents.length === 0) return null;

          return (
            <div key={day.toString()} className={cn(/* design-system-escape: my-8 margin sem primitiva DS */ "group border-border/70 relative my-8 first:mt-4 border-t")}>
              <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "bg-background absolute -top-3 left-0 flex h-6 items-center gap-1 pe-4 sm:pe-4")}>
                <span
                  className={cn(/* design-system-escape: data-today:font-medium sem equivalente DS; sm:text-xs sem equivalente DS */ "text-[10px] uppercase data-today:font-medium sm:text-xs")}
                  data-today={isToday(day) || undefined}>
                  {format(day, "d 'de' MMM, EEEE", { locale: ptBR })}
                </span>
                {onEventCreate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => {
                          const startTime = new Date(day);
                          startTime.setHours(DefaultStartHour, 0, 0);
                          onEventCreate(startTime);
                        }}
                        aria-label={`Criar evento em ${format(day, "d 'de' MMM", { locale: ptBR })}`}>
                        <PlusIcon size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className={cn("text-caption")}>Novo evento</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "mt-6 space-y-2")}>
                {dayEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    view="agenda"
                    onClick={(e) => handleEventClick(event, e)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
