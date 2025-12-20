'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  RefreshCw,
  Link2,
} from 'lucide-react';

import { actionListarComunicacoesCapturadas } from '../../actions/comunica-cnj-actions';

import type { ComunicacaoCNJ, ComunicacaoItem } from '../../comunica-cnj/domain';
import { DataShell, DataTableToolbar, DataPagination, DataTable, DataTableColumnHeader } from '@/components/shared/data-shell';
import type { ColumnDef } from '@tanstack/react-table';

// Helper para converter ComunicacaoCNJ para ComunicacaoItem
const convertToItem = (c: ComunicacaoCNJ): ComunicacaoItem => ({
  id: c.idCnj,
  hash: c.hash,
  numeroProcesso: c.numeroProcesso,
  numeroProcessoComMascara: c.numeroProcessoMascara || c.numeroProcesso,
  siglaTribunal: c.siglaTribunal,
  nomeClasse: c.nomeClasse || '',
  codigoClasse: c.codigoClasse || '',
  tipoComunicacao: c.tipoComunicacao || '',
  tipoDocumento: c.tipoDocumento || '',
  numeroComunicacao: c.numeroComunicacao || 0,
  texto: c.texto || '',
  link: c.link || '',
  nomeOrgao: c.nomeOrgao || '',
  idOrgao: c.orgaoId || 0,
  dataDisponibilizacao: c.dataDisponibilizacao,
  dataDisponibilizacaoFormatada: new Date(c.dataDisponibilizacao).toLocaleDateString('pt-BR'),
  meio: c.meio,
  meioCompleto: c.meioCompleto || '',
  ativo: c.ativo,
  status: c.status || '',
  destinatarios: c.destinatarios || [],
  destinatarioAdvogados: c.destinatariosAdvogados || [],
  partesAutoras: c.destinatarios?.filter((d) => d.polo === 'A').map((d) => d.nome) || [],
  partesReus: c.destinatarios?.filter((d) => d.polo === 'P').map((d) => d.nome) || [],
  advogados: c.destinatariosAdvogados?.map((d) => d.advogado.nome) || [],
  advogadosOab: c.destinatariosAdvogados?.map((d) => `${d.advogado.numero_oab}/${d.advogado.uf_oab}`) || [],
});

interface ActionButtonsProps {
  comunicacao: ComunicacaoCNJ;
  onViewDetails: (c: ComunicacaoCNJ) => void;
  onViewPdf: (hash: string) => void;
}

const ActionButtons = ({ comunicacao, onViewDetails, onViewPdf }: ActionButtonsProps) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
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
    </TooltipProvider>

    <TooltipProvider>
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
    </TooltipProvider>

    {comunicacao.link && (
      <TooltipProvider>
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
      </TooltipProvider>
    )}
  </div>
);

/**
 * Componente para listar comunicações já capturadas do banco
 */
