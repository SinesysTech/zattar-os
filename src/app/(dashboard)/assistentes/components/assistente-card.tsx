'use client';

// Componente Card para exibir assistente

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash } from 'lucide-react';
import type { Assistente } from '@/app/_lib/types/assistentes';
import { truncarDescricao } from '@/app/_lib/utils/format-assistentes';

interface AssistenteCardProps {
  assistente: Assistente;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AssistenteCard({ assistente, onView, onEdit, onDelete, canEdit = false, canDelete = false }: AssistenteCardProps) {
  const temDescricao = assistente.descricao && assistente.descricao.trim().length > 0;

  return (
    <Card className="group relative flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Botões editar e deletar no canto superior direito - visíveis no hover */}
      {(canEdit || canDelete) && (
        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit(assistente)}
              title="Editar assistente"
            >
              <Pencil className="h-3 w-3 text-blue-600" />
              <span className="sr-only">Editar assistente</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDelete(assistente)}
              title="Deletar assistente"
            >
              <Trash className="h-3 w-3 text-red-500" />
              <span className="sr-only">Deletar assistente</span>
            </Button>
          )}
        </div>
      )}

      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 pr-12">
          {assistente.nome}
        </CardTitle>
      </CardHeader>

      {temDescricao && (
        <CardContent className="flex-1 px-4 pt-0 pb-12">
          <p className="text-xs text-muted-foreground line-clamp-3" title={assistente.descricao || ''}>
            {truncarDescricao(assistente.descricao, 120)}
          </p>
        </CardContent>
      )}

      {!temDescricao && <div className="flex-1 pb-12" />}

      {/* Botão visualizar no canto inferior direito - visível no hover */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onView(assistente)}
          title="Visualizar assistente"
        >
          <Eye className="h-4 w-4 text-emerald-600" />
          <span className="sr-only">Visualizar assistente</span>
        </Button>
      </div>
    </Card>
  );
}
