'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { TribunalBadge } from '@/lib/components/badges';
import { ComunicacaoDetalhesDialog } from './comunicacao-detalhes-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  ArrowUpDown,
  Download,
  Eye,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComunicacaoItem } from '@/backend/comunica-cnj/types/types';

// Cores para tipos de comunicação
const TIPO_COMUNICACAO_COLORS: Record<string, string> = {
  Intimação: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
  Citação: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
  Notificação: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Lista de distribuição': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  'Carta Precatória': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
  Aviso: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300',
};

// Cores para tipos de documento
const TIPO_DOCUMENTO_COLORS: Record<string, string> = {
  Despacho: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
  Sentença: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300',
  Acórdão: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300',
  Decisão: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
  Certidão: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300',
};

type SortField = 'data' | 'tribunal' | 'processo';
type SortDirection = 'asc' | 'desc';

interface ComunicaCNJResultsTableProps {
  comunicacoes: ComunicacaoItem[];
  paginacao: {
    pagina: number;
    itensPorPagina: number;
    total: number;
    totalPaginas: number;
  };
  isLoading: boolean;
}

/**
 * Tabela de resultados da consulta CNJ
 */
export function ComunicaCNJResultsTable({
  comunicacoes,
  paginacao,
  isLoading,
}: ComunicaCNJResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);

  // Extrair valores únicos para filtros
  const uniqueTribunais = useMemo(() => {
    const tribunais = new Set(comunicacoes.map((c) => c.siglaTribunal).filter(Boolean));
    return Array.from(tribunais).sort();
  }, [comunicacoes]);

  const uniqueTipos = useMemo(() => {
    const tipos = new Set(comunicacoes.map((c) => c.tipoComunicacao).filter(Boolean));
    return Array.from(tipos).sort();
  }, [comunicacoes]);

  // Filtrar e ordenar
  const filteredAndSortedComunicacoes = useMemo(() => {
    let result = [...comunicacoes];

    // Aplicar filtros
    if (tribunalFilter !== 'all') {
      result = result.filter((c) => c.siglaTribunal === tribunalFilter);
    }
    if (tipoFilter !== 'all') {
      result = result.filter((c) => c.tipoComunicacao === tipoFilter);
    }

    // Ordenar
    result.sort((a, b) => {
      let compareValue = 0;
      switch (sortField) {
        case 'data':
          const dateA = a.dataDisponibilizacao
            ? new Date(a.dataDisponibilizacao)
            : new Date(0);
          const dateB = b.dataDisponibilizacao
            ? new Date(b.dataDisponibilizacao)
            : new Date(0);
          compareValue = dateA.getTime() - dateB.getTime();
          break;
        case 'tribunal':
          compareValue = (a.siglaTribunal || '').localeCompare(b.siglaTribunal || '');
          break;
        case 'processo':
          compareValue = (a.numeroProcesso || '').localeCompare(b.numeroProcesso || '');
          break;
      }
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [comunicacoes, tribunalFilter, tipoFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTipoComunicacaoColor = (tipo: string) => {
    return TIPO_COMUNICACAO_COLORS[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTipoDocumentoColor = (tipo: string) => {
    return TIPO_DOCUMENTO_COLORS[tipo] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Carregando comunicações...</span>
      </div>
    );
  }

  if (comunicacoes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhuma comunicação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 min-w-[180px]">
          <label className="text-sm font-medium">Tribunal</label>
          <Select value={tribunalFilter} onValueChange={setTribunalFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tribunais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tribunais</SelectItem>
              {uniqueTribunais.map((tribunal) => (
                <SelectItem key={tribunal} value={tribunal}>
                  {tribunal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 min-w-[180px]">
          <label className="text-sm font-medium">Tipo de Comunicação</label>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueTipos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(tribunalFilter !== 'all' || tipoFilter !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setTribunalFilter('all');
              setTipoFilter('all');
            }}
          >
            Limpar Filtros
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedComunicacoes.length} comunicações
        {paginacao.total > paginacao.itensPorPagina && (
          <span> (página {paginacao.pagina} de {paginacao.totalPaginas}, total: {paginacao.total})</span>
        )}
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 font-semibold"
                  onClick={() => handleSort('data')}
                >
                  Data
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 font-semibold"
                  onClick={() => handleSort('tribunal')}
                >
                  Tribunal
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 font-semibold"
                  onClick={() => handleSort('processo')}
                >
                  Processo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Documento</TableHead>
              <TableHead className="w-[200px]">Autor(es)</TableHead>
              <TableHead className="w-[200px]">Réu(s)</TableHead>
              <TableHead className="w-[100px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedComunicacoes.map((comunicacao) => (
              <TableRow key={comunicacao.hash}>
                <TableCell className="text-xs">
                  {comunicacao.dataDisponibilizacaoFormatada || '-'}
                </TableCell>
                <TableCell>
                  <TribunalBadge codigo={comunicacao.siglaTribunal} className="text-xs" />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{comunicacao.numeroProcessoComMascara}</span>
                    <span className="text-muted-foreground text-[10px] truncate max-w-[180px]">
                      {comunicacao.nomeClasse}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn('text-xs border', getTipoComunicacaoColor(comunicacao.tipoComunicacao))}
                  >
                    {comunicacao.tipoComunicacao}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn('text-xs border', getTipoDocumentoColor(comunicacao.tipoDocumento))}
                  >
                    {comunicacao.tipoDocumento}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {comunicacao.partesAutoras && comunicacao.partesAutoras.length > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="line-clamp-2 cursor-help">
                            {comunicacao.partesAutoras.join(', ')}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{comunicacao.partesAutoras.join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {comunicacao.partesReus && comunicacao.partesReus.length > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="line-clamp-2 cursor-help">
                            {comunicacao.partesReus.join(', ')}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{comunicacao.partesReus.join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedComunicacao(comunicacao)}
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
                            onClick={() => {
                              setSelectedPdfHash(comunicacao.hash);
                              setPdfViewerOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver certidão PDF</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a
                              href={comunicacao.link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir no PJE</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de detalhes */}
      <ComunicacaoDetalhesDialog
        comunicacao={selectedComunicacao}
        open={!!selectedComunicacao}
        onOpenChange={(open) => !open && setSelectedComunicacao(null)}
        onViewPdf={(hash) => {
          setSelectedPdfHash(hash);
          setPdfViewerOpen(true);
        }}
      />

      {/* Dialog do PDF */}
      <PdfViewerDialog
        hash={selectedPdfHash}
        open={pdfViewerOpen}
        onOpenChange={(open) => {
          setPdfViewerOpen(open);
          if (!open) setSelectedPdfHash(null);
        }}
      />
    </div>
  );
}
