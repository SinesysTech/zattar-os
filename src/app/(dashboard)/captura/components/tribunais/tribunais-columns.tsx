'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Clock, ExternalLink } from 'lucide-react';
import type { TribunalConfig } from '@/core/app/_lib/types/tribunais';

/**
 * Formata o tipo de acesso do tribunal
 */
const formatarTipoAcesso = (tipo: string): string => {
  const tipos: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
    unificado: 'Unificado',
    unico: 'Único',
  };
  return tipos[tipo] || tipo;
};

/**
 * Obtém a cor do badge por tipo de acesso
 */
const getBadgeTone = (tipo: string): 'primary' | 'info' | 'success' | 'warning' => {
  const cores: Record<string, 'primary' | 'info' | 'success' | 'warning'> = {
    primeiro_grau: 'primary',
    segundo_grau: 'info',
    unificado: 'success',
    unico: 'warning',
  };
  return cores[tipo] || 'primary';
};

interface TribunaisColumnsProps {
  onEdit: (tribunal: TribunalConfig) => void;
}

/**
 * Cria as colunas da tabela de tribunais
 */
export function criarColunasTribunais({
  onEdit,
}: TribunaisColumnsProps): ColumnDef<TribunalConfig>[] {
  return [
    {
      accessorKey: 'tribunal_codigo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunal" />
      ),
      enableSorting: true,
      size: 250,
      cell: ({ row }) => {
        const tribunal = row.original;
        return (
          <div className="text-sm font-semibold">{tribunal.tribunal_codigo}</div>
        );
      },
    },
    {
      accessorKey: 'tipo_acesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo de Acesso" />
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const tipo = row.getValue('tipo_acesso') as string;
        const label = formatarTipoAcesso(tipo);
        return (
          <div className="flex justify-start">
            <Badge tone={getBadgeTone(tipo)} variant="soft" className="w-fit">
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'sistema',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sistema" />
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm font-medium">{row.getValue('sistema')}</div>
      ),
    },
    {
      accessorKey: 'url_base',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="URL Base" />
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const url = row.getValue('url_base') as string;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground truncate" title={url}>
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-primary hover:text-primary/80"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: 'url_login_seam',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="URL Login" />
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const url = row.getValue('url_login_seam') as string;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground truncate" title={url}>
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-primary hover:text-primary/80"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: 'url_api',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="URL API" />
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const url = row.getValue('url_api') as string;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground truncate" title={url}>
              {url}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-primary hover:text-primary/80"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: 'custom_timeouts',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Timeouts" />
        </div>
      ),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => {
        const timeouts = row.getValue('custom_timeouts');
        const temTimeouts = timeouts && typeof timeouts === 'object' && Object.keys(timeouts).length > 0;

        return (
          <div className="flex justify-center">
            {temTimeouts ? (
              <div className="flex items-center gap-1 text-primary">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-medium">Customizado</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Padrão</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      size: 80,
      cell: ({ row }) => {
        const tribunal = row.original;
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(tribunal)}
              title="Editar Configuração"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
