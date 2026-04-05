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
import { PortalBadge, PortalSectionHeader } from "@/app/portal/feature";
import type { AgendamentoPortal, TipoAgendamento, StatusAgendamento } from "./domain";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TipoBadge({ tipo }: { tipo: TipoAgendamento }) {
  if (tipo === "Presencial") {
    return (
      <PortalBadge variant="success" dot={false}>
        <MapPin className="w-3 h-3" />
        Presencial
      </PortalBadge>
    );
  }
  if (tipo === "Híbrida") {
    return (
      <PortalBadge variant="warning" dot={false}>
        <Video className="w-3 h-3" />
        Híbrida
      </PortalBadge>
    );
  }
  return (
    <PortalBadge variant="info" dot={false}>
      <Video className="w-3 h-3" />
      Videoconferência
    </PortalBadge>
  );
}

function StatusBadge({ status }: { status: StatusAgendamento }) {
  if (status === "Realizada") {
    return (
      <PortalBadge variant="neutral" dot={false}>
        <CheckCircle2 className="w-3 h-3" />
        Realizada
      </PortalBadge>
    );
  }
  if (status === "Cancelada") {
    return (
      <PortalBadge variant="danger" dot={false}>
        <XCircle className="w-3 h-3" />
        Cancelada
      </PortalBadge>
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
          <span className="text-xs uppercase tracking-wider text-primary/70 mt-1 block">
            {agendamento.mes}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-0.5">
            {agendamento.titulo}
          </h4>
          <p className="text-sm text-portal-text-muted mb-2.5">
            {agendamento.processo}{" "}
            <span className="text-portal-text-subtle">
              &middot; {agendamento.tribunal}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-portal-text-muted">
              <Clock className="w-3.5 h-3.5" />
              {agendamento.horario}
            </span>
            <TipoBadge tipo={agendamento.tipo} />
            {agendamento.status !== "Agendada" && (
              <StatusBadge status={agendamento.status} />
            )}
          </div>
          {agendamento.local && agendamento.tipo === "Presencial" && (
            <p className="text-xs text-portal-text-muted mt-2 flex items-center gap-1.5">
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
        <PortalSectionHeader
          title="Agendamentos"
          description="Audiências e compromissos do seu processo."
        />
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
      <PortalSectionHeader
        title="Agendamentos"
        description="Audiências e compromissos do seu processo."
      />

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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-portal-text-muted mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                Próximos Agendamentos
                <span className="text-xs font-normal text-portal-text-subtle">
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-portal-text-muted mb-4 flex items-center gap-3">
                <span className="w-1.5 h-5 bg-muted-foreground/20 rounded-full" />
                Histórico
                <span className="text-xs font-normal text-portal-text-subtle">
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
