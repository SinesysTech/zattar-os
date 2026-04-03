"use client";

import {
  Calendar,
  Video,
  Clock,
  MapPin,
  ExternalLink,
  CalendarX,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { AgendamentoPortal, TipoAgendamento, StatusAgendamento } from "./domain";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TipoBadge({ tipo }: { tipo: TipoAgendamento }) {
  if (tipo === "Presencial") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <MapPin className="w-3 h-3" />
        Presencial
      </span>
    );
  }
  if (tipo === "Híbrida") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Video className="w-3 h-3" />
        Híbrida
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      <Video className="w-3 h-3" />
      Videoconferência
    </span>
  );
}

function StatusBadge({ status }: { status: StatusAgendamento }) {
  if (status === "Realizada") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
        <CheckCircle2 className="w-3 h-3" />
        Realizada
      </span>
    );
  }
  if (status === "Cancelada") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive">
        <XCircle className="w-3 h-3" />
        Cancelada
      </span>
    );
  }
  return null;
}

function AgendamentoCard({
  agendamento,
  showActions,
}: {
  agendamento: AgendamentoPortal;
  showActions?: boolean;
}) {
  return (
    <Card className="group transition-all duration-200 hover:border-primary/30">
      <CardContent className="flex flex-col sm:flex-row items-start gap-4 p-5">
        {/* Date block */}
        <div className="shrink-0 bg-primary/10 rounded-xl p-3.5 text-center w-16">
          <span className="text-2xl font-bold text-primary block leading-none">
            {agendamento.dia}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-primary/70 mt-1 block">
            {agendamento.mes}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-0.5">
            {agendamento.titulo}
          </h4>
          <p className="text-sm text-muted-foreground mb-2.5">
            {agendamento.processo}{" "}
            <span className="text-muted-foreground/60">
              &middot; {agendamento.tribunal}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {agendamento.horario}
            </span>
            <TipoBadge tipo={agendamento.tipo} />
            {agendamento.status !== "Agendada" && (
              <StatusBadge status={agendamento.status} />
            )}
          </div>
          {agendamento.local && agendamento.tipo === "Presencial" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {agendamento.local}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions &&
          agendamento.urlVirtual &&
          (agendamento.tipo === "Videoconferência" ||
            agendamento.tipo === "Híbrida") && (
            <div className="shrink-0">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={agendamento.urlVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="w-3.5 h-3.5 mr-1.5" />
                  Entrar
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

interface AgendamentosContentProps {
  proximos: AgendamentoPortal[];
  passados: AgendamentoPortal[];
  error?: string;
}

export function AgendamentosContent({
  proximos,
  passados,
  error,
}: AgendamentosContentProps) {
  if (error) {
    return (
      <div className="space-y-6">
        <Header />
        <EmptyState
          icon={CalendarX}
          title="Erro ao carregar agendamentos"
          description={error}
        />
      </div>
    );
  }

  const isEmpty = proximos.length === 0 && passados.length === 0;

  return (
    <div className="space-y-8">
      <Header />

      {isEmpty ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum agendamento encontrado"
          description="Quando houver audiências vinculadas ao seu processo, elas aparecerão aqui."
        />
      ) : (
        <>
          {/* Upcoming */}
          {proximos.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                Próximos Agendamentos
                <span className="text-xs font-normal text-muted-foreground/60">
                  ({proximos.length})
                </span>
              </h3>
              <div className="space-y-3">
                {proximos.map((a) => (
                  <AgendamentoCard
                    key={a.id}
                    agendamento={a}
                    showActions
                  />
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {passados.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-muted-foreground/20 rounded-full" />
                Histórico
                <span className="text-xs font-normal text-muted-foreground/60">
                  ({passados.length})
                </span>
              </h3>
              <div className="space-y-3">
                {passados.map((a) => (
                  <AgendamentoCard key={a.id} agendamento={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Agendamentos
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Audiências e compromissos do seu processo.
      </p>
    </div>
  );
}
