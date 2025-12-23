'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { Assistente } from '../../domain';
import { truncarDescricao } from '../../utils';

interface AssistenteCardProps {
  assistente: Assistente;
  onView: (assistente: Assistente) => void;
  onEdit: (assistente: Assistente) => void;
  onDelete: (assistente: Assistente) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AssistenteCard({ 
  assistente, 
  onView, 
  onEdit, 
  onDelete, 
  canEdit = false, 
  canDelete = false 
}: AssistenteCardProps) {
  const temDescricao = assistente.descricao && assistente.descricao.trim().length > 0;

  return (
    <Card className="relative flex flex-col h-[140px] hover:shadow-md transition-shadow">
      {/* Área clicável para visualização */}
      <div
        className="flex-1 cursor-pointer overflow-hidden"
        onClick={() => onView(assistente)}
      >
        <CardHeader className="px-4 pt-2 pb-2">
          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 pr-8">
            {assistente.nome}
          </CardTitle>
        </CardHeader>

        {temDescricao && (
          <CardContent className="px-4 pt-0 pb-2">
            <p className="text-xs text-muted-foreground line-clamp-3" title={assistente.descricao || ''}>
              {truncarDescricao(assistente.descricao, 120)}
            </p>
          </CardContent>
        )}
      </div>

      {/* Menu dropdown - sempre visível */}
      {(canEdit || canDelete) && (
        <div className="absolute bottom-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Ações do assistente</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(assistente)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(assistente)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  );
}
