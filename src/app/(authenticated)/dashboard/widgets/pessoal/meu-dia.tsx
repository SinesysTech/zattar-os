'use client';

/**
 * WidgetMeuDia — Widget conectado
 * Fontes:
 *   - useDashboard() → proximasAudiencias (audiências de hoje)
 *   - useReminders() → lembretes de hoje
 * Merge em timeline unificada ordenada por hora.
 */

import { Calendar, Gavel, Bell, CheckSquare } from 'lucide-react';
import { WidgetContainer, InsightBanner } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { formatarPartes, obterContextoProcesso } from '../shared/processo-display';
import { useDashboard, useReminders, isDashboardUsuario } from '../../hooks';
import type { AudienciaProxima, Lembrete } from '../../domain';

// ─── Tipos da Timeline ────────────────────────────────────────────────────────

type TipoEvento = 'audiencia' | 'lembrete' | 'tarefa';

interface EventoTimeline {
  id: string;
  hora: string | null; // HH:MM
  titulo: string;
  subtitulo?: string;
  contextoProcesso?: string;
  numeroProcesso?: string;
  tipo: TipoEvento;
  done: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOJE_STR = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function hojeISO(): string {
  return HOJE_STR;
}

function audienciaParaEvento(a: AudienciaProxima): EventoTimeline {
  const hora = a.hora_audiencia ?? null;

  return {
    id: `aud-${a.id}`,
    hora,
    titulo: a.tipo_audiencia ?? 'Audiência',
    subtitulo: formatarPartes(a.polo_ativo_nome, a.polo_passivo_nome),
    contextoProcesso: obterContextoProcesso(a),
    numeroProcesso: a.numero_processo,
    tipo: 'audiencia',
    done: false,
  };
}

function lembreteParaEvento(l: Lembrete): EventoTimeline {
  const d = new Date(l.data_lembrete);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    id: `lem-${l.id}`,
    hora,
    titulo: l.texto,
    tipo: 'lembrete',
    done: l.concluido,
  };
}

function horaParaMinutos(hora: string | null): number {
  if (!hora) return 9999; // sem hora → final da lista
  const [h, m] = hora.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function agoraEmMinutos(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

function ehHoje(isoStr: string): boolean {
  return isoStr.slice(0, 10) === hojeISO();
}

// ─── Componentes de Ícone de Trilho ──────────────────────────────────────────

function DotAudiencia({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        done
          ? 'border-muted-foreground/20 bg-muted-foreground/20'
          : isNext
          ? 'border-primary bg-primary/30'
          : 'border-primary/50 bg-transparent'
      }`}
    >
      <div
        className={`size-1.5 rounded-full ${
          done ? 'bg-muted-foreground/30' : isNext ? 'bg-primary' : 'bg-primary/60'
        }`}
      />
    </div>
  );
}

function DotLembrete({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-2 rounded-full mt-0.5 shrink-0 ${
        done
          ? 'bg-muted-foreground/25'
          : isNext
          ? 'bg-primary shadow-[0_0_6px_color-mix(in_oklch,var(--primary)_40%,transparent)]'
          : 'bg-border/40'
      }`}
    />
  );
}

function DotTarefa({ done, isNext }: { done: boolean; isNext: boolean }) {
  return (
    <div
      className={`size-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
        done
          ? 'border-muted-foreground/20 bg-muted-foreground/15'
          : isNext
          ? 'border-primary/60 bg-transparent'
          : 'border-border/30 bg-transparent'
      }`}
    >
      {done && <div className="size-1.5 rounded-sm bg-muted-foreground/40" />}
    </div>
  );
}

const TIPO_ICONS: Record<TipoEvento, React.ComponentType<{ className?: string }>> = {
  audiencia: Gavel,
  lembrete: Bell,
  tarefa: CheckSquare,
};

// ─── Widget ───────────────────────────────────────────────────────────────────

