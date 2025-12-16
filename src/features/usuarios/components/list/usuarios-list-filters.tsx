'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// UFs do Brasil
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

type UfOab = typeof UFS[number];

export interface UsuariosListFiltersProps {
  // Status filter
  ativoFiltro: boolean | 'todos';
  onAtivoChange: (value: boolean | 'todos') => void;
  // UF OAB filter
  ufOabFiltro: UfOab | 'todos';
  onUfOabChange: (value: UfOab | 'todos') => void;
  // Possui OAB filter
  possuiOabFiltro: boolean | 'todos';
  onPossuiOabChange: (value: boolean | 'todos') => void;
}

export function UsuariosListFilters({
  ativoFiltro,
  onAtivoChange,
  ufOabFiltro,
  onUfOabChange,
  possuiOabFiltro,
  onPossuiOabChange,
}: UsuariosListFiltersProps) {
  return (
    <>
      {/* Status Filter */}
      <Select
        value={ativoFiltro === 'todos' ? 'todos' : ativoFiltro.toString()}
        onValueChange={(value) => {
          if (value === 'todos') onAtivoChange('todos');
          else onAtivoChange(value === 'true');
        }}
      >
        <SelectTrigger className="h-10 w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="true">Ativos</SelectItem>
          <SelectItem value="false">Inativos</SelectItem>
        </SelectContent>
      </Select>

      {/* Possui OAB Filter */}
      <Select
        value={possuiOabFiltro === 'todos' ? 'todos' : possuiOabFiltro.toString()}
        onValueChange={(value) => {
          if (value === 'todos') onPossuiOabChange('todos');
          else onPossuiOabChange(value === 'true');
        }}
      >
        <SelectTrigger className="h-10 w-[140px]">
          <SelectValue placeholder="OAB" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="true">Com OAB</SelectItem>
          <SelectItem value="false">Sem OAB</SelectItem>
        </SelectContent>
      </Select>

      {/* UF OAB Filter */}
      <Select
        value={ufOabFiltro}
        onValueChange={(value) => onUfOabChange(value as UfOab | 'todos')}
      >
        <SelectTrigger className="h-10 w-[120px]">
          <SelectValue placeholder="UF OAB" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas UFs</SelectItem>
          {UFS.map((uf) => (
            <SelectItem key={uf} value={uf}>
              {uf}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
