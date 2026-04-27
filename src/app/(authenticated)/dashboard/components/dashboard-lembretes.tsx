'use client';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { Bell, CircleCheck, Trash2 } from 'lucide-react';
import { AddReminderDialog } from '../geral/components/add-reminder-dialog';
import { useReminders } from '../hooks';
import type { Lembrete } from '../domain';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LembretesWidgetProps {
  lembretes?: Lembrete[];
}

export function LembretesWidget({ lembretes: initialReminders = [] }: LembretesWidgetProps) {
  const { lembretes, marcarConcluido, deletar, isPending } = useReminders({
    lembretes: initialReminders,
    concluido: false,
    limite: 3,
  });

  const formatarDataLembrete = (dataISO: string): string => {
    const data = parseISO(dataISO);
    if (isToday(data)) return `Hoje, ${format(data, 'HH:mm', { locale: ptBR })}`;
    if (isTomorrow(data)) return `Amanhã, ${format(data, 'HH:mm', { locale: ptBR })}`;
    return format(data, 'dd/MM/yyyy, HH:mm', { locale: ptBR });
  };

  return (
    <GlassPanel>
      <CardHeader>
        <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Bell className="size-5" />
          Lembretes
        </CardTitle>
        <CardAction>
          <AddReminderDialog />
        </CardAction>
      </CardHeader>
      <CardContent>
        {lembretes.length === 0 ? (
          <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-8 text-center")}>
            <Bell className="size-12 text-muted-foreground/55" />
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "mt-4 text-sm text-muted-foreground")}>Nenhum lembrete por aqui!</p>
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>
              Clique no <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-primary")}>+</span> para criar um.
            </p>
          </div>
        ) : (
          <>
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              {lembretes.slice(0, 3).map((lembrete) => (
                <div
                  key={lembrete.id}
                  className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "flex items-start gap-3 rounded-md border bg-background p-3")}
                >
                  <span
                    className={cn('mt-1.5 size-2 shrink-0 rounded-full', {
                      'bg-muted-foreground': lembrete.prioridade === 'low',
                      'bg-warning': lembrete.prioridade === 'medium',
                      'bg-destructive': lembrete.prioridade === 'high',
                    })}
                  />
                  <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "min-w-0 flex-1 space-y-1")}>
                    <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ 'text-sm', { 'line-through opacity-60': lembrete.concluido })}>
                      {lembrete.texto}
                    </p>
                    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap items-center gap-2")}>
                      <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
                        {formatarDataLembrete(lembrete.data_lembrete)}
                      </span>
                      <Badge variant="outline" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs")}>{lembrete.categoria}</Badge>
                    </div>
                  </div>
                  <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex shrink-0 gap-1")}>
                    <button
                      onClick={() => marcarConcluido(lembrete.id, !lembrete.concluido)}
                      disabled={isPending}
                      className="cursor-pointer transition-colors hover:opacity-80"
                      title={lembrete.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                    >
                      <CircleCheck
                        className={cn('size-4', lembrete.concluido ? 'text-success' : 'text-muted-foreground')}
                      />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Deseja realmente deletar este lembrete?')) {
                          deletar(lembrete.id);
                        }
                      }}
                      disabled={isPending}
                      className="cursor-pointer transition-colors hover:text-destructive"
                      title="Deletar lembrete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {lembretes.length > 3 && (
              <div className="mt-4 text-end">
                <Button variant="link" className="text-muted-foreground hover:text-primary" asChild>
                  <a href="#">Mostrar outros {lembretes.length - 3} lembretes</a>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </GlassPanel>
  );
}
