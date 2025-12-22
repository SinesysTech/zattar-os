'use client';

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { 
  ChamadaComParticipantes, 
  ListarChamadasParams, 
  PaginationInfo,
  TipoChamada,
  StatusChamada 
} from '../domain';
import { actionListarHistoricoGlobal } from '../actions/chamadas-actions';
import { 
  DataShell, 
  DataTable, 
  DataTableToolbar, 
  DataPagination 
} from '@/components/shared/data-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatarDuracao, getStatusBadgeVariant, getStatusLabel, getTipoChamadaIcon } from '../utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CallDetailSheet } from './call-detail-sheet';
import { Eye, FileText, ListVideo, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CallHistoryListProps {
  initialData: ChamadaComParticipantes[];
  initialPagination: PaginationInfo;
}

export function CallHistoryList({ initialData, initialPagination }: CallHistoryListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = React.useState<ChamadaComParticipantes[]>(initialData);
  const [pagination, setPagination] = React.useState<PaginationInfo>(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedChamadaId, setSelectedChamadaId] = React.useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Sync with URL params
  const createQueryString = React.useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      
      for (const [key, value] of Object.entries(params)) {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      
      return newSearchParams.toString();
    },
    [searchParams]
  );

  const fetchData = async (params: ListarChamadasParams) => {
    setIsLoading(true);
    try {
      const result = await actionListarHistoricoGlobal(params);
      if (result.success) {
        setData(result.data.data);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = (pageIndex: number) => {
    const offset = pageIndex * pagination.pageSize;
    const params: ListarChamadasParams = {
      tipo: searchParams?.get('tipo') as TipoChamada | undefined,
      status: searchParams?.get('status') as StatusChamada | undefined,
      offset,
      limite: pagination.pageSize,
    };
    
    router.push(`${pathname}?${createQueryString({ page: pageIndex + 1 })}`);
    fetchData(params);
  };

  // Columns definition
  const columns: ColumnDef<ChamadaComParticipantes>[] = [
    {
      accessorKey: 'iniciadaEm',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const date = new Date(row.original.iniciadaEm);
        return (
          <div className="flex flex-col">
            <span className="font-medium">{format(date, 'dd/MM/yyyy', { locale: ptBR })}</span>
            <span className="text-xs text-muted-foreground">{format(date, 'HH:mm', { locale: ptBR })}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => {
        const Icon = getTipoChamadaIcon(row.original.tipo as TipoChamada);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{row.original.tipo}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'salaId', // TODO: Nome da sala
      header: 'Sala',
      cell: ({ row }) => (
        <span>Sala #{row.original.salaId}</span>
      ),
    },
    {
      accessorKey: 'iniciador',
      header: 'Iniciador',
      cell: ({ row }) => {
        const user = row.original.iniciador;
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.nomeCompleto.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[150px]" title={user.nomeCompleto}>
              {user.nomeExibicao || user.nomeCompleto.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      header: 'Participantes',
      cell: ({ row }) => {
        const count = row.original.participantes.length;
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm">{count}</span>
            <span className="text-xs text-muted-foreground">participantes</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'duracaoSegundos',
      header: 'Duração',
      cell: ({ row }) => {
        const duracao = row.original.duracaoSegundos;
        const status = row.original.status as StatusChamada;
        
        if (status === StatusChamada.EmAndamento) {
          return <Badge variant="outline" className="animate-pulse text-green-600 border-green-200">Em andamento</Badge>;
        }
        
        return duracao ? formatarDuracao(duracao) : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.status as StatusChamada)}>
          {getStatusLabel(row.original.status as StatusChamada)}
        </Badge>
      ),
    },
    {
      id: 'features',
      header: 'IA',
      cell: ({ row }) => {
        const hasTranscript = !!row.original.transcricao;
        const hasSummary = !!row.original.resumo;
        
        if (!hasTranscript && !hasSummary) return <span className="text-muted-foreground text-xs">-</span>;

        return (
           <div className="flex items-center gap-1">
             {hasTranscript && (
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <FileText className="w-4 h-4 text-blue-500" />
                   </TooltipTrigger>
                   <TooltipContent>Transcrição disponível</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             )}
             {hasSummary && (
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Sparkles className="w-4 h-4 text-purple-500" />
                   </TooltipTrigger>
                   <TooltipContent>Resumo IA gerado</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             )}
           </div>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedChamadaId(row.original.id);
            setIsSheetOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          Detalhes
        </Button>
      ),
    },
  ];

  // Filtros
  const handleFilterChange = (key: string, value: string | null) => {
    router.push(`${pathname}?${createQueryString({ [key]: value, page: 1 })}`);
    
    // Trigger fetch (reset to first page, so offset = 0)
    const params: ListarChamadasParams = {
      tipo: (key === 'tipo' ? value : searchParams?.get('tipo')) as TipoChamada | undefined,
      status: (key === 'status' ? value : searchParams?.get('status')) as StatusChamada | undefined,
      offset: 0,
      limite: pagination.pageSize,
    };
    fetchData(params);
  };

  return (
    <DataShell>
      <DataTableToolbar<ChamadaComParticipantes>
        filtersSlot={
          <>
            <select 
              className="h-8 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchParams?.get('tipo') || ''}
              onChange={(e) => handleFilterChange('tipo', e.target.value || null)}
              aria-label="Filtrar por tipo de chamada"
            >
              <option value="">Todos os tipos</option>
              <option value="audio">Áudio</option>
              <option value="video">Vídeo</option>
            </select>

            <select 
              className="h-8 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchParams?.get('status') || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
              aria-label="Filtrar por status da chamada"
            >
              <option value="">Todos os status</option>
              <option value="iniciada">Iniciada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </>
        }
      />
      
      <div className="rounded-md border">
        <DataTable 
          columns={columns} 
          data={data} 
          isLoading={isLoading}
        />
      </div>

      <DataPagination 
        pageIndex={pagination.currentPage - 1}
        pageSize={pagination.pageSize}
        total={pagination.totalCount}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={(newPageSize) => {
          const params: ListarChamadasParams = {
            tipo: searchParams?.get('tipo') as TipoChamada | undefined,
            status: searchParams?.get('status') as StatusChamada | undefined,
            offset: 0,
            limite: newPageSize,
          };
          router.push(`${pathname}?${createQueryString({ page: 1, pageSize: newPageSize })}`);
          fetchData(params);
        }}
      />

      <CallDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        chamadaId={selectedChamadaId}
      />
    </DataShell>
  );
}