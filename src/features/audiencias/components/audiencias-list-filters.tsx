'use client';

import * as React from 'react';
import { FilterPopover, type FilterOption } from '@/features/partes/components/shared';

import {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CODIGO_TRIBUNAL,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  type CodigoTribunal,
  type TipoAudiencia,
} from '../domain';

// =============================================================================
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const MODALIDADE_OPTIONS: readonly FilterOption[] = Object.entries(MODALIDADE_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CODIGO_TRIBUNAL.map(
  (trt) => ({ value: trt, label: trt })
);

// =============================================================================
// TIPOS
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nomeCompleto?: string | null;
}

export interface AudienciasListFiltersProps {
  statusFiltro: StatusAudiencia | 'todas';
  onStatusChange: (value: StatusAudiencia | 'todas') => void;
  modalidadeFiltro: ModalidadeAudiencia | 'todas';
  onModalidadeChange: (value: ModalidadeAudiencia | 'todas') => void;
  trtFiltro: CodigoTribunal | 'todas';
  onTrtChange: (value: CodigoTribunal | 'todas') => void;
  grauFiltro: GrauTribunal | 'todas';
  onGrauChange: (value: GrauTribunal | 'todas') => void;
  responsavelFiltro: number | 'null' | 'todos';
  onResponsavelChange: (value: number | 'null' | 'todos') => void;
  tipoAudienciaFiltro: number | 'todos';
  onTipoAudienciaChange: (value: number | 'todos') => void;
  usuarios: Usuario[];
  tiposAudiencia: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function AudienciasListFilters({
  statusFiltro,
  onStatusChange,
  modalidadeFiltro,
  onModalidadeChange,
  trtFiltro,
  onTrtChange,
  grauFiltro,
  onGrauChange,
  responsavelFiltro,
  onResponsavelChange,
  tipoAudienciaFiltro,
  onTipoAudienciaChange,
  usuarios,
  tiposAudiencia,
}: AudienciasListFiltersProps) {
  // Opções dinâmicas
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

  const tipoAudienciaOptions: readonly FilterOption[] = React.useMemo(
    () => tiposAudiencia.map((t) => ({ value: String(t.id), label: t.descricao })),
    [tiposAudiencia]
  );

  return (
    <>
      <FilterPopover
        label="Status"
        options={STATUS_OPTIONS}
        value={statusFiltro}
        onValueChange={(v) => onStatusChange(v as StatusAudiencia | 'todas')}
        defaultValue="todas"
      />

      <FilterPopover
        label="Modalidade"
        options={MODALIDADE_OPTIONS}
        value={modalidadeFiltro}
        onValueChange={(v) => onModalidadeChange(v as ModalidadeAudiencia | 'todas')}
        defaultValue="todas"
      />

      <FilterPopover
        label="Tribunal"
        options={TRIBUNAL_OPTIONS}
        value={trtFiltro}
        onValueChange={(v) => onTrtChange(v as CodigoTribunal | 'todas')}
        defaultValue="todas"
      />

      <FilterPopover
        label="Grau"
        options={GRAU_OPTIONS}
        value={grauFiltro}
        onValueChange={(v) => onGrauChange(v as GrauTribunal | 'todas')}
        defaultValue="todas"
      />

      <FilterPopover
        label="Responsável"
        options={responsavelOptions}
        value={responsavelFiltro.toString()}
        onValueChange={(v) => {
          if (v === 'todos') onResponsavelChange('todos');
          else if (v === 'null') onResponsavelChange('null');
          else onResponsavelChange(Number(v));
        }}
        defaultValue="todos"
      />

      <FilterPopover
        label="Tipo"
        options={tipoAudienciaOptions}
        value={tipoAudienciaFiltro.toString()}
        onValueChange={(v) => {
          if (v === 'todos') onTipoAudienciaChange('todos');
          else onTipoAudienciaChange(Number(v));
        }}
        defaultValue="todos"
      />
    </>
  );
}
