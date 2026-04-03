'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface UsuariosListFiltersProps {
  // Status filter
  ativoFiltro: boolean | 'todos';
  onAtivoChange: (value: boolean | 'todos') => void;
}

export function UsuariosListFilters({
  ativoFiltro,
  onAtivoChange,
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
        <SelectTrigger className="h-10 w-[130px] bg-white dark:bg-gray-950">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="true">Ativos</SelectItem>
          <SelectItem value="false">Inativos</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
