'use client';

// Página de expedientes - Lista expedientes pendentes de manifestação

import * as React from 'react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { NovoExpedienteDialog } from './components/novo-expediente-dialog';
import {
  buildExpedientesFilterOptions,
  buildExpedientesFilterGroups,
  parseExpedientesFilters,
} from './components/expedientes-toolbar-filters';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Calendar,
  CalendarDays,
  List,
  RotateCcw,
  FileText,
  Pencil,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExpedientesVisualizacaoSemana } from './components/expedientes-visualizacao-semana';
import { ExpedientesVisualizacaoMes } from './components/expedientes-visualizacao-mes';
import { ExpedientesVisualizacaoAno } from './components/expedientes-visualizacao-ano';
import { usePendentes } from '@/app/_lib/hooks/use-pendentes';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { useTiposExpedientes } from '@/app/_lib/hooks/use-tipos-expedientes';
import { ExpedientesBaixarDialog } from './components/expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from './components/expedientes-reverter-baixa-dialog';
import { ExpedienteVisualizarDialog } from './components/expediente-visualizar-dialog';
import { PdfViewerDialog } from './components/pdf-viewer-dialog';
import { CheckCircle2, Undo2, Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import type { ExpedientesFilters } from '@/app/_lib/types/expedientes';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Retorna a classe CSS de cor para badge da Parte Autora
 */
const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
};

/**
 * Retorna a classe CSS de cor para badge da Parte Ré
 */
const getParteReColorClass = (): string => {
  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
};

/**
 * Retorna a classe CSS de cor para badge do TRT
 */
const getTRTColorClass = (trt: string): string => {
  const trtColors: Record<string, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'TRT5': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'TRT6': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
  };
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Retorna a classe CSS de cor para badge do grau
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata o grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

/**
 * Retorna a classe CSS de cor para badge do tipo de expediente
 * Rotaciona entre cores disponíveis baseado no ID do tipo
 */
const getTipoExpedienteColorClass = (tipoId: number): string => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
  ];

  // Rotacionar cores baseado no ID
  const index = (tipoId - 1) % colors.length;
  return colors[index];
};

/**
 * Componente para editar tipo e descrição de um expediente
 */
