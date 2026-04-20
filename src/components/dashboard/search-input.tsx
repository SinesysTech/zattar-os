/**
 * SearchInput — Campo de busca com estilo glass
 * ============================================================================
 * Input de texto com ícone de lupa integrado, bordas suaves e focus ring.
 * Adequado para filtros em listas e grids do painel.
 *
 * USO:
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Buscar por nome, CPF, CNPJ..."
 *   />
 * ============================================================================
 */

'use client';

import { Search } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/55 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-56 pl-8 pr-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-card transition-all"
      />
    </div>
  );
}
