'use client';
import { useEffect } from 'react';
import { useComunicaCNJStore } from '@/lib/stores/comunica-cnj-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Pause, Play, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComunicacaoScheduleMode, SCHEDULE_MODE_LABELS } from '@/lib/types/comunica-cnj';
export function ComunicacaoSchedulesList() {
  const { schedules, isLoading, fetchSchedules, toggleSchedule, deleteSchedule } = useComunicaCNJStore();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  if (isLoading) { return <div className="p-4 text-center">Carregando...</div>; }
  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (<div className="p-8 text-center border rounded-lg"><p className="text-muted-foreground">Nenhum agendamento encontrado</p></div>) : (
        <div className="grid gap-4">{schedules.map((schedule: any) => (<div key={schedule.id} className="border rounded-lg p-4 space-y-2"><div className="flex items-start justify-between"><div><h3 className="font-semibold">{schedule.name}</h3>{schedule.description && (<p className="text-sm text-muted-foreground">{schedule.description}</p>)}</div><Badge variant={schedule.active ? 'default' : 'secondary'}>{schedule.active ? 'Ativo' : 'Inativo'}</Badge></div><div className="flex gap-2 text-sm text-muted-foreground"><span>Modo: {SCHEDULE_MODE_LABELS[schedule.modo as ComunicacaoScheduleMode]}</span>{schedule.nextRunAt && (<span>Próxima execução: {format(new Date(schedule.nextRunAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>)}{schedule.lastRunAt && (<span>Última execução: {format(new Date(schedule.lastRunAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>)}<span>Execuções: {schedule.runCount}</span></div><div className="flex gap-2"><Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" />Editar</Button><Button variant="outline" size="sm" onClick={() => toggleSchedule(schedule.id)}>{schedule.active ? (<><Pause className="mr-2 h-4 w-4" />Pausar</>) : (<><Play className="mr-2 h-4 w-4" />Ativar</>)}</Button><Button variant="destructive" size="sm" onClick={() => deleteSchedule(schedule.id)}><Trash2 className="mr-2 h-4 w-4" />Deletar</Button></div></div>))}</div>
      )}
    </div>
  );
}
