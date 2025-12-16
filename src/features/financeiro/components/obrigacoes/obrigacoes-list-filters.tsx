'use client';

/**
 * Obrigações List Filters
 *
 * Componente de filtros para a tabela de obrigações.
 * Usado no filtersSlot do DataTableToolbar.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// =============================================================================
// TIPOS
// =============================================================================

export interface ObrigacoesListFiltersProps {
  tipoFilter: string;
  onTipoChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function ObrigacoesListFilters({
  tipoFilter,
  onTipoChange,
  statusFilter,
  onStatusChange,
}: ObrigacoesListFiltersProps) {
  return (
    <>
      {/* Filtro de Tipo */}
      <Select value={tipoFilter} onValueChange={onTipoChange}>
        <SelectTrigger className="h-10 w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="acordo_recebimento">Acordo - Recebimento</SelectItem>
          <SelectItem value="acordo_pagamento">Acordo - Pagamento</SelectItem>
          <SelectItem value="conta_receber">Conta a Receber</SelectItem>
          <SelectItem value="conta_pagar">Conta a Pagar</SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de Status */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-10 w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="vencida">Vencida</SelectItem>
          <SelectItem value="efetivada">Efetivada</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
