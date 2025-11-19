'use client';

// Página de processos - Lista processos do acervo

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildProcessosFilterOptions, parseProcessosFilters } from './components/processos-toolbar-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, CalendarClock } from 'lucide-react';
import { useAcervo } from '@/lib/hooks/use-acervo';
import type { ColumnDef } from '@tanstack/react-table';
import type { Acervo } from '@/backend/types/acervo/types';
import type { ProcessosFilters } from '@/lib/types/acervo';

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
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Componente Dialog para exibir informações da próxima audiência
 */
interface AudienciaDialogProps {
  dataProximaAudiencia: string | null;
  children: React.ReactNode;
}

function AudienciaDialog({ dataProximaAudiencia, children }: AudienciaDialogProps) {
  if (!dataProximaAudiencia) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Próxima Audiência</DialogTitle>
          <DialogDescription>
            Informações sobre a próxima audiência agendada para este processo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Data e Hora</div>
            <div className="text-base">{formatarDataHora(dataProximaAudiencia)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Retorna a classe CSS de cor para um TRT específico
 */
const getTRTColorClass = (trt: string): string => {
  const trtColors: Record<string, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'TRT5': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'TRT6': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'TRT7': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    'TRT8': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'TRT9': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'TRT10': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'TRT11': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'TRT12': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'TRT13': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'TRT14': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
    'TRT15': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-200 dark:border-lime-800',
    'TRT16': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-800',
    'TRT17': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
    'TRT18': 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:border-stone-800',
    'TRT19': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
    'TRT20': 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800',
    'TRT21': 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800',
    'TRT22': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
    'TRT23': 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
    'TRT24': 'bg-green-200 text-green-900 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
  };
  
  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Retorna a classe CSS de cor para um grau específico
 */
const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };
  
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata o texto do grau para exibição
 */
const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau'): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
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
 * Componente de header customizado para coluna de Tribunal com popover de ordenação
 */
interface TribunalColumnHeaderProps {
  ordenarPor: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null;
  ordem: 'asc' | 'desc';
  onSortChange: (sortType: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null, direction: 'asc' | 'desc' | null) => void;
}

function TribunalColumnHeader({ ordenarPor, ordem, onSortChange }: TribunalColumnHeaderProps) {
  const [open, setOpen] = React.useState(false);

  const handleSort = (sortType: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau', direction: 'asc' | 'desc') => {
    onSortChange(sortType, direction);
    setOpen(false);
  };

  const handleClear = () => {
    onSortChange(null, null);
    setOpen(false);
  };

  const getSortIcon = (sortType: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau') => {
    if (ordenarPor === sortType) {
      return ordem === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    }
    return null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 p-0 hover:bg-transparent text-sm font-medium"
        >
          <span>Tribunal</span>
          {ordenarPor ? (
            ordem === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-semibold">Ordenar por:</div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt', 'asc')}
          >
            TRT (A-Z)
            {getSortIcon('trt')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt', 'desc')}
          >
            TRT (Z-A)
            {getSortIcon('trt')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('grau', 'asc')}
          >
            Grau (1º → 2º)
            {getSortIcon('grau')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('grau', 'desc')}
          >
            Grau (2º → 1º)
            {getSortIcon('grau')}
          </Button>
          <div className="my-1 h-px bg-border" />
          <div className="px-2 py-1.5 text-sm font-semibold">Ordenação composta:</div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt_primeiro_grau', 'asc')}
          >
            TRT, 1º Grau (A-Z)
            {getSortIcon('trt_primeiro_grau')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt_primeiro_grau', 'desc')}
          >
            TRT, 1º Grau (Z-A)
            {getSortIcon('trt_primeiro_grau')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt_segundo_grau', 'asc')}
          >
            TRT, 2º Grau (A-Z)
            {getSortIcon('trt_segundo_grau')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('trt_segundo_grau', 'desc')}
          >
            TRT, 2º Grau (Z-A)
            {getSortIcon('trt_segundo_grau')}
          </Button>
          {ordenarPor && (
            <>
              <div className="my-1 h-px bg-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleClear}
              >
                Limpar ordenação
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Componente de header customizado para coluna de Partes com popover de ordenação
 */
interface PartesColumnHeaderProps {
  ordenarPor: 'nome_parte_autora' | 'nome_parte_re' | null;
  ordem: 'asc' | 'desc';
  onSortChange: (columnId: 'nome_parte_autora' | 'nome_parte_re' | null, direction: 'asc' | 'desc' | null) => void;
}

function PartesColumnHeader({ ordenarPor, ordem, onSortChange }: PartesColumnHeaderProps) {
  const [open, setOpen] = React.useState(false);

  const handleSort = (columnId: 'nome_parte_autora' | 'nome_parte_re', direction: 'asc' | 'desc') => {
    onSortChange(columnId, direction);
    setOpen(false);
  };

  const handleClear = () => {
    onSortChange(null, null);
    setOpen(false);
  };

  const getSortIcon = (columnId: 'nome_parte_autora' | 'nome_parte_re') => {
    if (ordenarPor === columnId) {
      return ordem === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    }
    return null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 p-0 hover:bg-transparent text-sm font-medium"
        >
          <span>Partes</span>
          {ordenarPor ? (
            ordenarPor === 'nome_parte_autora' ? (
              ordem === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              ordem === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-sm font-semibold">Ordenar por:</div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('nome_parte_autora', 'asc')}
          >
            Parte Autora (A-Z)
            {getSortIcon('nome_parte_autora')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('nome_parte_autora', 'desc')}
          >
            Parte Autora (Z-A)
            {getSortIcon('nome_parte_autora')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('nome_parte_re', 'asc')}
          >
            Parte Ré (A-Z)
            {getSortIcon('nome_parte_re')}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSort('nome_parte_re', 'desc')}
          >
            Parte Ré (Z-A)
            {getSortIcon('nome_parte_re')}
          </Button>
          {ordenarPor && (
            <>
              <div className="my-1 h-px bg-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleClear}
              >
                Limpar ordenação
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Define as colunas da tabela de processos
 */
function criarColunas(
  ordenarPor: 'data_autuacao' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null,
  ordem: 'asc' | 'desc',
  onPartesSortChange: (columnId: 'nome_parte_autora' | 'nome_parte_re' | null, direction: 'asc' | 'desc' | null) => void,
  onTribunalSortChange: (sortType: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null, direction: 'asc' | 'desc' | null) => void
): ColumnDef<Acervo>[] {
  return [
    {
      accessorKey: 'data_autuacao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Autuação" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarData(row.getValue('data_autuacao'))}
        </div>
      ),
    },
    {
      id: 'processo',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Processo</div>
        </div>
      ),
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                {trt}
              </Badge>
              <Badge variant="outline" className={`${getGrauColorClass(grau)} w-fit text-xs`}>
                {formatarGrau(grau)}
              </Badge>
            </div>
            <div className="text-sm font-medium whitespace-nowrap">
              {classeJudicial && `${classeJudicial} `}{numeroProcesso}
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
      header: () => (
        <div className="flex items-center justify-start">
          <PartesColumnHeader
            ordenarPor={ordenarPor === 'nome_parte_autora' || ordenarPor === 'nome_parte_re' ? ordenarPor : null}
            ordem={ordem}
            onSortChange={onPartesSortChange}
          />
        </div>
      ),
      enableSorting: false,
      size: 250,
      meta: { align: 'left' },
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
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 100,
      cell: ({ row }) => {
        const dataProximaAudiencia = row.original.data_proxima_audiencia;
        const temAudiencia = !!dataProximaAudiencia;

        return (
          <div className="min-h-10 flex items-center justify-center">
            <ButtonGroup>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  // TODO: Navegar para página de visualização do processo
                  console.log('Visualizar processo:', row.original.id);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {temAudiencia && (
                <AudienciaDialog dataProximaAudiencia={dataProximaAudiencia}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </Button>
                </AudienciaDialog>
              )}
            </ButtonGroup>
          </div>
        );
      },
    },
  ];
}

export default function ProcessosPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'data_autuacao' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null>('data_autuacao');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('desc');
  const [filtros, setFiltros] = React.useState<ProcessosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;
  
  // Parâmetros para buscar processos
  const params = React.useMemo(() => {
    // Tratar ordenações compostas e simples
    let ordenarPorApi: 'data_autuacao' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | undefined = undefined;
    let filtrosComOrdenacao = { ...filtros };

    if (ordenarPor === 'trt' || ordenarPor === 'trt_primeiro_grau' || ordenarPor === 'trt_segundo_grau') {
      // Para ordenação por TRT, não temos campo na API, então ordenamos por data_autuacao
      // e fazemos ordenação no frontend
      ordenarPorApi = 'data_autuacao';
    } else if (ordenarPor === 'grau') {
      // Para ordenação por grau, também não temos campo na API
      ordenarPorApi = 'data_autuacao';
    } else if (ordenarPor) {
      ordenarPorApi = ordenarPor;
    }

    // Aplicar filtros para ordenações compostas
    // Se o usuário já tem um filtro de grau, mantemos o do usuário
    // Caso contrário, aplicamos o filtro da ordenação composta
    if (ordenarPor === 'trt_primeiro_grau') {
      if (!filtros.grau) {
        filtrosComOrdenacao = { ...filtrosComOrdenacao, grau: 'primeiro_grau' };
      }
    } else if (ordenarPor === 'trt_segundo_grau') {
      if (!filtros.grau) {
        filtrosComOrdenacao = { ...filtrosComOrdenacao, grau: 'segundo_grau' };
      }
    }

    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPorApi,
      ordem,
      ...filtrosComOrdenacao, // Spread dos filtros avançados
    };
  }, [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros]);
  
  const { processos, paginacao, isLoading, error } = useAcervo(params);
  
  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('desc');
    }
  }, []);

  const handlePartesSortChange = React.useCallback((columnId: 'nome_parte_autora' | 'nome_parte_re' | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('desc');
    }
  }, []);

  const handleTribunalSortChange = React.useCallback((sortType: 'trt' | 'grau' | 'trt_primeiro_grau' | 'trt_segundo_grau' | null, direction: 'asc' | 'desc' | null) => {
    if (sortType && direction) {
      setOrdenarPor(sortType);
      setOrdem(direction);
    } else {
      // Limpar ordenação e remover filtro de grau se foi adicionado pela ordenação composta
      setOrdenarPor(null);
      setOrdem('desc');
      // Remover filtro de grau apenas se foi adicionado automaticamente (não pelo usuário)
      // Isso será tratado no useMemo dos params
    }
  }, []);

  // Ordenar processos no frontend quando necessário (TRT ou Grau)
  const processosOrdenados = React.useMemo(() => {
    if (!processos) return processos;

    // Se não há ordenação especial, retorna como está
    if (!ordenarPor || (ordenarPor !== 'trt' && ordenarPor !== 'grau' && ordenarPor !== 'trt_primeiro_grau' && ordenarPor !== 'trt_segundo_grau')) {
      return processos;
    }

    const processosCopy = [...processos];

    if (ordenarPor === 'trt' || ordenarPor === 'trt_primeiro_grau' || ordenarPor === 'trt_segundo_grau') {
      processosCopy.sort((a, b) => {
        const comparison = a.trt.localeCompare(b.trt);
        return ordem === 'asc' ? comparison : -comparison;
      });
    } else if (ordenarPor === 'grau') {
      processosCopy.sort((a, b) => {
        // primeiro_grau vem antes de segundo_grau
        const grauOrder = { 'primeiro_grau': 1, 'segundo_grau': 2 };
        const comparison = grauOrder[a.grau] - grauOrder[b.grau];
        return ordem === 'asc' ? comparison : -comparison;
      });
    }

    return processosCopy;
  }, [processos, ordenarPor, ordem]);

  const colunas = React.useMemo(
    () => criarColunas(ordenarPor, ordem, handlePartesSortChange, handleTribunalSortChange),
    [ordenarPor, ordem, handlePartesSortChange, handleTribunalSortChange]
  );

  const filterOptions = React.useMemo(() => buildProcessosFilterOptions(), []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseProcessosFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);
  
  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar por número, parte autora, parte ré, órgão julgador ou classe judicial..."
        filterOptions={filterOptions}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        // Processos não tem botão de novo
      />

      {/* Tabela */}
      <DataTable
        data={processosOrdenados}
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
        emptyMessage="Nenhum processo encontrado."
      />
    </div>
  );
}

