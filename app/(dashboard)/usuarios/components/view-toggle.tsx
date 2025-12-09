'use client';

// Componente para alternar entre visualização em cards e tabela

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Table } from 'lucide-react';
import type { ViewMode } from '@/app/_lib/types/usuarios';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-background">
      <Button
        variant={viewMode === 'cards' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('cards')}
        className="h-8 w-8"
        aria-label="Visualização em Cards"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onViewModeChange('table')}
        className="h-8 w-8"
        aria-label="Visualização em Tabela"
      >
        <Table className="h-4 w-4" />
      </Button>
    </div>
  );
}

