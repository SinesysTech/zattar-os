'use client';

import * as React from 'react';
import { Users, Plus } from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
  DetailSectionAction,
} from '@/components/shared/detail-section';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { cn } from '@/lib/utils';
import type { Contrato, ContratoParte, PapelContratual } from '@/app/(authenticated)/contratos';
import { PAPEL_CONTRATUAL_LABELS } from '@/app/(authenticated)/contratos';

// =============================================================================
// HELPERS
// =============================================================================

function formatCpfCnpj(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return value;
}

// =============================================================================
// ROW PATTERN — dentro do SectionCard
// =============================================================================

interface ParteRowProps {
  nome: string;
  subtitulo: string;
  papel: PapelContratual;
  cpfCnpj?: string | null;
}

const RAIL_COLOR: Record<PapelContratual, string> = {
  autora: 'bg-info',
  re: 'bg-warning',
};

function ParteRow({ nome, subtitulo, papel, cpfCnpj }: ParteRowProps) {
  const cpfFmt = formatCpfCnpj(cpfCnpj);
  const papelLabel = PAPEL_CONTRATUAL_LABELS[papel] ?? papel;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-muted/40 border border-border/30 transition-colors hover:bg-muted/60">
      <span
        aria-hidden="true"
        className={cn('w-0.75 h-6.5 rounded-sm shrink-0', RAIL_COLOR[papel])}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground truncate">{nome}</div>
        <div className="text-[10.5px] text-muted-foreground uppercase tracking-[0.04em] mt-0.5 truncate">
          {subtitulo}
          {cpfFmt ? ` · ${cpfFmt}` : ''}
        </div>
      </div>
      <SemanticBadge category="polo" value={papel} className="text-[10px] shrink-0">
        {papelLabel}
      </SemanticBadge>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface ContratoPartesCardProps {
  contrato: Contrato;
  clienteNome: string;
  onAddParte?: () => void;
}

export function ContratoPartesCard({
  contrato,
  clienteNome,
  onAddParte,
}: ContratoPartesCardProps) {
  // Enriquece a lista de partes garantindo que o cliente canônico aparece
  // (mesmo quando não está em `contrato.partes`, fallback antigo).
  const partesFromTable = contrato.partes;
  const clienteInTable = partesFromTable.some(
    (p) => p.tipoEntidade === 'cliente' && p.entidadeId === contrato.clienteId,
  );

  const clienteFallback: ContratoParte | null = clienteInTable
    ? null
    : {
        id: -1,
        contratoId: contrato.id,
        tipoEntidade: 'cliente',
        entidadeId: contrato.clienteId,
        papelContratual: contrato.papelClienteNoContrato,
        ordem: 0,
        nomeSnapshot: clienteNome,
        cpfCnpjSnapshot: null,
        createdAt: contrato.createdAt,
      };

  const todasPartes: ContratoParte[] = clienteFallback
    ? [clienteFallback, ...partesFromTable]
    : partesFromTable;

  const isEmpty = todasPartes.length === 0;

  return (
    <DetailSection
      icon={Users}
      label="Partes envolvidas"
      action={
        onAddParte ? (
          <DetailSectionAction icon={Plus} onClick={onAddParte}>
            Adicionar
          </DetailSectionAction>
        ) : null
      }
    >
      <DetailSectionCard>
        {isEmpty ? (
          <p className="text-[12.5px] text-muted-foreground/70 italic">
            Nenhuma parte registrada
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {todasPartes.map((parte) => {
              const nome =
                parte.nomeSnapshot ||
                `${parte.tipoEntidade === 'cliente' ? 'Cliente' : 'Parte Contrária'} #${parte.entidadeId}`;
              const tipoLabel = parte.tipoEntidade === 'cliente' ? 'Cliente' : 'Parte Contrária';
              const poloLabel = parte.papelContratual === 'autora' ? 'Polo Ativo' : 'Polo Passivo';

              return (
                <ParteRow
                  key={`${parte.tipoEntidade}-${parte.entidadeId}`}
                  nome={nome}
                  subtitulo={`${tipoLabel} · ${poloLabel}`}
                  papel={parte.papelContratual}
                  cpfCnpj={parte.cpfCnpjSnapshot}
                />
              );
            })}
          </div>
        )}
      </DetailSectionCard>
    </DetailSection>
  );
}
