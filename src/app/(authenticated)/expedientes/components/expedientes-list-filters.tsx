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


const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CodigoTribunal.map(
  (trt) => ({ value: trt, label: trt })
);

const ORIGEM_OPTIONS: readonly FilterOption[] = Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const BOLEANO_OPTIONS: readonly FilterOption[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];

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

export interface ExpedientesListFiltersProps {
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
  juizoDigitalFiltro: ('sim' | 'nao')[];
  onJuizoDigitalChange: (value: ('sim' | 'nao')[]) => void;
  segredoJusticaFiltro: ('sim' | 'nao')[];
  onSegredoJusticaChange: (value: ('sim' | 'nao')[]) => void;
  prioridadeProcessualFiltro: ('sim' | 'nao')[];
  onPrioridadeProcessualChange: (value: ('sim' | 'nao')[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpedientesListFilters({
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
  juizoDigitalFiltro,
  onJuizoDigitalChange,
  segredoJusticaFiltro,
  onSegredoJusticaChange,
  prioridadeProcessualFiltro,
  onPrioridadeProcessualChange,
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
      <FilterPopoverMulti
        label="Juízo Digital"
        options={BOLEANO_OPTIONS}
        value={juizoDigitalFiltro}
        onValueChange={(v) => onJuizoDigitalChange(v as ('sim' | 'nao')[])}
        placeholder="Juízo Digital"
      />
      <FilterPopoverMulti
        label="Segredo Justiça"
        options={BOLEANO_OPTIONS}
        value={segredoJusticaFiltro}
        onValueChange={(v) => onSegredoJusticaChange(v as ('sim' | 'nao')[])}
        placeholder="Segredo Justiça"
      />
      <FilterPopoverMulti
        label="Prioridade"
        options={BOLEANO_OPTIONS}
        value={prioridadeProcessualFiltro}
        onValueChange={(v) => onPrioridadeProcessualChange(v as ('sim' | 'nao')[])}
        placeholder="Prioridade Processual"
      />
    </>
  );
}
