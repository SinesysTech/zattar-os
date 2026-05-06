'use client';

/**
 * Card de documento para visualização em grid
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { FileText, MoreVertical, Share2, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Heading, Text } from '@/components/ui/typography';
import type { DocumentoComUsuario } from '@/app/(authenticated)/documentos/domain';

interface DocumentCardProps {
  documento: DocumentoComUsuario;
  onClick: () => void;
}

export function DocumentCard({ documento, onClick }: DocumentCardProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className={cn("inset-card-compact")}>
        <div className="flex items-start justify-between">
          <div className={cn("flex items-start inline-medium flex-1 min-w-0")}>
            <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "rounded-lg bg-primary/10 p-2")}>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Heading level="card" className="truncate">{documento.titulo}</Heading>
              <Text variant="caption" className="mt-1">
                {documento.descricao || 'Sem descrição'}
              </Text>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <Button
                variant="ghost"
                size="icon" aria-label="Mais opções"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Mover para lixeira
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {documento.tags && documento.tags.length > 0 && (
          <div className={cn("flex flex-wrap inline-micro mt-3")}>
            {documento.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className={cn("text-caption")}>
                {tag}
              </Badge>
            ))}
            {documento.tags.length > 3 && (
              <Badge variant="secondary" className={cn("text-caption")}>
                +{documento.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className={cn("flex items-center justify-between mt-4 pt-3 border-t text-caption text-muted-foreground")}>
          <div className={cn("flex items-center inline-micro")}>
            <Users className="h-3 w-3" />
            <span>{documento.criador.nomeCompleto}</span>
          </div>
          <span>
            {formatDistanceToNow(new Date(documento.updated_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
