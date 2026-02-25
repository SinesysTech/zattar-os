'use client';

import { useState, useMemo, useCallback } from 'react';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { ComunicacaoDetalhesDialog } from './detalhes-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  Eye,
  FileText,
  ExternalLink,
  AlertCircle,
  Bell,
  Mail,
  ScrollText,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComunicacaoItem } from '../../comunica-cnj/domain';
import { DataShell, DataTableToolbar, DataTable, DataTableColumnHeader } from '@/components/shared/data-shell';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Configuração de tipos de comunicação (cores + ícones para acessibilidade).
 *
 * @ai-context Cores alinhadas com design system:
 * - red: intimação (crítico)
 * - orange: citação/notificação (warning)
 * - blue: lista de distribuição (info)
 * - purple: carta precatória (formal)
 * - cyan: aviso (info secundário)
 */
const TIPO_COMUNICACAO_CONFIG: Record<string, { color: string; icon: typeof AlertCircle }> = {
  Intimação: {
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertCircle
  },
  Citação: {
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
    icon: Mail
  },
  Notificação: {
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
    icon: Bell
  },
  'Lista de distribuição': {
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    icon: ScrollText
  },
  'Carta Precatória': {
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
    icon: Mail
  },
  Aviso: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300',
    icon: Bell
  },
};

const TIPO_DOCUMENTO_CONFIG: Record<string, { color: string; icon: typeof FileText }> = {
  Despacho: {
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
    icon: FileText
  },
  Sentença: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
    icon: Gavel
  },
  Acórdão: {
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    icon: ScrollText
  },
  Decisão: {
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Gavel
  },
  Certidão: {
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
    icon: FileText
  },
};

const getTipoComunicacaoConfig = (tipo: string) => {
  return TIPO_COMUNICACAO_CONFIG[tipo] || {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: FileText
  };
};

const getTipoDocumentoConfig = (tipo: string) => {
  return TIPO_DOCUMENTO_CONFIG[tipo] || {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: FileText
  };
};

interface ResultActionButtonsProps {
  comunicacao: ComunicacaoItem;
  onViewDetails: (c: ComunicacaoItem) => void;
  onViewPdf: (hash: string) => void;
}

function ResultActionButtons({ comunicacao, onViewDetails, onViewPdf }: ResultActionButtonsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewDetails(comunicacao)}
              aria-label="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver detalhes</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewPdf(comunicacao.hash)}
              aria-label="Ver certidão PDF"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver certidão PDF</TooltipContent>
        </Tooltip>

        {comunicacao.link && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href={comunicacao.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir no PJE"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir no PJE</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface ComunicaCNJResultsTableProps {
  comunicacoes: ComunicacaoItem[];
  isLoading: boolean;
}

/**
 * Tabela de resultados da consulta ao Diário Oficial (CNJ)
 * Utiliza DataShell + DataTable para consistência com o design system
 */
export function ComunicaCNJResultsTable({
  comunicacoes,
  isLoading,
}: ComunicaCNJResultsTableProps) {
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);

  const handleViewDetails = useCallback((c: ComunicacaoItem) => {
    setSelectedComunicacao(c);
  }, []);

  const handleViewPdf = useCallback((hash: string) => {
    setSelectedPdfHash(hash);
    setPdfViewerOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<ComunicacaoItem>[]>(() => [
    {
      accessorKey: 'dataDisponibilizacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.dataDisponibilizacaoFormatada || '-'}
        </div>
      ),
      size: 100,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'siglaTribunal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunal" />
      ),
      cell: ({ row }) => (
        <TribunalBadge codigo={row.getValue('siglaTribunal')} className="text-xs" />
      ),
      size: 80,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex flex-col gap-0.5 font-mono text-xs">
            <span className="font-medium">
              {c.numeroProcessoComMascara}
            </span>
            <span className="text-muted-foreground text-[10px] truncate max-w-45" title={c.nomeClasse || undefined}>
              {c.nomeClasse}
            </span>
          </div>
        );
      },
      size: 200,
      meta: { align: 'left' },
      enableSorting: true,
    },
    {
      accessorKey: 'tipoComunicacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      cell: ({ row }) => {
        const tipo = row.original.tipoComunicacao;
        const config = getTipoComunicacaoConfig(tipo);
        const Icon = config.icon;
        return (
          <Badge className={cn('text-xs border flex items-center gap-1 w-fit', config.color)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{tipo}</span>
          </Badge>
        );
      },
      size: 150,
      meta: { align: 'left' },
    },
    {
      accessorKey: 'tipoDocumento',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Documento" />
      ),
      cell: ({ row }) => {
        const tipo = row.original.tipoDocumento;
        const config = getTipoDocumentoConfig(tipo);
        const Icon = config.icon;
        return (
          <Badge className={cn('text-xs border flex items-center gap-1 w-fit', config.color)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{tipo}</span>
          </Badge>
        );
      },
      size: 120,
      meta: { align: 'left' },
    },
    {
      id: 'partesAutoras',
      accessorFn: (row) => row.partesAutoras?.join(', ') || '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Autor(es)" />
      ),
      cell: ({ row }) => {
        const partes = row.original.partesAutoras;
        if (!partes || partes.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        const text = partes.join(', ');
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs line-clamp-2 cursor-help">{text}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      size: 200,
      meta: { align: 'left' },
    },
    {
      id: 'partesReus',
      accessorFn: (row) => row.partesReus?.join(', ') || '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Réu(s)" />
      ),
      cell: ({ row }) => {
        const partes = row.original.partesReus;
        if (!partes || partes.length === 0) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        const text = partes.join(', ');
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs line-clamp-2 cursor-help">{text}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{text}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      size: 200,
      meta: { align: 'left' },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <ResultActionButtons
          comunicacao={row.original}
          onViewDetails={handleViewDetails}
          onViewPdf={handleViewPdf}
        />
      ),
      size: 100,
      meta: { align: 'left' },
    },
  ], [handleViewDetails, handleViewPdf]);

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            onExport={() => {/* handled by toolbar default with table ref */}}
          />
        }
        className="h-full"
      >
        <DataTable
          data={comunicacoes}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="Nenhuma comunicação encontrada"
        />
      </DataShell>

      <ComunicacaoDetalhesDialog
        comunicacao={selectedComunicacao}
        open={!!selectedComunicacao}
        onOpenChange={(open) => !open && setSelectedComunicacao(null)}
        onViewPdf={(hash) => {
          setSelectedPdfHash(hash);
          setPdfViewerOpen(true);
        }}
      />

      <PdfViewerDialog
        hash={selectedPdfHash}
        open={pdfViewerOpen}
        onOpenChange={(open) => {
          setPdfViewerOpen(open);
          if (!open) setSelectedPdfHash(null);
        }}
      />
    </>
  );
}
