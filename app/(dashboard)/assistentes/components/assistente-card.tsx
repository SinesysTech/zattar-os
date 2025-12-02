'use client';

// Componente Card para exibir assistente

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Eye, Pencil, Trash } from 'lucide-react';
import type { Assistente } from '@/app/_lib/types/assistentes';
import { formatarDataCriacao, truncarDescricao } from '@/app/_lib/utils/format-assistentes';

interface AssistenteCardProps {
  assistente: Assistente;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  isSuperAdmin?: boolean;
}

export function AssistenteCard({ assistente, onView, onEdit, onDelete, isSuperAdmin = false }: AssistenteCardProps) {
  return (
    <Card className="relative flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm leading-tight truncate">
              {assistente.nome}
            </CardTitle>
          </div>
          <Badge
            tone={assistente.ativo ? 'success' : 'neutral'}
            variant={assistente.ativo ? 'soft' : 'outline'}
            className="text-xs h-5 px-1.5 shrink-0"
          >
            {assistente.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-0.5 text-xs p-2.5 pt-0 pb-7">
        <div className="flex flex-col gap-1.5">
          <Typography.Muted as="span">Descrição:</Typography.Muted>
          <span className="font-medium line-clamp-3" title={assistente.descricao || '-'}>
            {truncarDescricao(assistente.descricao, 100)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Typography.Muted as="span">Criado em:</Typography.Muted>
          <span className="font-medium">
            {formatarDataCriacao(assistente.created_at)}
          </span>
        </div>
      </CardContent>

      {/* Badge de status no canto inferior esquerdo */}
      <div className="absolute bottom-2 left-2">
        <Badge
          tone={assistente.ativo ? 'success' : 'neutral'}
          variant={assistente.ativo ? 'soft' : 'outline'}
          className="text-xs h-5 px-1.5"
        >
          {assistente.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Botões de ação no canto inferior direito */}
      <div className="absolute bottom-2 right-2 flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(assistente)}
          title="Visualizar assistente"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar assistente</span>
        </Button>
        {isSuperAdmin && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(assistente)}
              title="Editar assistente"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar assistente</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(assistente)}
              title="Deletar assistente"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Deletar assistente</span>
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}