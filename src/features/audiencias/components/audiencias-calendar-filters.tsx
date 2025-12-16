'use client';

import * as React from 'react';
import { Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

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
// TIPOS
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nomeCompleto?: string | null;
}

export interface CalendarFiltersState {
  status: StatusAudiencia | 'todas';
  modalidade: ModalidadeAudiencia | 'todas';
  trt: CodigoTribunal | 'todas';
  grau: GrauTribunal | 'todas';
  responsavel: number | 'null' | 'todos';
  tipoAudiencia: number | 'todos';
}

export interface AudienciasCalendarFiltersProps {
  filters: CalendarFiltersState;
  onFiltersChange: (filters: CalendarFiltersState) => void;
  usuarios: Usuario[];
  tiposAudiencia: TipoAudiencia[];
}

// =============================================================================
// HELPERS
// =============================================================================

function countActiveFilters(filters: CalendarFiltersState): number {
  let count = 0;
  if (filters.status !== 'todas') count++;
  if (filters.modalidade !== 'todas') count++;
  if (filters.trt !== 'todas') count++;
  if (filters.grau !== 'todas') count++;
  if (filters.responsavel !== 'todos') count++;
  if (filters.tipoAudiencia !== 'todos') count++;
  return count;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function AudienciasCalendarFilters({
  filters,
  onFiltersChange,
  usuarios,
  tiposAudiencia,
}: AudienciasCalendarFiltersProps) {
  const [open, setOpen] = React.useState(false);
  const activeCount = countActiveFilters(filters);

  const handleReset = () => {
    onFiltersChange({
      status: 'todas',
      modalidade: 'todas',
      trt: 'todas',
      grau: 'todas',
      responsavel: 'todos',
      tipoAudiencia: 'todos',
    });
  };

  const updateFilter = <K extends keyof CalendarFiltersState>(
    key: K,
    value: CalendarFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtros</h4>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleReset}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(v) => updateFilter('status', v as StatusAudiencia | 'todas')}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os status</SelectItem>
                {Object.values(StatusAudiencia).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_AUDIENCIA_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modalidade */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modalidade</Label>
            <Select
              value={filters.modalidade}
              onValueChange={(v) => updateFilter('modalidade', v as ModalidadeAudiencia | 'todas')}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as modalidades</SelectItem>
                {Object.values(ModalidadeAudiencia).map((modalidade) => (
                  <SelectItem key={modalidade} value={modalidade}>
                    {MODALIDADE_AUDIENCIA_LABELS[modalidade]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TRT */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tribunal</Label>
            <Select
              value={filters.trt}
              onValueChange={(v) => updateFilter('trt', v as CodigoTribunal | 'todas')}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os TRTs</SelectItem>
                {CODIGO_TRIBUNAL.map((trt) => (
                  <SelectItem key={trt} value={trt}>
                    {trt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grau */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Grau</Label>
            <Select
              value={filters.grau}
              onValueChange={(v) => updateFilter('grau', v as GrauTribunal | 'todas')}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os graus</SelectItem>
                {Object.values(GrauTribunal).map((grau) => (
                  <SelectItem key={grau} value={grau}>
                    {GRAU_TRIBUNAL_LABELS[grau]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Responsável</Label>
            <Select
              value={filters.responsavel.toString()}
              onValueChange={(v) => {
                if (v === 'todos') updateFilter('responsavel', 'todos');
                else if (v === 'null') updateFilter('responsavel', 'null');
                else updateFilter('responsavel', Number(v));
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os responsáveis</SelectItem>
                <SelectItem value="null">Sem responsável</SelectItem>
                {usuarios.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.nomeExibicao || user.nomeCompleto || `Usuário ${user.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Audiência */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de Audiência</Label>
            <Select
              value={filters.tipoAudiencia.toString()}
              onValueChange={(v) => {
                if (v === 'todos') updateFilter('tipoAudiencia', 'todos');
                else updateFilter('tipoAudiencia', Number(v));
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposAudiencia.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
