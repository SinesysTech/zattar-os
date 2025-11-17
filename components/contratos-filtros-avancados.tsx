'use client';

// Componente de filtros avançados para contratos

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ContratosFilters } from '@/lib/types/contratos';

interface ContratosFiltrosAvancadosProps {
  filters: ContratosFilters;
  onFiltersChange: (filters: ContratosFilters) => void;
  onReset: () => void;
}

export function ContratosFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: ContratosFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);

  const hasFilters =
    filters.areaDireito !== undefined ||
    filters.tipoContrato !== undefined ||
    filters.tipoCobranca !== undefined ||
    filters.status !== undefined;

  const handleFilterChange = (key: keyof ContratosFilters, value: string | null) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          Filtros Avançados
          {hasFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter-area">Área de Direito</Label>
            <Select
              value={filters.areaDireito || ''}
              onValueChange={(value) => handleFilterChange('areaDireito', value || null)}
            >
              <SelectTrigger id="filter-area">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="trabalhista">Trabalhista</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="previdenciario">Previdenciário</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="empresarial">Empresarial</SelectItem>
                <SelectItem value="administrativo">Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-tipo">Tipo de Contrato</Label>
            <Select
              value={filters.tipoContrato || ''}
              onValueChange={(value) => handleFilterChange('tipoContrato', value || null)}
            >
              <SelectTrigger id="filter-tipo">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="ajuizamento">Ajuizamento</SelectItem>
                <SelectItem value="defesa">Defesa</SelectItem>
                <SelectItem value="ato_processual">Ato Processual</SelectItem>
                <SelectItem value="assessoria">Assessoria</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
                <SelectItem value="extrajudicial">Extrajudicial</SelectItem>
                <SelectItem value="parecer">Parecer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-cobranca">Tipo de Cobrança</Label>
            <Select
              value={filters.tipoCobranca || ''}
              onValueChange={(value) => handleFilterChange('tipoCobranca', value || null)}
            >
              <SelectTrigger id="filter-cobranca">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pro_exito">Pró-Êxito</SelectItem>
                <SelectItem value="pro_labore">Pró-Labore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value || null)}
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="em_contratacao">Em Contratação</SelectItem>
                <SelectItem value="contratado">Contratado</SelectItem>
                <SelectItem value="distribuido">Distribuído</SelectItem>
                <SelectItem value="desistencia">Desistência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <>
              <div className="h-px bg-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                Limpar Filtros
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
