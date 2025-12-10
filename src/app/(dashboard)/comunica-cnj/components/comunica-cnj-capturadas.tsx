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
import { useIsMobile } from '@/app/_lib/hooks/use-mobile';
import Link from 'next/link';
import type { ComunicacaoCNJ, ComunicacaoItem } from '@/core/comunica-cnj';
import { actionListarComunicacoesCapturadas } from '@/features/captura/actions/comunica-cnj-actions';

/**
 * Componente para listar comunicações já capturadas do banco
 */
export function ComunicaCNJCapturadas() {
  const isMobile = useIsMobile();
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoCNJ[]>([]);
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
      // Montar parâmetros de filtro
      const params: any = {};
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

      if (!result.success) {
        setError(result.error || 'Erro ao buscar comunicações');
        setComunicacoes([]);
        return;
      }

      if (result.data) {
        let comunicacoes = result.data.data || [];
        
        // Filtrar por vinculação se necessário (já que o endpoint não suporta isso diretamente)
        if (vinculacaoFilter === 'vinculadas') {
          comunicacoes = comunicacoes.filter((c: ComunicacaoCNJ) => c.expedienteId !== null);
        }
        
        setComunicacoes(comunicacoes);
      } else {
        setComunicacoes([]);
      }
    } catch (err) {
      console.error('Erro ao buscar comunicações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar comunicações');
      setComunicacoes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComunicacoes();
  }, [searchTerm, tribunalFilter, vinculacaoFilter]);

  // Extrair valores únicos para filtros
  const uniqueTribunais = useMemo(() => {
    const tribunais = new Set(comunicacoes.map((c) => c.siglaTribunal).filter(Boolean));
    return Array.from(tribunais).sort();
  }, [comunicacoes]);

  // Filtrar comunicações
  const filteredComunicacoes = useMemo(() => {
    let result = [...comunicacoes];

    // Filtro por tribunal
    if (tribunalFilter !== 'all') {
      result = result.filter((c) => c.siglaTribunal === tribunalFilter);
    }

    // Filtro por vinculação
    if (vinculacaoFilter === 'vinculadas') {
      result = result.filter((c) => c.expedienteId !== null);
    } else if (vinculacaoFilter === 'nao_vinculadas') {
      result = result.filter((c) => c.expedienteId === null);
    }

    // Filtro por texto (número do processo)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.numeroProcesso.toLowerCase().includes(search) ||
          c.numeroProcessoMascara?.toLowerCase().includes(search)
      );
    }

    // Ordenar por data mais recente
    result.sort((a, b) => {
      const dateA = new Date(a.dataDisponibilizacao);
      const dateB = new Date(b.dataDisponibilizacao);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [comunicacoes, tribunalFilter, vinculacaoFilter, searchTerm]);

  // Converter ComunicacaoCNJ para ComunicacaoItem para o dialog
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
  const ActionButtons = ({ comunicacao }: { comunicacao: ComunicacaoCNJ }) => (
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
                  <TribunalBadge codigo={comunicacao.siglaTribunal} className="text-xs" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comunicacao.dataDisponibilizacao)}
                  </span>
                </div>
                <p className="font-mono text-sm font-medium truncate">
                  {comunicacao.numeroProcessoMascara || comunicacao.numeroProcesso}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {comunicacao.nomeClasse}
                </p>
              </div>
              <ActionButtons comunicacao={comunicacao} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">
                {comunicacao.tipoComunicacao || '-'}
              </Badge>
              {comunicacao.expedienteId ? (
                <Link
                  href={`/expedientes/lista?id=${comunicacao.expedienteId}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Link2 className="h-3 w-3" />
                  #{comunicacao.expedienteId}
                </Link>
              ) : (
                <span className="text-muted-foreground">Sem expediente</span>
              )}
              <span className="text-muted-foreground ml-auto">
                Capturado: {formatDate(comunicacao.createdAt)}
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
                  {formatDate(comunicacao.dataDisponibilizacao)}
                </TableCell>
                <TableCell>
                  <TribunalBadge codigo={comunicacao.siglaTribunal} className="text-xs" />
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {comunicacao.numeroProcessoMascara || comunicacao.numeroProcesso}
                    </span>
                    <span className="text-muted-foreground text-[10px] truncate max-w-[180px]">
                      {comunicacao.nomeClasse}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {comunicacao.tipoComunicacao || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {comunicacao.expedienteId ? (
                    <Link
                      href={`/expedientes/lista?id=${comunicacao.expedienteId}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      #{comunicacao.expedienteId}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(comunicacao.createdAt)}
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
