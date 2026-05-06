'use client';

import { cn } from '@/lib/utils';
import { Calendar, Clock, Video } from 'lucide-react';
import { WidgetContainer } from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { formatarPartes, obterContextoProcesso } from '../shared/processo-display';
import { useDashboard } from '../../hooks';
import type { AudienciaProxima } from '../../domain';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTipoStyles(tipo: string | null): {
  borderColor: string;
  pillColor: string;
  bgColor: string;
} {
  const t = (tipo ?? '').toLowerCase();

  if (t.includes('instrução') || t.includes('instrucao')) {
    return {
      borderColor: 'border-l-primary',
      pillColor: 'bg-primary/15 text-primary',
      bgColor: 'bg-primary/[0.06]',
    };
  }
  if (t.includes('conciliação') || t.includes('conciliacao')) {
    return {
      borderColor: 'border-l-warning',
      pillColor: 'bg-warning/15 text-warning',
      bgColor: '',
    };
  }
  if (t.includes('julgamento')) {
    return {
      borderColor: 'border-l-destructive',
      pillColor: 'bg-destructive/15 text-destructive',
      bgColor: '',
    };
  }
  return {
    borderColor: 'border-l-muted-foreground/30',
    pillColor: 'bg-muted-foreground/10 text-muted-foreground/70',
    bgColor: '',
  };
}

function fmtDataAudiencia(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-8 inline-tight")}>
      <Calendar className="size-8 text-muted-foreground/45" />
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Nenhuma audiência agendada nos próximos 30 dias
      </p>
    </div>
  );
}

// ─── Audiência Item ───────────────────────────────────────────────────────────

function AudienciaItem({
  audiencia,
  isFirst,
}: {
  audiencia: AudienciaProxima;
  isFirst: boolean;
}) {
  const styles = getTipoStyles(audiencia.tipo_audiencia);
  const parte = formatarPartes(audiencia.polo_ativo_nome, audiencia.polo_passivo_nome) ?? 'Partes não informadas';
  const contextoProcesso = obterContextoProcesso(audiencia);

  return (
    <div
      className={`
        border-l-2 pl-3 py-2 rounded-r-lg transition-colors duration-150
        ${styles.borderColor}
        ${isFirst ? `${styles.bgColor} border rounded-lg border-border/20 pr-2` : ''}
      `}
    >
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div className="min-w-0">
          <div className={cn("flex items-center inline-snug flex-wrap")}>
            <span
              className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${styles.pillColor}`}
            >
              {audiencia.tipo_audiencia ?? 'Sem tipo'}
            </span>
            {isFirst && (
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[9px] font-medium text-primary/70 uppercase tracking-wider")}>
                Próxima
              </span>
            )}
          </div>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; leading-tight sem token DS */ "text-[11px] font-medium mt-1 leading-tight")}>{parte}</p>
          {contextoProcesso && (
            <p className={cn(/* design-system-escape: leading-tight sem token DS */ "text-[10px] text-foreground/60 mt-0.5 leading-tight")}>
              {contextoProcesso}
            </p>
          )}
          <p className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-[9px] text-muted-foreground/60 font-mono break-all leading-relaxed mt-0.5")}>
            {audiencia.numero_processo}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={cn("flex items-center inline-micro justify-end text-[10px] text-muted-foreground/60")}>
            <Calendar className="size-2.5" />
            <span>{fmtDataAudiencia(audiencia.data_audiencia)}</span>
          </div>
          {audiencia.hora_audiencia && (
            <div className={cn("flex items-center inline-micro justify-end text-[10px] text-muted-foreground/50 mt-0.5")}>
              <Clock className="size-2.5" />
              <span>{audiencia.hora_audiencia}</span>
            </div>
          )}
        </div>
      </div>
      <div className={cn("flex items-center inline-tight mt-1.5")}>
        {audiencia.url_audiencia_virtual && (
          <a
            href={audiencia.url_audiencia_virtual}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "inline-flex items-center inline-micro text-[9px] font-medium text-primary/80 hover:text-primary transition-colors shrink-0 cursor-pointer")}
          >
            <Video className="size-2.5" />
            <span>Entrar</span>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── ProximasAudiencias ───────────────────────────────────────────────────────

export function ProximasAudiencias() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <WidgetSkeleton size="md" />;
  }

  if (error || !data) {
    return (
      <WidgetContainer
        title="Próximas Audiências"
        icon={Calendar}
        subtitle="Agenda dos próximos 30 dias"
      >
        <p className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-4 text-center")}>
          Não foi possível carregar as audiências.
        </p>
      </WidgetContainer>
    );
  }

  const audiencias = data.proximasAudiencias ?? [];

  return (
    <WidgetContainer
      title="Próximas Audiências"
      icon={Calendar}
      subtitle="Agenda dos próximos 30 dias"
    >
      {audiencias.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cn("stack-tight")}>
          {audiencias.map((a, index) => (
            <AudienciaItem key={a.id} audiencia={a} isFirst={index === 0} />
          ))}
        </div>
      )}
    </WidgetContainer>
  );
}
