'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Clock,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  X,
  SearchX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Heading, Text } from '@/components/ui/typography';
import { GRAU_TRIBUNAL_LABELS, type Expediente, getExpedientePartyNames } from '../domain';
import {
  ExpedienteResponsavelPopover,
  ResponsavelTriggerContent,
} from './expediente-responsavel-popover';
import {
  ExpedienteTipoPopover,
  TipoTriggerContent,
} from './expediente-tipo-popover';
import {
  ExpedientePrazoPopover,
  PrazoTriggerContent,
} from './expediente-prazo-popover';
import { ExpedienteCard } from './expediente-card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
  avatarUrl?: string | null;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export interface ExpedientesControlViewProps {
  expedientes: Expediente[];
  usuariosData: UsuarioData[];
  tiposExpedientesData: TipoExpedienteData[];
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizarData(dataISO: string | null | undefined): Date | null {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente): number | null {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between inline-medium")}>
      <span className="shrink-0 text-overline">{label}</span>
      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-right text-caption font-medium")}>{value}</span>
    </div>
  );
}

function EditableInfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between inline-medium")}>
      <span className={cn(/* design-system-escape: pt-1 padding direcional sem Inset equiv. */ "shrink-0 text-overline pt-1")}>
        {label}
      </span>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
  count,
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  accentClass: string;
}) {
  return (
    <div className={cn("flex items-center inline-tight mb-3")}>
      <Icon className={cn('size-3.5', accentClass)} />
      <h3 className="text-overline">{label}</h3>
      <span className="text-mono-num text-muted-foreground/65">{count}</span>
    </div>
  );
}

// ─── DetailPanel ─────────────────────────────────────────────────────────────