function TipoDescricaoCell({
  expediente,
  onSuccess,
  tiposExpedientes,
  isLoadingTipos
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
  isLoadingTipos?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = React.useState(false);
  const [tipoSelecionado, setTipoSelecionado] = React.useState<string>(
    expediente.tipo_expediente_id?.toString() || 'null'
  );
  const [descricao, setDescricao] = React.useState<string>(
    expediente.descricao_arquivos || ''
  );

  // Sincronizar estado quando expediente mudar
  React.useEffect(() => {
    setTipoSelecionado(expediente.tipo_expediente_id?.toString() || 'null');
    setDescricao(expediente.descricao_arquivos || '');
  }, [expediente.tipo_expediente_id, expediente.descricao_arquivos]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tipoExpedienteId = tipoSelecionado === 'null' ? null : parseInt(tipoSelecionado, 10);
      const descricaoArquivos = descricao.trim() || null;

      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/tipo-descricao`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoExpedienteId,
          descricaoArquivos,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar tipo e descrição');
      }

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar tipo e descrição:', error);
      // Em caso de erro, ainda fechamos o popover e atualizamos para mostrar o estado atual
      setIsOpen(false);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const tipoExpediente = tiposExpedientes.find(t => t.id === expediente.tipo_expediente_id);
  const tipoNome = tipoExpediente ? tipoExpediente.tipo_expediente : 'Sem tipo';
  const descricaoExibicao = expediente.descricao_arquivos || '-';
  const temDocumento = !!expediente.arquivo_key; // Usar arquivo_key ao invés de arquivo_url

  return (
    <>
      <div className="relative min-h-10 max-w-[300px] group">
        <div className="w-full min-h-10 flex items-start gap-2 pr-8 py-2">
          {/* Conteúdo tipo e descrição */}
          <div className="flex flex-col items-start justify-start gap-1.5 flex-1">
            <Badge
              variant="outline"
              className={`w-fit text-xs shrink-0 ${expediente.tipo_expediente_id ? getTipoExpedienteColorClass(expediente.tipo_expediente_id) : ''}`}
            >
              {tipoNome}
            </Badge>
            <div className="text-xs text-muted-foreground w-full wrap-break-word whitespace-pre-wrap leading-relaxed indent-0 text-justify">
              {descricaoExibicao}
            </div>
          </div>
        </div>

        {/* Botão de edição - aparece no hover */}
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1"
          title="Editar tipo e descrição"
          onClick={() => setIsOpen(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>

        {/* Botão de visualização do documento - posicionado no canto inferior direito */}
        {temDocumento && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPdfViewerOpen(true);
            }}
            className="absolute bottom-1 right-1 p-1 hover:bg-accent rounded-md transition-colors z-10"
            title="Visualizar documento"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
          </button>
        )}
      </div>

      {/* Dialog de edição */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[min(92vw,31.25rem)]">
          <DialogHeader>
            <DialogTitle>Editar Tipo e Descrição</DialogTitle>
            <DialogDescription>
              Atualize o tipo de expediente e a descrição dos arquivos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Expediente</label>
              <Select
                value={tipoSelecionado}
                onValueChange={setTipoSelecionado}
                disabled={isLoading || tiposExpedientes.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo">
                    {tipoSelecionado === 'null'
                      ? 'Sem tipo'
                      : tiposExpedientes.find(t => t.id.toString() === tipoSelecionado)?.tipo_expediente || 'Selecione o tipo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="null">Sem tipo</SelectItem>
                  {tiposExpedientes.length > 0 ? (
                    tiposExpedientes.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.tipo_expediente}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isLoadingTipos ? 'Carregando tipos...' : 'Nenhum tipo disponível'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição / Arquivos</label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite a descrição ou referência aos arquivos..."
                disabled={isLoading}
                rows={5}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização do PDF */}
      <PdfViewerDialog
        open={isPdfViewerOpen}
        onOpenChange={setIsPdfViewerOpen}
        fileKey={expediente.arquivo_key}
        documentTitle={`Documento - ${expediente.numero_processo}`}
      />
    </>
  );
}

/**
 * Componente de header para a coluna Prazo com opções de ordenação
 */
function PrazoColumnHeader({
  onSort,
}: {
  onSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Prazo</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,12.5rem)] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Data de Início
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_ciencia_parte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_ciencia_parte', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Data de Fim
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_prazo_legal_parte', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('data_prazo_legal_parte', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Componente de header para a coluna Processo com opções de ordenação
 */
function ProcessoColumnHeader({
  onSort,
}: {
  onSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Processo</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,13.75rem)] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Tribunal
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('trt', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('trt', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Grau
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('grau', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('grau', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Órgão Julgador
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('descricao_orgao_julgador', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('descricao_orgao_julgador', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Classe Judicial
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('classe_judicial', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('classe_judicial', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Componente de header para a coluna Partes com opções de ordenação
 */
function PartesColumnHeader({
  onSort,
}: {
  onSort: (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span className="text-sm font-medium">Partes</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1 h-4 w-4"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2" align="center">
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Ordenar por Parte Autora
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_autora', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_autora', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              Ordenar por Parte Ré
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_re', 'asc');
                setIsOpen(false);
              }}
            >
              ↑ Crescente
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => {
                onSort('nome_parte_re', 'desc');
                setIsOpen(false);
              }}
            >
              ↓ Decrescente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Componente de header para a coluna Responsável com ordenação direta
 */
function ResponsavelColumnHeader({
  onSort,
}: {
  onSort: (direction: 'asc' | 'desc') => void;
}) {
  const [currentDirection, setCurrentDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleClick = () => {
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    setCurrentDirection(newDirection);
    onSort(newDirection);
  };

  return (
    <div className="flex items-center justify-center">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-accent"
        onClick={handleClick}
      >
        <span className="text-sm font-medium">Responsável</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 h-4 w-4"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </Button>
    </div>
  );
}

/**
 * Feriados nacionais brasileiros fixos (formato MM-DD)
 */
const feriadosNacionaisFixos = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
];

/**
 * Verifica se uma data é feriado nacional fixo
 */
const ehFeriadoNacional = (data: Date): boolean => {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const dataFormatada = `${mes}-${dia}`;
  return feriadosNacionaisFixos.includes(dataFormatada);
};

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 */
const ehDiaUtil = (data: Date): boolean => {
  const diaSemana = data.getDay();
  // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) return false;
  if (ehFeriadoNacional(data)) return false;
  return true;
};

/**
 * Calcula a diferença em dias ÚTEIS entre duas datas
 * (exclui finais de semana e feriados nacionais)
 * A contagem começa no PRÓXIMO dia útil após a data de ciência
 */
const calcularDiasUteis = (dataInicio: string | null, dataFim: string | null): number | null => {
  if (!dataInicio || !dataFim) return null;
  try {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Avançar para o próximo dia após a data de ciência
    const dataAtual = new Date(inicio);
    dataAtual.setDate(dataAtual.getDate() + 1);

    // Encontrar o próximo dia útil
    while (!ehDiaUtil(dataAtual)) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    let diasUteis = 0;

    // Percorre dia por dia até a data fim, contando apenas dias úteis
    while (dataAtual <= fim) {
      if (ehDiaUtil(dataAtual)) {
        diasUteis++;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return diasUteis;
  } catch {
    return null;
  }
};

/**
 * Retorna a classe CSS de cor do badge baseado na quantidade de dias úteis
 */
const getCorBadgeDias = (dias: number): string => {
  switch (dias) {
    case 3:
      return 'bg-green-600 text-white hover:bg-green-700 border-0';
    case 5:
      return 'bg-orange-600 text-white hover:bg-orange-700 border-0';
    case 8:
      return 'bg-blue-600 text-white hover:bg-blue-700 border-0';
    default:
      return 'bg-purple-600 text-white hover:bg-purple-700 border-0';
  }
};

/**
 * Componente para atribuir responsável a um expediente
 */
function ResponsavelCell({
  expediente,
  onSuccess,
  usuarios
}: {
  expediente: PendenteManifestacao;
  onSuccess: () => void;
  usuarios: Usuario[];
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSelect = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);

      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/responsavel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responsavelId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atribuir responsável');
      }

      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      // Não chamar onSuccess em caso de falha para evitar refresh indevido
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavel_id);

  return (
    <div className="relative group h-full w-full min-h-[60px] flex items-center justify-center p-2">
      <span className="text-sm">
        {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
      </span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1"
            title="Editar responsável"
            disabled={isLoading}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,15.625rem)] p-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => handleSelect('null')}
              disabled={isLoading}
            >
              Sem responsável
            </Button>
            {usuarios.map((usuario) => (
              <Button
                key={usuario.id}
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => handleSelect(usuario.id.toString())}
                disabled={isLoading}
              >
                {usuario.nomeExibicao}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}


/**
 * Define as colunas da tabela de expedientes
 */
function criarColunas(
  onSuccess: () => void,
  usuarios: Usuario[],
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>,
  onPrazoSort: (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => void,
  onProcessoSort: (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => void,
  onPartesSort: (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => void,
  onResponsavelSort: (direction: 'asc' | 'desc') => void,
  isLoadingTipos?: boolean
): ColumnDef<PendenteManifestacao>[] {
  return [
    {
      id: 'tipo_descricao',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Tipo e Descrição</div>
        </div>
      ),
      enableSorting: false,
      size: 300,
      cell: ({ row }) => (
        <TipoDescricaoCell
          expediente={row.original}
          onSuccess={onSuccess}
          tiposExpedientes={tiposExpedientes}
          isLoadingTipos={isLoadingTipos}
        />
      ),
    },
    {
      id: 'prazo',
      header: () => <PrazoColumnHeader onSort={onPrazoSort} />,
      enableSorting: false,
      size: 170,
      cell: ({ row }) => {
        const dataInicio = row.original.data_ciencia_parte;
        const dataFim = row.original.data_prazo_legal_parte;
        const diasUteis = calcularDiasUteis(dataInicio, dataFim);

        return (
          <div className="min-h-10 flex flex-col items-center justify-center gap-2 py-2">
            <div className="text-sm">
              <span className="font-semibold">Início:</span> {formatarData(dataInicio)}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Fim:</span> {formatarData(dataFim)}
            </div>
            {diasUteis !== null && (
              <Badge className={`${getCorBadgeDias(diasUteis)} text-sm font-medium mt-1 px-3 py-1`}>
                {diasUteis} {diasUteis === 1 ? 'dia' : 'dias'}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'processo',
      header: () => <ProcessoColumnHeader onSort={onProcessoSort} />,
      enableSorting: false,
      size: 380,
      cell: ({ row }) => {
        const classeJudicial = row.original.classe_judicial || '';
        const numeroProcesso = row.original.numero_processo;
        const orgaoJulgador = row.original.descricao_orgao_julgador || '-';
        const trt = row.original.trt;
        const grau = row.original.grau;

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[380px]">
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground max-w-full truncate">
              {orgaoJulgador}
            </div>
          </div>
        );
      },
    },
    {
      id: 'partes',
      header: () => <PartesColumnHeader onSort={onPartesSort} />,
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';

        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsavel_id',
      header: () => <ResponsavelColumnHeader onSort={onResponsavelSort} />,
      size: 160,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <ResponsavelCell expediente={row.original} onSuccess={onSuccess} usuarios={usuarios} />
        </div>
      ),
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      cell: ({ row }) => {
        const expediente = row.original;
        return <AcoesExpediente expediente={expediente} usuarios={usuarios} tiposExpedientes={tiposExpedientes} />;
      },
    },
  ];
}

/**
 * Componente de ações para cada expediente
 */
function AcoesExpediente({
  expediente,
  usuarios,
  tiposExpedientes
}: {
  expediente: PendenteManifestacao;
  usuarios: Usuario[];
  tiposExpedientes: Array<{ id: number; tipo_expediente: string }>;
}) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);
  const [visualizarDialogOpen, setVisualizarDialogOpen] = React.useState(false);

  const handleSuccess = () => {
    // Forçar reload da página após sucesso
    window.location.reload();
  };

  const estaBaixado = !!expediente.baixado_em;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setVisualizarDialogOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualizar Expediente</p>
          </TooltipContent>
        </Tooltip>
        {!estaBaixado ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setBaixarDialogOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Baixar Expediente</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setReverterDialogOpen(true)}
              >
                <Undo2 className="h-4 w-4 text-amber-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reverter Baixa</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ExpedienteVisualizarDialog
        open={visualizarDialogOpen}
        onOpenChange={setVisualizarDialogOpen}
        expediente={expediente}
        usuarios={usuarios}
        tiposExpedientes={tiposExpedientes}
      />

      <ExpedientesBaixarDialog
        open={baixarDialogOpen}
        onOpenChange={setBaixarDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />

      <ExpedientesReverterBaixaDialog
        open={reverterDialogOpen}
        onOpenChange={setReverterDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />
    </TooltipProvider>
  );
}

export default function ExpedientesPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    'data_prazo_legal_parte' | 'data_ciencia_parte' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial' | 'tipo_expediente_id' | 'responsavel_id' | null
  >('data_prazo_legal_parte'); // Padrão: ordenar por data de vencimento (prazo legal)
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc'); // Crescente: mais antigas primeiro
  const [statusBaixa, setStatusBaixa] = React.useState<'pendente' | 'baixado' | 'todos'>('pendente'); // Padrão: pendente
  const [statusPrazo, setStatusPrazo] = React.useState<'no_prazo' | 'vencido' | 'todos'>('no_prazo'); // Padrão: no prazo
  const [filtros, setFiltros] = React.useState<ExpedientesFilters>({});
  const [visualizacao, setVisualizacao] = React.useState<'tabela' | 'semana' | 'mes' | 'ano'>('semana'); // Padrão: semana
  const [semanaAtual, setSemanaAtual] = React.useState(new Date());
  const [mesAtual, setMesAtual] = React.useState(new Date());
  const [anoAtual, setAnoAtual] = React.useState(new Date());
  const [novoExpedienteOpen, setNovoExpedienteOpen] = React.useState(false);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);

  // Obter informações do usuário atual para filtro contextual
  React.useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
          // Verificar se é super admin ou tem permissão de visualizar todos
          // TODO: Implementar verificação de permissões adequada
          setIsSuperAdmin(data.isSuperAdmin || false);
        }
      } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
      }
    };
    getUserInfo();
  }, []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar expedientes
  const params = React.useMemo(
    () => {
      // Excluir responsavel_id dos filtros para evitar sobrescrever a restrição de segurança
      const { responsavel_id: _, ...filtrosSemResponsavel } = filtros;
      
      // Determinar responsavel_id: usuários não-admin veem apenas seus expedientes
      const responsavelIdFinal = !isSuperAdmin && currentUserId 
        ? currentUserId 
        : filtros.responsavel_id;

      return {
        pagina: pagina + 1, // API usa 1-indexed
        limite,
        busca: buscaDebounced || undefined,
        ordenar_por: ordenarPor || undefined,
        ordem,
        baixado: statusBaixa === 'baixado' ? true : statusBaixa === 'pendente' ? false : undefined,
        prazo_vencido: statusPrazo === 'vencido' ? true : statusPrazo === 'no_prazo' ? false : undefined,
        // Filtro contextual: usuários não-admin veem apenas seus expedientes
        // Super admins podem usar filtros.responsavel_id se fornecido
        responsavel_id: responsavelIdFinal,
        ...filtrosSemResponsavel, // Spread dos filtros avançados (sem responsavel_id)
      };
    },
    [pagina, limite, buscaDebounced, ordenarPor, ordem, statusBaixa, statusPrazo, filtros, isSuperAdmin, currentUserId]
  );

  const { expedientes, paginacao, isLoading, error, refetch } = usePendentes(params);

  // Buscar usuários uma única vez para compartilhar entre todas as células
  const { usuarios: usuariosLista } = useUsuarios({ ativo: true, limite: 100 });

  // Buscar tipos de expedientes uma única vez para compartilhar entre todas as células
  const { tiposExpedientes, isLoading: isLoadingTipos, error: errorTipos } = useTiposExpedientes({ limite: 100 });

  // Debug: verificar se tipos estão sendo carregados
  React.useEffect(() => {
    if (errorTipos) {
      console.error('Erro ao carregar tipos de expedientes:', errorTipos);
    }
    if (!isLoadingTipos && tiposExpedientes.length > 0) {
      console.log('Tipos de expedientes carregados:', tiposExpedientes.length);
    }
  }, [tiposExpedientes, isLoadingTipos, errorTipos]);

  const handleSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(direction);
      } else if (columnId && direction === null) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(columnId === 'data_prazo_legal_parte' ? 'asc' : 'desc');
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  const handlePrazoSort = React.useCallback(
    (field: 'data_ciencia_parte' | 'data_prazo_legal_parte', direction: 'asc' | 'desc') => {
      handleSortingChange(field, direction);
    },
    [handleSortingChange]
  );

  const handleTipoExpedienteSort = React.useCallback(
    (direction: 'asc' | 'desc') => {
      setOrdenarPor('tipo_expediente_id');
      setOrdem(direction);
    },
    []
  );

  const handleProcessoSort = React.useCallback(
    (field: 'trt' | 'grau' | 'descricao_orgao_julgador' | 'classe_judicial', direction: 'asc' | 'desc') => {
      handleSortingChange(field, direction);
    },
    [handleSortingChange]
  );

  const handlePartesSort = React.useCallback(
    (field: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => {
      handleSortingChange(field, direction);
    },
    [handleSortingChange]
  );

  const handleResponsavelSort = React.useCallback(
    (direction: 'asc' | 'desc') => {
      // Ordenar por responsavel_id
      // TODO: Backend poderia implementar join com usuarios para ordenar por nome
      setOrdenarPor('responsavel_id');
      setOrdem(direction);
    },
    []
  );

  const colunas = React.useMemo(
    () => criarColunas(
      handleSuccess,
      usuariosLista,
      tiposExpedientes,
      handlePrazoSort,
      handleProcessoSort,
      handlePartesSort,
      handleResponsavelSort,
      isLoadingTipos
    ),
    [handleSuccess, usuariosLista, tiposExpedientes, handlePrazoSort, handleProcessoSort, handlePartesSort, handleResponsavelSort, isLoadingTipos]
  );

  // Funções para navegação de semana
  const navegarSemana = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novaSemana = new Date(semanaAtual);
    novaSemana.setDate(novaSemana.getDate() + (direcao === 'proxima' ? 7 : -7));
    setSemanaAtual(novaSemana);
  }, [semanaAtual]);

  const voltarSemanaAtual = React.useCallback(() => {
    setSemanaAtual(new Date());
  }, []);

  // Funções para navegação de mês
  const navegarMes = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novoMes = new Date(mesAtual);
    novoMes.setMonth(novoMes.getMonth() + (direcao === 'proxima' ? 1 : -1));
    setMesAtual(novoMes);
  }, [mesAtual]);

  const voltarMesAtual = React.useCallback(() => {
    setMesAtual(new Date());
  }, []);

  // Funções para navegação de ano
  const navegarAno = React.useCallback((direcao: 'anterior' | 'proxima') => {
    const novoAno = new Date(anoAtual);
    novoAno.setFullYear(novoAno.getFullYear() + (direcao === 'proxima' ? 1 : -1));
    setAnoAtual(novoAno);
  }, [anoAtual]);

  const voltarAnoAtual = React.useCallback(() => {
    setAnoAtual(new Date());
  }, []);

  // Handler para mudança de filtros consolidados
  const handleFilterIdsChange = React.useCallback(
    (ids: string[]) => {
      setSelectedFilterIds(ids);
      const parsed = parseExpedientesFilters(ids);

      // Atualizar estados baseados nos filtros
      if (parsed.baixado !== undefined) {
        setStatusBaixa(parsed.baixado ? 'baixado' : 'pendente');
      } else {
        setStatusBaixa('todos');
      }

      if (parsed.prazo_vencido !== undefined) {
        setStatusPrazo(parsed.prazo_vencido ? 'vencido' : 'no_prazo');
      } else {
        setStatusPrazo('todos');
      }

      // Atualizar outros filtros
      const newFiltros: ExpedientesFilters = {};
      if (parsed.trt) newFiltros.trt = parsed.trt;
      if (parsed.grau) newFiltros.grau = parsed.grau;
      if (parsed.responsavel_id) newFiltros.responsavel_id = parsed.responsavel_id;
      if (parsed.tipo_expediente_id) newFiltros.tipo_expediente_id = parsed.tipo_expediente_id;
      if (parsed.sem_tipo) newFiltros.sem_tipo = parsed.sem_tipo;
      if (parsed.segredo_justica) newFiltros.segredo_justica = parsed.segredo_justica;
      if (parsed.juizo_digital) newFiltros.juizo_digital = parsed.juizo_digital;
      if (parsed.sem_responsavel) newFiltros.sem_responsavel = parsed.sem_responsavel;

      setFiltros(newFiltros);
      setPagina(0);
    },
    []
  );

  // Calcular início e fim da semana para exibição
  const { inicioSemana, fimSemana } = React.useMemo(() => {
    const date = new Date(semanaAtual);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const inicio = new Date(date);
    inicio.setDate(date.getDate() + diff);

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4);
    fim.setHours(23, 59, 59, 999);

    return { inicioSemana: inicio, fimSemana: fim };
  }, [semanaAtual]);

  const formatarDataCabecalho = (data: Date) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formatar período para controles de navegação
  const formatarPeriodo = React.useMemo(() => {
    if (visualizacao === 'semana') {
      return `${formatarDataCabecalho(inicioSemana)} - ${formatarDataCabecalho(fimSemana)}`;
    } else if (visualizacao === 'mes') {
      return mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' De ', ' de ');
    } else if (visualizacao === 'ano') {
      return anoAtual.getFullYear().toString();
    }
    return '';
  }, [visualizacao, inicioSemana, fimSemana, mesAtual, anoAtual]);

  // Construir opções e grupos de filtros
  const filterOptions = React.useMemo(
    () => buildExpedientesFilterOptions(usuariosLista, tiposExpedientes),
    [usuariosLista, tiposExpedientes]
  );

  const filterGroups = React.useMemo(
    () => buildExpedientesFilterGroups(usuariosLista, tiposExpedientes),
    [usuariosLista, tiposExpedientes]
  );

  // Efeito para indicar pesquisa ativa
  React.useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [buscaDebounced]);

  return (
    <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as typeof visualizacao)}>
      <div className="space-y-4">
        {/* Barra de busca, filtros, tabs e controles de navegação - tudo na mesma linha */}
        <div className="flex items-center gap-4 pb-6">
          <TableToolbar
            searchValue={busca}
            onSearchChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            isSearching={isSearching}
            searchPlaceholder="Buscar expedientes..."
            filterOptions={filterOptions}
            filterGroups={filterGroups}
            selectedFilters={selectedFilterIds}
            onFiltersChange={handleFilterIdsChange}
            onNewClick={() => setNovoExpedienteOpen(true)}
            newButtonTooltip="Novo expediente manual"
          />

          {/* Tabs de visualização */}
          <TabsList>
            <TabsTrigger value="semana" aria-label="Visualização Semanal">
              <CalendarRange className="h-4 w-4" />
              <span>Semana</span>
            </TabsTrigger>
            <TabsTrigger value="mes" aria-label="Visualização Mensal">
              <Calendar className="h-4 w-4" />
              <span>Mês</span>
            </TabsTrigger>
            <TabsTrigger value="ano" aria-label="Visualização Anual">
              <CalendarDays className="h-4 w-4" />
              <span>Ano</span>
            </TabsTrigger>
            <TabsTrigger value="tabela" aria-label="Visualização em Lista">
              <List className="h-4 w-4" />
              <span>Lista</span>
            </TabsTrigger>
          </TabsList>

          {/* Controles de navegação temporal - aparecem apenas quando não é visualização de lista */}
          {visualizacao !== 'tabela' && (
            <ButtonGroup>
              {/* Botão Anterior */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (visualizacao === 'semana') navegarSemana('anterior');
                  if (visualizacao === 'mes') navegarMes('anterior');
                  if (visualizacao === 'ano') navegarAno('anterior');
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Indicador de período atual */}
              <ButtonGroupText className="whitespace-nowrap capitalize min-w-32 text-center text-xs font-normal">
                {formatarPeriodo}
              </ButtonGroupText>

              {/* Botão Próximo */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (visualizacao === 'semana') navegarSemana('proxima');
                  if (visualizacao === 'mes') navegarMes('proxima');
                  if (visualizacao === 'ano') navegarAno('proxima');
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Botão Rollback (Voltar para atual) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (visualizacao === 'semana') voltarSemanaAtual();
                      if (visualizacao === 'mes') voltarMesAtual();
                      if (visualizacao === 'ano') voltarAnoAtual();
                    }}
                    aria-label="Voltar para período atual"
                    className="bg-muted hover:bg-muted/80"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="px-2 py-1 text-xs">
                  {visualizacao === 'semana' && 'Semana Atual'}
                  {visualizacao === 'mes' && 'Mês Atual'}
                  {visualizacao === 'ano' && 'Ano Atual'}
                </TooltipContent>
              </Tooltip>
            </ButtonGroup>
          )}
        </div>

        <TabsContent value="tabela" className="mt-0">
          {/* Tabela */}
          <DataTable
            data={expedientes}
            columns={colunas}
            pagination={
              paginacao
                ? {
                  pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
                  pageSize: paginacao.limite,
                  total: paginacao.total,
                  totalPages: paginacao.totalPaginas,
                  onPageChange: setPagina,
                  onPageSizeChange: setLimite,
                }
                : undefined
            }
            sorting={{
              columnId: ordenarPor,
              direction: ordem,
              onSortingChange: handleSortingChange,
            }}
            isLoading={isLoading}
            error={error}
            emptyMessage="Nenhum expediente encontrado."
          />
        </TabsContent>

        <TabsContent value="semana" className="mt-0">
          <ExpedientesVisualizacaoSemana
            expedientes={expedientes}
            isLoading={isLoading}
            onRefresh={refetch}
            usuarios={usuariosLista}
            tiposExpedientes={tiposExpedientes}
            semanaAtual={semanaAtual}
            onTipoExpedienteSort={handleTipoExpedienteSort}
            onPrazoSort={handlePrazoSort}
            onProcessoSort={handleProcessoSort}
            onPartesSort={handlePartesSort}
            onResponsavelSort={handleResponsavelSort}
          />
        </TabsContent>

        <TabsContent value="mes" className="mt-0">
          <ExpedientesVisualizacaoMes
            expedientes={expedientes}
            isLoading={isLoading}
            mesAtual={mesAtual}
            onMesAtualChange={setMesAtual}
          />
        </TabsContent>

        <TabsContent value="ano" className="mt-0">
          <ExpedientesVisualizacaoAno
            expedientes={expedientes}
            isLoading={isLoading}
            anoAtual={anoAtual}
            onAnoAtualChange={setAnoAtual}
          />
        </TabsContent>
      </div>

      <NovoExpedienteDialog
        open={novoExpedienteOpen}
        onOpenChange={setNovoExpedienteOpen}
        onSuccess={handleSuccess}
      />
    </Tabs>
  );
}


