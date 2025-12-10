'use client';

// Componente de paginação para visualização em cards

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Typography } from '@/components/ui/typography';

interface UsuariosPaginationProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function UsuariosPagination({
  pageIndex,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: UsuariosPaginationProps) {
  const handlePageSizeChange = (newPageSize: string) => {
    onPageSizeChange(parseInt(newPageSize, 10));
  };

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-2">
        <Typography.Muted>
          Mostrando {pageIndex * pageSize + 1} a{' '}
          {Math.min((pageIndex + 1) * pageSize, total)} de {total} resultados
        </Typography.Muted>
        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            {[10, 20, 30, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(0)}
          disabled={pageIndex === 0}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Typography.Muted>
          Página {pageIndex + 1} de {totalPages || 1}
        </Typography.Muted>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={pageIndex >= totalPages - 1}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