function DetailPanel({
  expediente,
  usuariosData,
  tiposExpedientesData,
  onClose,
  onBaixar,
  onViewDetail,
  onSuccess,
}: {
  expediente: Expediente;
  usuariosData: UsuarioData[];
  tiposExpedientesData: TipoExpedienteData[];
  onClose: () => void;
  onBaixar?: (expediente: Expediente) => void;
  onViewDetail?: (expediente: Expediente) => void;
  onSuccess?: () => void;
}) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[expediente.grau] ?? expediente.grau;

  return (
    <GlassPanel depth={2} className={cn(/* design-system-escape: p-5 → usar <Inset> */ "p-5")}>
      {/* Header */}
      <div className={cn("flex items-start justify-between inline-medium")}>
        <div className="min-w-0">
          <ExpedienteTipoPopover
            expedienteId={expediente.id}
            tipoExpedienteId={expediente.tipoExpedienteId}
            tiposExpedientes={tiposExpedientesData}
            onSuccess={onSuccess}
          >
            <TipoTriggerContent
              tipoExpedienteId={expediente.tipoExpedienteId}
              tiposExpedientes={tiposExpedientesData}
              size="md"
            />
          </ExpedienteTipoPopover>
          <p className="mt-0.5 text-mono-num">
            {expediente.numeroProcesso}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de detalhes"
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-foreground/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5 text-muted-foreground/70" />
        </button>
      </div>

      {/* Info rows */}
      <div className={cn("mt-4 stack-medium")}>
        {expediente.trt && (
          <InfoRow
            label="Tribunal"
            value={
              <SemanticBadge category="tribunal" value={expediente.trt}>
                {expediente.trt}
              </SemanticBadge>
            }
          />
        )}
        <InfoRow
          label="Grau"
          value={
            <SemanticBadge category="grau" value={expediente.grau}>
              {grauLabel}
            </SemanticBadge>
          }
        />
        <EditableInfoRow label="Prazo">
          <ExpedientePrazoPopover
            expedienteId={expediente.id}
            dataPrazoLegalParte={expediente.dataPrazoLegalParte}
            onSuccess={onSuccess}
            align="end"
            allowClear
          >
            <PrazoTriggerContent
              dataPrazoLegalParte={expediente.dataPrazoLegalParte}
              size="sm"
              vencido={expediente.prazoVencido && !expediente.baixadoEm}
            />
          </ExpedientePrazoPopover>
        </EditableInfoRow>
        {expediente.dataCienciaParte && (
          <InfoRow
            label="Ciência"
            value={new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            }).format(new Date(expediente.dataCienciaParte))}
          />
        )}
        <InfoRow
          label="Parte Autora"
          value={getExpedientePartyNames(expediente).autora || '—'}
        />
        <InfoRow
          label="Parte Ré"
          value={getExpedientePartyNames(expediente).re || '—'}
        />
        <EditableInfoRow label="Responsável">
          <ExpedienteResponsavelPopover
            expedienteId={expediente.id}
            responsavelId={expediente.responsavelId}
            usuarios={usuariosData}
            onSuccess={onSuccess}
            align="end"
          >
            <ResponsavelTriggerContent
              responsavelId={expediente.responsavelId}
              usuarios={usuariosData}
              size="sm"
            />
          </ExpedienteResponsavelPopover>
        </EditableInfoRow>
        {expediente.descricaoOrgaoJulgador && (
          <InfoRow label="Órgão" value={expediente.descricaoOrgaoJulgador} />
        )}
      </div>

      {/* Actions */}
      <div className={cn("mt-5 flex flex-col inline-tight")}>
        {onBaixar && (
          <Button
            className={cn("h-9 w-full inline-tight text-caption")}
            onClick={() => onBaixar(expediente)}
          >
            <CheckCircle2 className="size-3.5" />
            Concluir expediente
          </Button>
        )}
        {onViewDetail && (
          <Button
            variant="outline"
            className={cn("h-9 w-full inline-tight text-caption")}
            onClick={() => onViewDetail(expediente)}
          >
            <ExternalLink className="size-3.5" />
            Ver detalhes completos
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExpedientesControlView({
  expedientes,
  usuariosData,
  tiposExpedientesData,
  onBaixar,
  onViewDetail,
  onSuccess,
}: ExpedientesControlViewProps) {
  const [selected, setSelected] = React.useState<Expediente | null>(null);

  // Keep selected in sync when expedientes list changes
  React.useEffect(() => {
    if (!selected) return;
    const atualizado = expedientes.find((e) => e.id === selected.id);
    if (!atualizado) {
      setSelected(null);
    } else if (atualizado !== selected) {
      setSelected(atualizado);
    }
  }, [expedientes, selected]);

  // Group by urgency
  const { vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems } =
    React.useMemo(() => {
      const vencidos: Expediente[] = [];
      const hojeItems: Expediente[] = [];
      const proximosItems: Expediente[] = [];
      const noPrazoItems: Expediente[] = [];
      const semPrazoItems: Expediente[] = [];

      for (const exp of expedientes) {
        const diasRestantes = calcularDiasRestantes(exp);

        if (diasRestantes === null) {
          semPrazoItems.push(exp);
        } else if (exp.prazoVencido || diasRestantes < 0) {
          vencidos.push(exp);
        } else if (diasRestantes === 0) {
          hojeItems.push(exp);
        } else if (diasRestantes <= 3) {
          proximosItems.push(exp);
        } else {
          noPrazoItems.push(exp);
        }
      }

      // Sort each group by dias restantes ascending (vencidos: mais antigos primeiro)
      const sortByDias = (a: Expediente, b: Expediente) => {
        const aDias = calcularDiasRestantes(a);
        const bDias = calcularDiasRestantes(b);
        if (aDias === null && bDias !== null) return 1;
        if (aDias !== null && bDias === null) return -1;
        if (aDias !== null && bDias !== null) return aDias - bDias;
        return (a.numeroProcesso || '').localeCompare(b.numeroProcesso || '');
      };

      vencidos.sort(sortByDias);
      hojeItems.sort(sortByDias);
      proximosItems.sort(sortByDias);
      noPrazoItems.sort(sortByDias);

      return { vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems };
    }, [expedientes]);

  const sections = React.useMemo(
    () =>
      [
        {
          key: 'vencidos',
          label: 'Vencidos',
          icon: AlertTriangle,
          items: vencidos,
          accentClass: 'text-destructive',
        },
        {
          key: 'hoje',
          label: 'Vence hoje',
          icon: Clock,
          items: hojeItems,
          accentClass: 'text-warning',
        },
        {
          key: 'proximos',
          label: 'Próximos 3 dias',
          icon: CalendarClock,
          items: proximosItems,
          accentClass: 'text-primary',
        },
        {
          key: 'prazo',
          label: 'No prazo',
          icon: CheckCircle2,
          items: noPrazoItems,
          accentClass: 'text-muted-foreground/60',
        },
        {
          key: 'semPrazo',
          label: 'Sem prazo definido',
          icon: CircleDashed,
          items: semPrazoItems,
          accentClass: 'text-muted-foreground/65',
        },
      ].filter((s) => s.items.length > 0),
    [vencidos, hojeItems, proximosItems, noPrazoItems, semPrazoItems],
  );

  // Empty state
  if (expedientes.length === 0) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex min-h-52 flex-col items-center justify-center p-8 text-center")}>
        <SearchX className="size-8 text-muted-foreground/20" />
        <Heading level="card" className={cn("mt-4 text-body-sm text-muted-foreground/70")}>
          Nenhum expediente encontrado
        </Heading>
        <Text variant="caption" className="mt-1.5 max-w-sm text-muted-foreground/55">
          Ajuste os filtros ou a busca para ampliar o recorte operacional.
        </Text>
      </GlassPanel>
    );
  }

  const mainContent = (
    <div className={cn("stack-loose")}>
      {sections.map(({ key, label, icon, items, accentClass }) => (
        <section key={key}>
          <SectionHeader
            icon={icon}
            label={label}
            count={items.length}
            accentClass={accentClass}
          />
          <div className={cn(
            /* design-system-escape: gap-2.5 gap sem token DS */ 'grid gap-2.5',
            selected
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}>
            {items.map((exp) => (
              <ExpedienteCard
                key={exp.id}
                expediente={exp}
                density="comfortable"
                usuariosData={usuariosData}
                tiposExpedientesData={tiposExpedientesData}
                selected={selected?.id === exp.id}
                onSelect={() =>
                  setSelected((prev) => (prev?.id === exp.id ? null : exp))
                }
                onBaixar={onBaixar}
                onViewDetail={onViewDetail}
                onSuccess={onSuccess}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  if (!selected) {
    return mainContent;
  }

  return (
    <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "grid gap-5 lg:grid-cols-[1fr_380px]")}>
      {/* Main queue */}
      <div className="min-w-0">{mainContent}</div>

      {/* Detail panel — desktop only, mobile falls back to hover actions on card */}
      <div className="hidden lg:block">
        <div className="sticky top-4 self-start">
          <DetailPanel
            expediente={selected}
            usuariosData={usuariosData}
            tiposExpedientesData={tiposExpedientesData}
            onClose={() => setSelected(null)}
            onBaixar={onBaixar}
            onViewDetail={onViewDetail}
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </div>
  );
}
