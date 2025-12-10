'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  variant?: 'standalone' | 'integrated';
  className?: string;
}

export function TablePagination({
  pageIndex,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  variant = 'standalone',
  className,
}: TablePaginationProps) {
  const handlePageChange = (newPageIndex: number) => {
    if (newPageIndex >= 0 && newPageIndex < totalPages) {
      onPageChange(newPageIndex);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    onPageSizeChange(Number(newPageSize));
  };

  if (totalPages <= 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        variant === 'integrated'
          ? 'bg-card border-t border-border rounded-b-lg p-4'
          : 'px-2',
        className
      )}
    >
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando {pageIndex * pageSize + 1} a{' '}
        {Math.min((pageIndex + 1) * pageSize, total)} de {total} resultados
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Itens por página</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
            disabled={isLoading}
          >
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
          <p className="text-sm font-medium whitespace-nowrap">
            Página {pageIndex + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(0)}
              disabled={pageIndex === 0 || isLoading}
            >
              <span className="sr-only">Primeira página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0 || isLoading}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1 || isLoading}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1 || isLoading}
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
