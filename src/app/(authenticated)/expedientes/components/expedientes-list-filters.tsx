'use client';

/**
 * ExpedientesListFilters — Filtros para a DataTable de expedientes
 *
 * Segue o padrão de audiencias-list-filters.tsx:
 * - FilterPopoverMulti para seleção múltipla
 * - Opções estáticas para enums, dinâmicas para usuarios/tipos
 * - Props-based, sem estado próprio
 */

import * as React from 'react';
import { FilterPopoverMulti } from '@/app/(authenticated)/partes/components/shared/filter-popover-multi';
import type { FilterOption } from '@/app/(authenticated)/partes/components/shared/filter-popover';
import {
  GrauTribunal,
  GRAU_TRIBUNAL_LABELS,
  CodigoTribunal,
  OrigemExpediente,
  ORIGEM_EXPEDIENTE_LABELS,
} from '../domain';

// ─── Opções estáticas ────────────────────────────────────────────────────────

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'baixado', label: 'Baixado' },
  { value: 'vencido', label: 'Vencido' },
];

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CodigoTribunal.map(
  (trt) => ({ value: trt, label: trt })
);

const ORIGEM_OPTIONS: readonly FilterOption[] = Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nomeCompleto?: string | null;
}

interface TipoExpediente {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export type StatusFiltro = 'pendente' | 'baixado' | 'vencido';

export interface ExpedientesListFiltersProps {
  statusFiltro: StatusFiltro[];
  onStatusChange: (value: StatusFiltro[]) => void;
  trtFiltro: CodigoTribunal[];
  onTrtChange: (value: CodigoTribunal[]) => void;
  grauFiltro: GrauTribunal[];
  onGrauChange: (value: GrauTribunal[]) => void;
  origemFiltro: OrigemExpediente[];
  onOrigemChange: (value: OrigemExpediente[]) => void;
  responsavelFiltro: (number | 'null')[];
  onResponsavelChange: (value: (number | 'null')[]) => void;
  tipoExpedienteFiltro: number[];
  onTipoExpedienteChange: (value: number[]) => void;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpedientesListFilters({
  statusFiltro,
  onStatusChange,
  trtFiltro,
  onTrtChange,
  grauFiltro,
  onGrauChange,
  origemFiltro,
  onOrigemChange,
  responsavelFiltro,
  onResponsavelChange,
  tipoExpedienteFiltro,
  onTipoExpedienteChange,
  usuarios,
  tiposExpedientes,
}: ExpedientesListFiltersProps) {
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'null', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`,
      })),
    ],
    [usuarios]
  );

  const tipoOptions: readonly FilterOption[] = React.useMemo(
    () =>
      tiposExpedientes.map((t) => ({
        value: String(t.id),
        label: t.tipoExpediente || t.tipo_expediente || `Tipo ${t.id}`,
      })),
    [tiposExpedientes]
  );

  return (
    <>
      <FilterPopoverMulti
        label="Status"
        options={STATUS_OPTIONS}
        value={statusFiltro}
        onValueChange={(v) => onStatusChange(v as StatusFiltro[])}
      />
      <FilterPopoverMulti
        label="Tribunal"
        options={TRIBUNAL_OPTIONS}
        value={trtFiltro}
        onValueChange={(v) => onTrtChange(v as CodigoTribunal[])}
      />
      <FilterPopoverMulti
        label="Grau"
        options={GRAU_OPTIONS}
        value={grauFiltro}
        onValueChange={(v) => onGrauChange(v as GrauTribunal[])}
      />
      <FilterPopoverMulti
        label="Origem"
        options={ORIGEM_OPTIONS}
        value={origemFiltro}
        onValueChange={(v) => onOrigemChange(v as OrigemExpediente[])}
      />
      <FilterPopoverMulti
        label="Responsável"
        options={responsavelOptions}
        value={responsavelFiltro.map(String)}
        onValueChange={(v) => {
          const mapped = v.map((val) => (val === 'null' ? 'null' as const : Number(val)));
          onResponsavelChange(mapped);
        }}
        placeholder="Filtrar por responsável..."
      />
      <FilterPopoverMulti
        label="Tipo"
        options={tipoOptions}
        value={tipoExpedienteFiltro.map(String)}
        onValueChange={(v) => onTipoExpedienteChange(v.map(Number))}
        placeholder="Filtrar por tipo..."
      />
    </>
  );
}
