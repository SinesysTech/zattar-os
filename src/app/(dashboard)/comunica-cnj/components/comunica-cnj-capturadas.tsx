'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Eye,
  FileText,
  ExternalLink,
  RefreshCw,
  Link2,
  Search,
  FileStack,
} from 'lucide-react';
import { useIsMobile } from '@/core/app/_lib/hooks/use-mobile';
import Link from 'next/link';
import type { ComunicaCNJ, ComunicacaoItem } from '@/backend/comunica-cnj/types/types';

/**
 * Componente para listar comunicações já capturadas do banco
 */
export function ComunicaCNJCapturadas() {
  const isMobile = useIsMobile();
  const [comunicacoes, setComunicacoes] = useState<ComunicaCNJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [tribunalFilter, setTribunalFilter] = useState<string>('all');
  const [vinculacaoFilter, setVinculacaoFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComunicacao, setSelectedComunicacao] = useState<ComunicacaoItem | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfHash, setSelectedPdfHash] = useState<string | null>(null);

  // Buscar comunicações capturadas
  const fetchComunicacoes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Criar endpoint /api/comunica-cnj/capturadas
      // Por enquanto, usar dados mockados
      const response = await fetch('/api/comunica-cnj/capturadas');

      if (!response.ok) {
        // Se o endpoint não existir, usar array vazio
        if (response.status === 404) {
          setComunicacoes([]);
          return;
        }
        throw new Error('Erro ao buscar comunicações');
      }

      const data = await response.json();
      setComunicacoes(data.data || []);
    } catch {
      // Se o endpoint não existir, apenas mostrar estado vazio
      console.warn('Endpoint /api/comunica-cnj/capturadas ainda não implementado');
      setComunicacoes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComunicacoes();
  }, []);

  // Extrair valores únicos para filtros
  const uniqueTribunais = useMemo(() => {
    const tribunais = new Set(comunicacoes.map((c) => c.sigla_tribunal).filter(Boolean));
    return Array.from(tribunais).sort();
  }, [comunicacoes]);

  // Filtrar comunicações
  const filteredComunicacoes = useMemo(() => {
    let result = [...comunicacoes];

    // Filtro por tribunal
    if (tribunalFilter !== 'all') {
      result = result.filter((c) => c.sigla_tribunal === tribunalFilter);
    }

    // Filtro por vinculação
    if (vinculacaoFilter === 'vinculadas') {
      result = result.filter((c) => c.expediente_id !== null);
    } else if (vinculacaoFilter === 'nao_vinculadas') {
      result = result.filter((c) => c.expediente_id === null);
    }

    // Filtro por texto (número do processo)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.numero_processo.toLowerCase().includes(search) ||
          c.numero_processo_mascara?.toLowerCase().includes(search)
      );
    }

    // Ordenar por data mais recente
    result.sort((a, b) => {
      const dateA = new Date(a.data_disponibilizacao);
      const dateB = new Date(b.data_disponibilizacao);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [comunicacoes, tribunalFilter, vinculacaoFilter, searchTerm]);

  // Converter ComunicaCNJ para ComunicacaoItem para o dialog
  const convertToItem = (c: ComunicaCNJ): ComunicacaoItem => ({
    id: c.id_cnj,
    hash: c.hash,
    numeroProcesso: c.numero_processo,
    numeroProcessoComMascara: c.numero_processo_mascara || c.numero_processo,
    siglaTribunal: c.sigla_tribunal,
    nomeClasse: c.nome_classe || '',
    codigoClasse: c.codigo_classe || '',
    tipoComunicacao: c.tipo_comunicacao || '',
    tipoDocumento: c.tipo_documento || '',
    numeroComunicacao: c.numero_comunicacao || 0,
    texto: c.texto || '',
    link: c.link || '',
    nomeOrgao: c.nome_orgao || '',
    idOrgao: c.orgao_id || 0,
    dataDisponibilizacao: c.data_disponibilizacao,
    dataDisponibilizacaoFormatada: new Date(c.data_disponibilizacao).toLocaleDateString('pt-BR'),
    meio: c.meio,
    meioCompleto: c.meio_completo || '',
    ativo: c.ativo,
    status: c.status || '',
    destinatarios: c.destinatarios || [],
    destinatarioAdvogados: c.destinatarios_advogados || [],
    partesAutoras: c.destinatarios?.filter((d) => d.polo === 'A').map((d) => d.nome) || [],
    partesReus: c.destinatarios?.filter((d) => d.polo === 'P').map((d) => d.nome) || [],
    advogados: c.destinatarios_advogados?.map((d) => d.advogado.nome) || [],
    advogadosOab: c.destinatarios_advogados?.map((d) => `${d.advogado.numero_oab}/${d.advogado.uf_oab}`) || [],
  });

  // Formatar data
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  // Skeleton loading para mobile (cards)
  const MobileLoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  // Skeleton loading para desktop (tabela)
  const DesktopLoadingSkeleton = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[80px]">Tribunal</TableHead>
            <TableHead className="w-[200px]">Processo</TableHead>
            <TableHead className="w-[120px]">Tipo</TableHead>
            <TableHead className="w-[150px]">Expediente</TableHead>
            <TableHead className="w-[100px]">Capturado em</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-6 w-14" /></TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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

  if (isLoading) {
    return isMobile ? <MobileLoadingSkeleton /> : <DesktopLoadingSkeleton />;
  }

  // Botões de ação reutilizáveis
  const ActionButtons = ({ comunicacao }: { comunicacao: ComunicaCNJ }) => (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedComunicacao(convertToItem(comunicacao))}
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

  // Versão mobile com cards
  const MobileView = () => (
    <div className="space-y-3">
      {filteredComunicacoes.length === 0 ? (
        <div className="text-center py-8 border rounded-lg text-muted-foreground">
          Nenhuma comunicação encontrada com os filtros selecionados
        </div>
      ) : (
        filteredComunicacoes.map((comunicacao) => (
          <div
            key={comunicacao.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <TribunalBadge codigo={comunicacao.sigla_tribunal} className="text-xs" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comunicacao.data_disponibilizacao)}
                  </span>
                </div>
                <p className="font-mono text-sm font-medium truncate">
                  {comunicacao.numero_processo_mascara || comunicacao.numero_processo}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {comunicacao.nome_classe}
                </p>
              </div>
              <ActionButtons comunicacao={comunicacao} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">
                {comunicacao.tipo_comunicacao || '-'}
              </Badge>
              {comunicacao.expediente_id ? (
                <Link
                  href={`/expedientes/lista?id=${comunicacao.expediente_id}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Link2 className="h-3 w-3" />
                  #{comunicacao.expediente_id}
                </Link>
              ) : (
                <span className="text-muted-foreground">Sem expediente</span>
              )}
              <span className="text-muted-foreground ml-auto">
                Capturado: {formatDate(comunicacao.created_at)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Versão desktop com tabela
  const DesktopView = () => (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[80px]">Tribunal</TableHead>
            <TableHead className="w-[200px]">Processo</TableHead>
            <TableHead className="w-[120px]">Tipo</TableHead>
            <TableHead className="w-[150px]">Expediente</TableHead>
            <TableHead className="w-[100px]">Capturado em</TableHead>
            <TableHead className="w-[100px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredComunicacoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhuma comunicação encontrada com os filtros selecionados
              </TableCell>
            </TableRow>
          ) : (
            filteredComunicacoes.map((comunicacao) => (
              <TableRow key={comunicacao.id}>
                <TableCell className="text-xs">
                  {formatDate(comunicacao.data_disponibilizacao)}
                </TableCell>
                <TableCell>
                  <TribunalBadge codigo={comunicacao.sigla_tribunal} className="text-xs" />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {comunicacao.numero_processo_mascara || comunicacao.numero_processo}
                    </span>
                    <span className="text-muted-foreground text-[10px] truncate max-w-[180px]">
                      {comunicacao.nome_classe}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {comunicacao.tipo_comunicacao || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {comunicacao.expediente_id ? (
                    <Link
                      href={`/expedientes/lista?id=${comunicacao.expediente_id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      #{comunicacao.expediente_id}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(comunicacao.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <ActionButtons comunicacao={comunicacao} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filtros - responsivos */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4 p-4 border rounded-lg bg-card">
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[200px]">
          <Label>Buscar por processo</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Número do processo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[150px]">
          <Label>Tribunal</Label>
          <Select value={tribunalFilter} onValueChange={setTribunalFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueTribunais.map((tribunal) => (
                <SelectItem key={tribunal} value={tribunal}>
                  {tribunal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[180px]">
          <Label>Vinculação</Label>
          <Select value={vinculacaoFilter} onValueChange={setVinculacaoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="vinculadas">Com expediente</SelectItem>
              <SelectItem value="nao_vinculadas">Sem expediente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={fetchComunicacoes} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Contador */}
      <div className="text-sm text-muted-foreground">
        {filteredComunicacoes.length} comunicações capturadas
      </div>

      {/* Estado vazio */}
      {comunicacoes.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <FileStack className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhuma comunicação capturada ainda</p>
          <p className="text-sm text-muted-foreground mt-2">
            Execute uma captura na aba &quot;Consulta&quot; ou configure um agendamento
          </p>
        </div>
      )}

      {/* Conteúdo - Mobile ou Desktop */}
      {comunicacoes.length > 0 && (isMobile ? <MobileView /> : <DesktopView />)}

      {/* Dialogs */}
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
    </div>
  );
}