export function WidgetMeuDia() {
  const { data, isLoading: isDashLoading } = useDashboard();
  const { lembretes } = useReminders();

  if (isDashLoading) return <WidgetSkeleton size="md" />;

  // Audiências de hoje
  const audienciasHoje: AudienciaProxima[] = data
    ? (data.proximasAudiencias ?? []).filter((a) => ehHoje(a.data_audiencia))
    : [];

  // Lembretes de hoje (não concluídos + concluídos de hoje)
  const lembretesHoje: Lembrete[] = lembretes.filter((l) => ehHoje(l.data_lembrete));

  // Monta timeline
  const eventos: EventoTimeline[] = [
    ...audienciasHoje.map(audienciaParaEvento),
    ...lembretesHoje.map(lembreteParaEvento),
  ].sort((a, b) => horaParaMinutos(a.hora) - horaParaMinutos(b.hora));

  const agora = agoraEmMinutos();

  // Índice do próximo evento não concluído
  const proximoIdx = eventos.findIndex(
    (e) => !e.done && horaParaMinutos(e.hora) >= agora
  );

  if (eventos.length === 0) {
    return (
      <WidgetContainer
        title="Meu Dia"
        icon={Calendar}
        subtitle="Tarefas, lembretes e audiências — hoje"
        depth={2}
      >
        <InsightBanner type="info">
          Nenhum evento agendado para hoje. Aproveite para avançar nas tarefas em aberto.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  // Aviso de audiência se usuário tiver proximasAudiencias mas for admin
  const isUser = data && isDashboardUsuario(data);
  const subtitleStr = isUser
    ? 'Tarefas, lembretes e audiências — hoje'
    : 'Audiências e lembretes — hoje';

  return (
    <WidgetContainer
      title="Meu Dia"
      icon={Calendar}
      subtitle={subtitleStr}
      depth={2}
    >
      <div className="relative isolate pt-1">
        {/* Linha vertical conectora corrigida */}
        <div
          className="absolute left-5 top-4 bottom-4 w-px bg-border/40 -z-10"
          aria-hidden="true"
        />

        <div className="flex flex-col gap-1">
          {eventos.map((evento, i) => {
            const isNext = i === proximoIdx;
            const isDone = evento.done || (evento.hora !== null && horaParaMinutos(evento.hora) < agora);
            const Icon = TIPO_ICONS[evento.tipo];

            return (
              <div
                key={evento.id}
                className={`flex items-start gap-3 px-2 py-2 rounded-xl transition-all duration-150 group ${
                  isNext
                    ? 'bg-primary/[0.04] ring-1 ring-primary/20'
                    : 'hover:bg-muted/40'
                }`}
              >
                {/* Coluna do Ícone Timeline (Centralizado no box w-6) */}
                <div className="w-6 flex justify-center shrink-0 mt-0.5 z-10 bg-background/80 rounded-full group-hover:bg-transparent backdrop-blur-sm">
                  {evento.tipo === 'audiencia' ? (
                    <DotAudiencia done={isDone} isNext={isNext} />
                  ) : evento.tipo === 'lembrete' ? (
                    <DotLembrete done={isDone} isNext={isNext} />
                  ) : (
                    <DotTarefa done={isDone} isNext={isNext} />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                  {/* Informações à esquerda */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className={`text-[11px] font-semibold leading-tight truncate ${
                        isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {evento.titulo}
                    </p>
                    {evento.subtitulo && (
                      <p className={`text-[10px] mt-0.5 leading-tight truncate ${isDone ? 'text-muted-foreground/70' : 'text-foreground/80'}`}>
                        {evento.subtitulo}
                      </p>
                    )}
                    {evento.contextoProcesso && (
                      <p className={`text-[9px] mt-0.5 leading-tight truncate ${isDone ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                        {evento.contextoProcesso}
                      </p>
                    )}
                    {evento.numeroProcesso && (
                      <p className={`text-[9px] font-mono mt-0.5 truncate ${isDone ? 'text-muted-foreground/50' : 'text-muted-foreground/80'}`}>
                        {evento.numeroProcesso}
                      </p>
                    )}
                    
                    {/* Badge de tipo */}
                     <div className="flex items-center gap-1 mt-1.5">
                       <Icon
                         className={`size-3 shrink-0 ${
                           isDone ? 'text-muted-foreground/60' : 'text-primary/70'
                         }`}
                       />
                       <span
                         className={`text-[9px] font-medium uppercase tracking-wider ${
                           isDone ? 'text-muted-foreground/60' : 'text-primary/70'
                         }`}
                       >
                         {evento.tipo}
                       </span>
                     </div>
                  </div>

                  {/* Horário à direita */}
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    {evento.hora && (
                      <span
                        className={`text-xs font-display tabular-nums font-semibold ${
                          isDone ? 'text-muted-foreground/70' : 'text-foreground/90'
                        }`}
                      >
                        {evento.hora}
                      </span>
                    )}
                    {isNext && (
                      <span className="mt-1 text-[9px] uppercase tracking-wider font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded shadow-sm shrink-0">
                        Próximo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}
