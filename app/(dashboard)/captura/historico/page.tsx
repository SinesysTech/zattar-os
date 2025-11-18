'use client';

// Página de histórico de capturas

import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCapturasLog } from '@/lib/hooks/use-capturas-log';
import { useAdvogados } from '@/lib/hooks/use-advogados';
import type { ColumnDef } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';

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
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variants: Record<StatusCaptura, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendente', variant: 'outline' },
    in_progress: { label: 'Em Progresso', variant: 'secondary' },
    completed: { label: 'Concluída', variant: 'default' },
    failed: { label: 'Falhou', variant: 'destructive' },
  };

  const { label, variant } = variants[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Colunas da tabela de histórico
 */
function criarColunas(): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="ID" />
        </div>
      ),
      enableSorting: true,
      size: 80,
      cell: ({ row }) => (
        <div className="text-center text-sm font-mono">{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'tipo_captura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 140,
      cell: ({ row }) => (
        <div className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</div>
      ),
    },
    {
      accessorKey: 'advogado_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado ID" />
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        return (
          <div className="text-sm text-center">
            {advogadoId ? `#${advogadoId}` : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Credenciais" />
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[];
        return (
          <div className="text-sm">
            {credencialIds.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {credencialIds.slice(0, 3).map((id) => (
                  <Badge key={id} variant="outline" className="text-xs">
                    #{id}
                  </Badge>
                ))}
                {credencialIds.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{credencialIds.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              '-'
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge status={row.getValue('status')} />
        </div>
      ),
    },
    {
      accessorKey: 'iniciado_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Iniciado Em" />
      ),
      enableSorting: true,
      size: 180,
      cell: ({ row }) => (
        <div className="text-sm">{formatarDataHora(row.getValue('iniciado_em'))}</div>
      ),
    },
    {
      accessorKey: 'concluido_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Concluído Em" />
      ),
      enableSorting: true,
      size: 180,
      cell: ({ row }) => {
        const concluidoEm = row.getValue('concluido_em') as string | null;
        return (
          <div className="text-sm">{concluidoEm ? formatarDataHora(concluidoEm) : '-'}</div>
        );
      },
    },
    {
      accessorKey: 'erro',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Erro" />
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const erro = row.getValue('erro') as string | null;
        return (
          <div className="text-sm text-destructive max-w-[250px] truncate" title={erro || undefined}>
            {erro || '-'}
          </div>
        );
      },
    },
  ];
}

export default function HistoricoCapturasPage() {
  const [pagina, setPagina] = React.useState(1);
  const [limite, setLimite] = React.useState(50);
  const [tipoCaptura, setTipoCaptura] = React.useState<TipoCaptura | 'todos'>('todos');
  const [status, setStatus] = React.useState<StatusCaptura | 'todos'>('todos');
  const [advogadoId, setAdvogadoId] = React.useState<number | undefined>(undefined);
  const [dataInicio, setDataInicio] = React.useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = React.useState<Date | undefined>(undefined);

  // Buscar advogados para filtro
  const { advogados } = useAdvogados({ limite: 1000 });

  // Buscar histórico de capturas
  const { capturas, paginacao, isLoading, error, refetch } = useCapturasLog({
    pagina,
    limite,
    tipo_captura: tipoCaptura !== 'todos' ? tipoCaptura : undefined,
    status: status !== 'todos' ? status : undefined,
    advogado_id: advogadoId,
    data_inicio: dataInicio ? dataInicio.toISOString().split('T')[0] : undefined,
    data_fim: dataFim ? dataFim.toISOString().split('T')[0] : undefined,
  });

  const colunas = React.useMemo(() => criarColunas(), []);

  // Resetar página quando filtros mudarem
  React.useEffect(() => {
    setPagina(1);
  }, [tipoCaptura, status, advogadoId, dataInicio, dataFim]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Capturas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize todas as capturas realizadas no sistema
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Tipo de Captura */}
        <Select
          value={tipoCaptura}
          onValueChange={(value) => setTipoCaptura(value as TipoCaptura | 'todos')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
            <SelectItem value="arquivados">Arquivados</SelectItem>
            <SelectItem value="audiencias">Audiências</SelectItem>
            <SelectItem value="pendentes">Pendentes</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusCaptura | 'todos')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
          </SelectContent>
        </Select>

        {/* Advogado */}
        <Select
          value={advogadoId?.toString() || 'todos'}
          onValueChange={(value) => setAdvogadoId(value === 'todos' ? undefined : parseInt(value, 10))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Advogado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Advogados</SelectItem>
            {advogados.map((advogado) => (
              <SelectItem key={advogado.id} value={advogado.id.toString()}>
                {advogado.nome_completo} - OAB {advogado.oab}/{advogado.uf_oab}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Data Início */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="data-inicio" className="text-xs text-muted-foreground">
            Data Início
          </Label>
          <Input
            id="data-inicio"
            type="date"
            value={dataInicio ? dataInicio.toISOString().split('T')[0] : ''}
            onChange={(e) => setDataInicio(e.target.value ? new Date(e.target.value) : undefined)}
            className="w-[180px]"
          />
        </div>

        {/* Data Fim */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="data-fim" className="text-xs text-muted-foreground">
            Data Fim
          </Label>
          <Input
            id="data-fim"
            type="date"
            value={dataFim ? dataFim.toISOString().split('T')[0] : ''}
            onChange={(e) => setDataFim(e.target.value ? new Date(e.target.value) : undefined)}
            className="w-[180px]"
          />
        </div>

        {/* Botão Limpar Filtros */}
        {(tipoCaptura !== 'todos' || status !== 'todos' || advogadoId !== undefined || dataInicio || dataFim) && (
          <Button
            variant="outline"
            onClick={() => {
              setTipoCaptura('todos');
              setStatus('todos');
              setAdvogadoId(undefined);
              setDataInicio(undefined);
              setDataFim(undefined);
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      <DataTable
        data={capturas}
        columns={colunas}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.pagina - 1,
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma captura encontrada no histórico."
      />
    </div>
  );
}

