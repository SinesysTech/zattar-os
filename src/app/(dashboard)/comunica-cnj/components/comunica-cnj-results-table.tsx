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
import { Skeleton } from '@/components/ui/skeleton';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { ComunicacaoDetalhesDialog } from './comunicacao-detalhes-dialog';
import { PdfViewerDialog } from './pdf-viewer-dialog';
import {
  ArrowUpDown,
  Download,
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
import { useIsMobile } from '@/app/_lib/hooks/use-mobile';
import type { ComunicacaoItem } from '@/core/comunica-cnj';

// Configuração de tipos de comunicação (cores + ícones para acessibilidade)
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
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300',
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

// Configuração de tipos de documento (cores + ícones para acessibilidade)
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

// Skeleton loading para mobile (cards) - definido fora do componente
function MobileLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loading para desktop (tabela) - definido fora do componente
function DesktopLoadingSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[100px]">Tribunal</TableHead>
            <TableHead className="w-[200px]">Processo</TableHead>
            <TableHead className="w-[150px]">Tipo</TableHead>
            <TableHead className="w-[120px]">Documento</TableHead>
            <TableHead className="w-[200px]">Autor(es)</TableHead>
            <TableHead className="w-[200px]">Réu(s)</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell>
                <div className="flex justify-center gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Tabela de resultados da consulta CNJ
 */
export function ComunicaCNJResultsTable({
  comunicacoes,
  paginacao,
  isLoading,
}: ComunicaCNJResultsTableProps) {
  const isMobile = useIsMobile();
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

  if (isLoading) {
    return isMobile ? <MobileLoadingSkeleton /> : <DesktopLoadingSkeleton />;
  }

  if (comunicacoes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">Nenhuma comunicação encontrada</p>
      </div>
    );
  }

  // Renderiza a visão mobile
  const renderMobileView = () => (
    <div className="space-y-3">
      {filteredAndSortedComunicacoes.map((comunicacao) => {
        const tipoComunicacaoConfig = getTipoComunicacaoConfig(comunicacao.tipoComunicacao);
        const TipoComunicacaoIcon = tipoComunicacaoConfig.icon;
        const tipoDocumentoConfig = getTipoDocumentoConfig(comunicacao.tipoDocumento);
        const TipoDocumentoIcon = tipoDocumentoConfig.icon;

        return (
          <div
            key={comunicacao.hash}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <TribunalBadge codigo={comunicacao.siglaTribunal} className="text-xs" />
                  <span className="text-xs text-muted-foreground">
                    {comunicacao.dataDisponibilizacaoFormatada || '-'}
                  </span>
                </div>
                <p className="font-mono text-sm font-medium truncate">
                  {comunicacao.numeroProcessoComMascara}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {comunicacao.nomeClasse}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedComunicacao(comunicacao)}
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
                        onClick={() => {
                          setSelectedPdfHash(comunicacao.hash);
                          setPdfViewerOpen(true);
                        }}
                        aria-label="Ver certidão PDF"
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
                          aria-label="Abrir no PJE"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Abrir no PJE</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn('text-xs border flex items-center gap-1', tipoComunicacaoConfig.color)}>
                <TipoComunicacaoIcon className="h-3 w-3" aria-hidden="true" />
                <span>{comunicacao.tipoComunicacao}</span>
              </Badge>
              <Badge className={cn('text-xs border flex items-center gap-1', tipoDocumentoConfig.color)}>
                <TipoDocumentoIcon className="h-3 w-3" aria-hidden="true" />
                <span>{comunicacao.tipoDocumento}</span>
              </Badge>
            </div>
            {((comunicacao.partesAutoras && comunicacao.partesAutoras.length > 0) || (comunicacao.partesReus && comunicacao.partesReus.length > 0)) && (
              <div className="text-xs space-y-1 pt-2 border-t">
                {comunicacao.partesAutoras && comunicacao.partesAutoras.length > 0 && (
                  <p className="line-clamp-1">
                    <span className="text-muted-foreground">Autor: </span>
                    {comunicacao.partesAutoras.join(', ')}
                  </p>
                )}
                {comunicacao.partesReus && comunicacao.partesReus.length > 0 && (
                  <p className="line-clamp-1">
                    <span className="text-muted-foreground">Réu: </span>
                    {comunicacao.partesReus.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Renderiza a visão desktop
  const renderDesktopView = () => (
    <div className="border rounded-lg overflow-x-auto">
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
          {filteredAndSortedComunicacoes.map((comunicacao) => {
            const tipoComunicacaoConfig = getTipoComunicacaoConfig(comunicacao.tipoComunicacao);
            const TipoComunicacaoIcon = tipoComunicacaoConfig.icon;
            const tipoDocumentoConfig = getTipoDocumentoConfig(comunicacao.tipoDocumento);
            const TipoDocumentoIcon = tipoDocumentoConfig.icon;

            return (
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
                  <Badge className={cn('text-xs border flex items-center gap-1', tipoComunicacaoConfig.color)}>
                    <TipoComunicacaoIcon className="h-3 w-3" aria-hidden="true" />
                    <span>{comunicacao.tipoComunicacao}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs border flex items-center gap-1', tipoDocumentoConfig.color)}>
                    <TipoDocumentoIcon className="h-3 w-3" aria-hidden="true" />
                    <span>{comunicacao.tipoDocumento}</span>
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
                            onClick={() => {
                              setSelectedPdfHash(comunicacao.hash);
                              setPdfViewerOpen(true);
                            }}
                            aria-label="Ver certidão PDF"
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
                              aria-label="Abrir no PJE"
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtros - responsivos */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
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

        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
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

        <div className="flex gap-2 sm:ml-auto">
          {(tribunalFilter !== 'all' || tipoFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setTribunalFilter('all');
                setTipoFilter('all');
              }}
              className="flex-1 sm:flex-none"
            >
              Limpar Filtros
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
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

      {/* Conteúdo - Mobile ou Desktop */}
      {isMobile ? renderMobileView() : renderDesktopView()}

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
