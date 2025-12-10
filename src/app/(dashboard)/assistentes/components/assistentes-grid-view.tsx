'use client';

// Componente Grid para exibir assistentes em cards

import * as React from 'react';
import { Bot } from 'lucide-react';
import { AssistenteCard } from './assistente-card';
import { AssistentesPagination } from './assistentes-pagination';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { Assistente } from '@/core/app/_lib/types/assistentes';

interface AssistentesGridViewProps {
  assistentes: Assistente[];
  paginacao?: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AssistentesGridView({
  assistentes,
  paginacao,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  canEdit = false,
  canDelete = false,
}: AssistentesGridViewProps) {
  if (assistentes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bot className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum assistente encontrado.</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {assistentes.map((assistente) => (
          <AssistenteCard
            key={assistente.id}
            assistente={assistente}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>
      
      {paginacao && onPageChange && onPageSizeChange && (
        <AssistentesPagination
          pageIndex={paginacao.pagina - 1}
          pageSize={paginacao.limite}
          total={paginacao.total}
          totalPages={paginacao.totalPaginas}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
