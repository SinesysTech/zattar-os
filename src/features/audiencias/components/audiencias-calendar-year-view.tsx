'use client';

import * as React from 'react';
import { getYear, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  staggerContainer,
  transition,
} from '@/components/ui/animations';

import type { Audiencia } from '../domain';
import { AudienciasDiaDialog } from './audiencias-dia-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasCalendarYearViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Semana começando em segunda-feira (padrão pt-BR)
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calcula os dias do mês com offset para alinhamento correto
 * Semana começa na segunda-feira
 */
function getDiasMes(ano: number, mes: number): (number | null)[] {
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0-6 (dom-sab)
  // Ajuste para semana começando em segunda-feira
  const offset = primeiroDiaSemana === 0 ? 6 : primeiroDiaSemana - 1;

  const dias: (number | null)[] = [];
  for (let i = 0; i < offset; i++) dias.push(null);
  for (let i = 1; i <= ultimoDia; i++) dias.push(i);
  return dias;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasCalendarYearView({
  audiencias,
  currentDate,
  refetch,
}: AudienciasCalendarYearViewProps) {
  const currentYear = getYear(currentDate);

  // Estado do diálogo
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dataSelecionada, setDataSelecionada] = React.useState<Date>(new Date());

  // Mapa de audiências por dia para lookup rápido
  const audienciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Audiencia[]>();
    audiencias.forEach((aud) => {
      const d = new Date(aud.dataInicio);
      if (d.getFullYear() === currentYear) {
        const key = `${d.getMonth()}-${d.getDate()}`;
        const lista = mapa.get(key) || [];
        lista.push(aud);
        mapa.set(key, lista);
      }
    });
    return mapa;
  }, [audiencias, currentYear]);

  // Verifica se um dia tem audiências
  const getAudienciasDoDia = (mes: number, dia: number): Audiencia[] => {
    return audienciasPorDia.get(`${mes}-${dia}`) || [];
  };

  // Handler para clique no dia
  const handleDiaClick = (mes: number, dia: number) => {
    const auds = getAudienciasDoDia(mes, dia);
    if (auds.length > 0) {
      setAudienciasDia(auds);
      setDataSelecionada(new Date(currentYear, mes, dia));
      setDialogOpen(true);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {MONTHS.map((nome, mesIdx) => {
          const dias = getDiasMes(currentYear, mesIdx);

          return (
            <motion.div
              key={nome}
              className="border rounded-lg p-4 bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: mesIdx * 0.05, ...transition }}
              role="region"
              aria-label={`Calendário de ${nome} de ${currentYear}`}
            >
              {/* Header do mês */}
              <div className="font-semibold text-center mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                {nome}
              </div>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAYS.map((d, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid de dias */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {dias.map((dia, i) => {
                  if (!dia) return <span key={i} />;

                  const audienciasDoDia = getAudienciasDoDia(mesIdx, dia);
                  const hasAudiencias = audienciasDoDia.length > 0;
                  const isToday =
                    new Date().toDateString() ===
                    new Date(currentYear, mesIdx, dia).toDateString();

                  return (
                    <div
                      key={i}
                      onClick={() => hasAudiencias && handleDiaClick(mesIdx, dia)}
                      className={cn(
                        'text-xs h-7 w-7 flex items-center justify-center rounded-full transition-all',
                        // Hoje: azul forte
                        isToday && 'bg-blue-600 text-white font-bold',
                        // Com audiências (não é hoje): fundo colorido, clicável
                        !isToday && hasAudiencias && 'bg-primary/20 text-primary font-medium cursor-pointer hover:bg-primary/40',
                        // Sem audiências: texto muted
                        !isToday && !hasAudiencias && 'text-muted-foreground'
                      )}
                      {...(hasAudiencias && {
                        role: 'button',
                        tabIndex: 0,
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleDiaClick(mesIdx, dia);
                          }
                        },
                        'aria-label': `${dia} de ${nome} - ${audienciasDoDia.length} audiência(s)`,
                      })}
                    >
                      {dia}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Diálogo com audiências do dia (wizard) */}
      <AudienciasDiaDialog
        audiencias={audienciasDia}
        data={dataSelecionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