export function ComunicaCNJCapturadas() {
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoCNJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Filters
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [vinculacaoFilter, setVinculacaoFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs state
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Buscar comunicações capturadas
  const fetchComunicacoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Reset page index when refetching/filtering
    setPageIndex(0);

    try {
      const params: Record<string, unknown> = {};

      if (searchTerm) {
        params.numeroProcesso = searchTerm;
      }
      if (tribunalFilter !== 'all') {
        params.siglaTribunal = tribunalFilter;
      }
      if (vinculacaoFilter === 'nao_vinculadas') {
        params.semExpediente = true;
      }

      const result = await actionListarComunicacoesCapturadas(params);

      if (result.success && result.data) {
        let items = result.data.data || [];

        // Filtrar por vinculação se necessário (caso a API não tenha filtrado)
        if (vinculacaoFilter === 'vinculadas') {
          items = items.filter((c: ComunicacaoCNJ) => c.expedienteId !== null);
        }

        setComunicacoes(items);
      } else {
        setComunicacoes([]);
        setError(result.error || 'Erro ao buscar comunicações');
      }
    } catch (err) {
      console.error('Erro ao buscar comunicações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar comunicações');
      setComunicacoes([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tribunalFilter, vinculacaoFilter]);

  // Initial fetch
  useEffect(() => {
    fetchComunicacoes();
  }, [fetchComunicacoes]);

  // Extrair valores únicos para filtros
  const uniqueTribunais = useMemo(() => {
    const tribunais = new Set(comunicacoes.map((c) => c.siglaTribunal).filter(Boolean));
    return Array.from(tribunais).sort();
  }, [comunicacoes]);

  // Client-side processing (sorting)
  // Note: Filtering is already done by API/State, but simple client-side search refines it if needed
  // However, since we fetch based on search, we just sort here.
  const processedComunicacoes = useMemo(() => {
    const result = [...comunicacoes];

    // Sort desc by date
    result.sort((a, b) => {
      const dateA = new Date(a.dataDisponibilizacao);
      const dateB = new Date(b.dataDisponibilizacao);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [comunicacoes]);

  // Pagination logic
  const paginatedComunicacoes = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    return processedComunicacoes.slice(startIndex, startIndex + pageSize);
  }, [processedComunicacoes, pageIndex, pageSize]);

  const totalItems = processedComunicacoes.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handlers for actions
  const handleViewDetails = useCallback((c: ComunicacaoCNJ) => {
    setSelectedComunicacao(convertToItem(c));
  }, []);

  const handleViewPdf = useCallback((hash: string) => {
    setSelectedPdfHash(hash);
    setPdfViewerOpen(true);
  }, []);

  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Column Definitions
  const columns = useMemo<ColumnDef<ComunicacaoCNJ>[]>(() => [
    {
      accessorKey: 'dataDisponibilizacao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data" />
      ),
      cell: ({ row }) => (
        <div className="text-xs">
          {formatDate(row.getValue('dataDisponibilizacao'))}
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
      meta: { align: 'center' },
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
              {c.numeroProcessoMascara || c.numeroProcesso}
            </span>
            <span className="text-muted-foreground text-[10px] truncate max-w-[180px]" title={c.nomeClasse || undefined}>
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
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.tipoComunicacao || '-'}
        </Badge>
      ),
      size: 120,
      meta: { align: 'center' },
    },
    {
      accessorKey: 'expedienteId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expediente" />
      ),
      cell: ({ row }) => {
        const id = row.original.expedienteId;
        return id ? (
          <a
            href={`/expedientes/lista?id=${id}`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Link2 className="h-3 w-3" />
            #{id}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        );
      },
      size: 150,
      meta: { align: 'center' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Capturado em" />
      ),
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </div>
      ),
      size: 100,
      meta: { align: 'center' },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <ActionButtons
            comunicacao={row.original}
            onViewDetails={handleViewDetails}
            onViewPdf={handleViewPdf}
          />
        </div>
      ),
      size: 100,
      meta: { align: 'center' },
    },
  ], [handleViewDetails, handleViewPdf]);

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            searchValue={searchTerm}
            onSearchValueChange={setSearchTerm}
            searchPlaceholder="Filtrar por processo..."
            filtersSlot={
              <>
                <Select value={tribunalFilter} onValueChange={setTribunalFilter}>
                  <SelectTrigger className="h-10 w-[130px]">
                    <SelectValue placeholder="Tribunal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueTribunais.map((tribunal) => (
                      <SelectItem key={tribunal} value={tribunal}>
                        {tribunal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={vinculacaoFilter} onValueChange={setVinculacaoFilter}>
                  <SelectTrigger className="h-10 w-[150px]">
                    <SelectValue placeholder="Vinculação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="vinculadas">Com expediente</SelectItem>
                    <SelectItem value="nao_vinculadas">Sem expediente</SelectItem>
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchComunicacoes}
                        className="h-10 w-10"
                        aria-label="Atualizar"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Atualizar lista</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            }
          />
        }
        footer={
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={totalItems}
            totalPages={totalPages}
            onPageChange={setPageIndex}
            onPageSizeChange={setPageSize}
            isLoading={isLoading}
          />
        }
        className="h-full"
      >
        <div className="relative border-t">
          <DataTable
            data={paginatedComunicacoes}
            columns={columns}
            pagination={{
              pageIndex,
              pageSize,
              total: totalItems,
              totalPages,
              onPageChange: setPageIndex,
              onPageSizeChange: setPageSize,
            }}
            isLoading={isLoading}
            hideTableBorder={true}
            emptyMessage="Nenhuma comunicação encontrada com os filtros selecionados."
          />
        </div>
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

