'use client';

import Link from 'next/link';
import { AlertTriangle, Calendar, ArrowRight, Clock } from 'lucide-react';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatters';
import type { ExpedienteUrgente } from '../../domain';
import { formatarPartes, obterContextoProcesso } from '../../widgets/shared/processo-display';

interface WidgetExpedientesUrgentesProps {
  data: ExpedienteUrgente[];
  loading?: boolean;
  error?: string;
}

function getUrgency(dias: number) {
  if (dias < 0) return { label: `Vencido ${Math.abs(dias)}d`, color: 'bg-destructive text-white', border: 'border-l-destructive', bg: 'bg-destructive/10' };
  if (dias === 0) return { label: 'Vence hoje', color: 'bg-destructive text-white', border: 'border-l-destructive', bg: 'bg-destructive/10' };
  if (dias <= 3) return { label: `${dias}d restantes`, color: 'bg-warning text-white', border: 'border-l-warning', bg: 'bg-warning/10' };
  return { label: `${dias}d restantes`, color: 'bg-info text-white', border: 'border-l-info', bg: '' };
}

export function WidgetExpedientesUrgentes({ data, loading, error }: WidgetExpedientesUrgentesProps) {
  if (loading) {
    return (
      <GlassPanel>
        <CardHeader><Skeleton className="h-5 w-44" /></CardHeader>
        <CardContent className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </CardContent>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <CardHeader><CardTitle>Expedientes Urgentes</CardTitle></CardHeader>
        <CardContent><p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-destructive")}>{error}</p></CardContent>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <CardHeader>
        <CardTitle>Expedientes Urgentes</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `${data.length} pendente${data.length > 1 ? 's' : ''}`
            : 'Todos os expedientes estão em dia'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-8 text-center")}>
            <AlertTriangle className="h-10 w-10 text-muted-foreground/55 mb-3" />
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>Nenhum expediente urgente</p>
          </div>
        ) : (
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            {data.slice(0, 5).map((exp) => {
              const urgency = getUrgency(exp.dias_restantes);
              const partes = formatarPartes(exp.nome_parte_autora, exp.nome_parte_re);
              const contextoProcesso = obterContextoProcesso(exp);

              return (
                <div
                  key={exp.id}
                  className={cn(
                    /* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ 'flex gap-3 rounded-lg border border-l-[3px] p-3 transition-colors hover:bg-muted/50',
                    urgency.border,
                    urgency.bg,
                  )}
                >
                  <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ 'flex flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center min-w-14', urgency.color)}>
                    <Clock className="h-3 w-3 mb-0.5" />
                    <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; leading-tight sem token DS */ "text-[10px] font-bold leading-tight whitespace-nowrap")}>{urgency.label}</span>
                  </div>

                  <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "flex-1 min-w-0 space-y-1")}>
                    <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading>; leading-tight sem token DS */ "text-sm font-medium leading-tight")}>{exp.tipo_expediente}</p>
                    {partes && (
                      <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; leading-tight sem token DS */ "text-xs text-foreground/70 leading-tight")}>{partes}</p>
                    )}
                    {contextoProcesso && (
                      <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; leading-tight sem token DS */ "text-xs text-muted-foreground leading-tight")}>{contextoProcesso}</p>
                    )}
                    <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; leading-relaxed sem token DS */ "text-xs text-muted-foreground font-mono break-all leading-relaxed")}>{exp.numero_processo}</p>
                    <div className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground")}>
                      <span className={cn(/* design-system-escape: gap-1 gap sem token DS */ "inline-flex items-center gap-1")}>
                        <Calendar className="h-3 w-3" />
                        Prazo: {formatDate(exp.prazo_fatal)}
                      </span>
                      {exp.responsavel_nome && <span>{exp.responsavel_nome}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            <Link href="/app/expedientes" className="block">
              <Button variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground hover:text-foreground">
                Ver todos os expedientes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </GlassPanel>
  );
}
