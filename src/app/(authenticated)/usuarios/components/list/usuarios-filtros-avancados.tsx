
'use client';

// Componente de filtros avançados para usuários

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { ListarUsuariosParams } from '../../domain';

interface UsuariosFiltrosAvancadosProps {
  filters: ListarUsuariosParams;
  onFiltersChange: (filters: ListarUsuariosParams) => void;
  onReset: () => void;
}

export function UsuariosFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: UsuariosFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);
  const [oabLocal, setOabLocal] = React.useState(filters.oab || '');
  const [ufOabLocal, setUfOabLocal] = React.useState(filters.ufOab || '');

  const hasFilters =
    filters.ativo !== undefined || filters.oab !== undefined || filters.ufOab !== undefined;

  const handleAtivoChange = (ativo: boolean | null) => {
    onFiltersChange({ ...filters, ativo: ativo ?? undefined });
  };

  const handleOabChange = (value: string) => {
    setOabLocal(value);
    onFiltersChange({ ...filters, oab: value || undefined });
  };

  const handleUfOabChange = (value: string) => {
    setUfOabLocal(value);
    onFiltersChange({ ...filters, ufOab: value || undefined });
  };

  const handleReset = () => {
    setOabLocal('');
    setUfOabLocal('');
    onReset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          Filtros avançados
          {hasFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "w-80 p-4")} align="start">
        <div className={cn("stack-default")}>
          <div className={cn("stack-tight")}>
            <small className="text-sm font-semibold leading-none">Status</small>
            <div className={cn("stack-tight")}>
              <label className={cn("flex items-center inline-tight cursor-pointer")}>
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === true}
                  onChange={() => handleAtivoChange(true)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Ativo</span>
              </label>
              <label className={cn("flex items-center inline-tight cursor-pointer")}>
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === false}
                  onChange={() => handleAtivoChange(false)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Inativo</span>
              </label>
              <label className={cn("flex items-center inline-tight cursor-pointer")}>
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === undefined}
                  onChange={() => handleAtivoChange(null)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Todos</span>
              </label>
            </div>
          </div>

          <div className={cn("stack-tight")}>
            <label htmlFor="oab" className="text-sm font-semibold leading-none">
              Número da OAB
            </label>
            <Input
              id="oab"
              placeholder="Ex: 123456"
              value={oabLocal}
              onChange={(e) => handleOabChange(e.target.value)}
            />
          </div>

          <div className={cn("stack-tight")}>
            <label htmlFor="ufOab" className="text-sm font-semibold leading-none">
              UF da OAB
            </label>
            <Input
              id="ufOab"
              placeholder="Ex: SP"
              value={ufOabLocal}
              onChange={(e) => handleUfOabChange(e.target.value.toUpperCase())}
              maxLength={2}
            />
          </div>

          {hasFilters && (
            <>
              <div className="h-px bg-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleReset}
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
