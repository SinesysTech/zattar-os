'use client';

// Página de expedientes - Lista expedientes pendentes de manifestação

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { DataTableColumnHeaderWithFilter } from '@/components/data-table-column-header-with-filter';
import { ExpedientesFiltrosAvancados } from '@/components/expedientes-filtros-avancados';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExpedientesVisualizacaoSemana } from '@/components/expedientes-visualizacao-semana';
import { ExpedientesVisualizacaoMes } from '@/components/expedientes-visualizacao-mes';
import { ExpedientesVisualizacaoAno } from '@/components/expedientes-visualizacao-ano';
import { usePendentes } from '@/lib/hooks/use-pendentes';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import { ExpedientesBaixarDialog } from '@/components/expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from '@/components/expedientes-reverter-baixa-dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Undo2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import type { ExpedientesFilters } from '@/lib/types/expedientes';

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
 * Componente para atribuir responsável a um expediente
 */
function ResponsavelCell({ expediente, onSuccess }: { expediente: PendenteManifestacao; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { usuarios } = useUsuarios({ ativo: true, limite: 1000 });

  const handleChange = async (value: string) => {
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

      // Atualizar a lista após sucesso
      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      // Em caso de erro, ainda atualizamos para mostrar o estado atual
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === expediente.responsavel_id);

  return (
    <Select
      value={expediente.responsavel_id?.toString() || 'null'}
      onValueChange={handleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sem responsável">
          {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="null">Sem responsável</SelectItem>
        {usuarios.map((usuario) => (
          <SelectItem key={usuario.id} value={usuario.id.toString()}>
            {usuario.nomeExibicao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


/**
 * Define as colunas da tabela de expedientes
 */
function criarColunas(onSuccess: () => void): ColumnDef<PendenteManifestacao>[] {
  return [
    {
      accessorKey: 'data_ciencia_parte',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data de Ciência" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          {formatarData(row.getValue('data_ciencia_parte'))}
        </div>
      ),
    },
    {
      accessorKey: 'data_prazo_legal_parte',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Prazo Legal" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm font-medium">
          {formatarData(row.getValue('data_prazo_legal_parte'))}
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
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[380px]">
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
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Partes</div>
        </div>
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const parteAutora = row.original.nome_parte_autora || '-';
        const parteRe = row.original.nome_parte_re || '-';

        return (
          <div className="min-h-[2.5rem] flex flex-col items-start justify-center gap-1.5 max-w-[250px]">
            <Badge variant="outline" className={`${getParteAutoraColorClass()} w-fit whitespace-nowrap max-w-full truncate`}>
              {parteAutora}
            </Badge>
            <Badge variant="outline" className={`${getParteReColorClass()} w-fit whitespace-nowrap max-w-full truncate`}>
              {parteRe}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsavel_id',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Responsável</div>
        </div>
      ),
      size: 220,
      cell: ({ row }) => (
        <div className="min-h-[2.5rem] flex items-center justify-center">
          <ResponsavelCell expediente={row.original} onSuccess={onSuccess} />
        </div>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      cell: ({ row }) => {
        const expediente = row.original;
        return <AcoesExpediente expediente={expediente} />;
      },
    },
  ];
}

/**
 * Componente de ações para cada expediente
 */
function AcoesExpediente({ expediente }: { expediente: PendenteManifestacao }) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);

  const handleSuccess = () => {
    // Forçar reload da página após sucesso
    window.location.reload();
  };

  const estaBaixado = !!expediente.baixado_em;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
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
    'data_prazo_legal_parte' | 'data_ciencia_parte' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | null
  >('data_prazo_legal_parte');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [statusBaixa, setStatusBaixa] = React.useState<'pendente' | 'baixado' | 'todos'>('pendente'); // Padrão: pendente
  const [statusPrazo, setStatusPrazo] = React.useState<'no_prazo' | 'vencido' | 'todos'>('no_prazo'); // Padrão: no prazo
  const [filtros, setFiltros] = React.useState<ExpedientesFilters>({});
  const [visualizacao, setVisualizacao] = React.useState<'tabela' | 'semana' | 'mes' | 'ano'>('tabela');

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar expedientes
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      baixado: statusBaixa === 'baixado' ? true : statusBaixa === 'pendente' ? false : undefined,
      prazo_vencido: statusPrazo === 'vencido' ? true : statusPrazo === 'no_prazo' ? false : undefined,
      ...filtros, // Spread dos filtros avançados
    }),
    [pagina, limite, buscaDebounced, ordenarPor, ordem, statusBaixa, statusPrazo, filtros]
  );

  const { expedientes, paginacao, isLoading, error, refetch } = usePendentes(params);

  const handleSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(
    () => criarColunas(handleSuccess),
    [handleSuccess]
  );

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(direction);
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  const handleFiltersChange = React.useCallback((newFilters: ExpedientesFilters) => {
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
  }, []);

  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);

  return (
    <Tabs value={visualizacao} onValueChange={(value) => setVisualizacao(value as typeof visualizacao)}>
      <div className="space-y-4">
        {/* Barra de busca e filtros */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar por número do processo, parte autora, parte ré, órgão julgador ou classe judicial..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0); // Resetar para primeira página ao buscar
            }}
            className="max-w-sm"
          />
          <ExpedientesFiltrosAvancados
            filters={filtros}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
          <Select
            value={statusBaixa}
            onValueChange={(value) => {
              setStatusBaixa(value as 'pendente' | 'baixado' | 'todos');
              setPagina(0); // Resetar para primeira página ao mudar status
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="baixado">Baixado</SelectItem>
              <SelectItem value="todos">Todos os Status</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusPrazo}
            onValueChange={(value) => {
              setStatusPrazo(value as 'no_prazo' | 'vencido' | 'todos');
              setPagina(0); // Resetar para primeira página ao mudar prazo
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prazo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_prazo">No Prazo</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="todos">Todos os Prazos</SelectItem>
            </SelectContent>
          </Select>
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
          </TabsList>
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
          <ExpedientesVisualizacaoSemana expedientes={expedientes} isLoading={isLoading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="mes" className="mt-0">
          <ExpedientesVisualizacaoMes expedientes={expedientes} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="ano" className="mt-0">
          <ExpedientesVisualizacaoAno expedientes={expedientes} isLoading={isLoading} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

