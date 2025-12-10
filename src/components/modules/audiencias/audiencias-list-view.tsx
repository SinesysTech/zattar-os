import { Audiencia } from '@/core/audiencias/domain';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { PencilIcon, EyeIcon } from 'lucide-react';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AudienciasListViewProps {
  audiencias: Audiencia[];
  refetch: () => void;
}

export function AudienciasListView({ audiencias, refetch }: AudienciasListViewProps) {
  const columns: ColumnDef<Audiencia>[] = [
    {
      accessorKey: 'dataInicio',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const audiencia = row.original;
        const dataLocal = new Date(audiencia.dataInicio);
        const horaLocal = new Date(audiencia.dataFim);
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {format(dataLocal, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
            {audiencia.status && <AudienciaStatusBadge status={audiencia.status} />}
          </div>
        );
      },
    },
    {
      accessorKey: 'numeroProcesso',
      header: 'Processo',
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <div className="flex flex-col">
            <span>{audiencia.numeroProcesso}</span>
            <span className="text-sm text-muted-foreground">
              {audiencia.trt} - {audiencia.grau === 'primeiro_grau' ? '1º Grau' : audiencia.grau === 'segundo_grau' ? '2º Grau' : 'Superior'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoDescricao',
      header: 'Tipo',
      cell: ({ row }) => row.original.tipoDescricao || 'N/A',
    },
    {
      accessorKey: 'partes',
      header: 'Partes',
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <div className="flex flex-col">
            <span>{audiencia.poloAtivoNome}</span>
            <span className="text-sm text-muted-foreground">vs {audiencia.poloPassivoNome}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'modalidade',
      header: 'Modalidade',
      cell: ({ row }) => {
        const audiencia = row.original;
        return audiencia.modalidade ? <AudienciaModalidadeBadge modalidade={audiencia.modalidade} /> : 'N/A';
      },
    },
    {
      accessorKey: 'responsavel',
      header: 'Responsável',
      cell: ({ row }) => {
        const audiencia = row.original;
        // Assuming there's a way to get responsible user's name/avatar based on responsavelId
        // For now, using a placeholder
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="Responsável" />
              <AvatarFallback>{audiencia.responsavelId ? 'RS' : 'SN'}</AvatarFallback>
            </Avatar>
            <span>{audiencia.responsavelId ? `Usuário ${audiencia.responsavelId}` : 'Sem Responsável'}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => console.log('View', row.original.id)}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => console.log('Edit', row.original.id)}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          {/* Add more actions like "Marcar como Realizada" */}
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-md border">
      <DataTable columns={columns} data={audiencias} />
    </div>
  );
}
