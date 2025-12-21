'use client';

import * as React from 'react';
import { Bot } from 'lucide-react';
import { AssistenteCard } from './assistente-card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Assistente } from '../../domain';

interface GridViewProps {
  assistentes: Assistente[];
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function GridView({
  assistentes,
  onView,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: GridViewProps) {
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
  );
}
