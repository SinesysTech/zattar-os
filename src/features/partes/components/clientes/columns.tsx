'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type { Cliente, ProcessoRelacionado } from '../../types';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell } from '../shared';
import {
  formatarCpf,
  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';

// Types
type ClienteEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

export type ClienteComProcessos = Cliente & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: ClienteEndereco | null;
};

// Actions Component
function ClienteActions({
  cliente,
  onEdit,
  onDelete,
}: {
  cliente: ClienteComProcessos;
  onEdit: (cliente: ClienteComProcessos) => void;
  onDelete: (cliente: ClienteComProcessos) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href={`/partes/clientes/${cliente.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar cliente</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(cliente)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar cliente</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Desativar cliente</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Desativar</TooltipContent>
        </Tooltip>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso é um soft delete. O cliente ficará como inativo e não aparecerá nas listagens padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(cliente)}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ButtonGroup>
  );
}

// Helpers
function formatarData(dataISO: string | null): string {
  if (!dataISO) return '';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// Define Columns
export const getClientesColumns = (
  onEdit: (cliente: ClienteComProcessos) => void,
  onDelete: (cliente: ClienteComProcessos) => void
): ColumnDef<ClienteComProcessos>[] => [
  {
    accessorKey: 'nome',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Identificação" />
    ),
    meta: { align: 'left' },
    size: 280,
    cell: ({ row }) => {
      const cliente = row.original;
      const isPF = cliente.tipo_pessoa === 'pf';
      const documento = isPF ? formatarCpf(cliente.cpf) : formatarCnpj(cliente.cnpj);
      const documentoRaw = isPF ? cliente.cpf : cliente.cnpj;
      const dataNascimento = isPF && 'data_nascimento' in cliente ? cliente.data_nascimento : null;
      const idade = calcularIdade(dataNascimento);

      return (
        <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
          <div className="flex items-center gap-1 max-w-full">
            <span className="text-sm font-medium wrap-break-word whitespace-normal">
              {formatarNome(cliente.nome)}
            </span>
            <CopyButton text={cliente.nome} label="Copiar nome" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              {documento}
            </span>
            {documentoRaw && (
              <CopyButton text={documentoRaw} label={isPF ? 'Copiar CPF' : 'Copiar CNPJ'} />
            )}
          </div>
          {isPF && dataNascimento && (
            <span className="text-xs text-muted-foreground text-left">
              {formatarData(dataNascimento)}
              {idade !== null && ` - ${idade} anos`}
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    id: 'contato',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
    meta: { align: 'left' },
    size: 240,
    cell: ({ row }) => {
      const cliente = row.original;
      return (
        <ContatoCell
          telefones={[
            { ddd: cliente.ddd_celular, numero: cliente.numero_celular },
            { ddd: cliente.ddd_comercial, numero: cliente.numero_comercial },
            { ddd: cliente.ddd_residencial, numero: cliente.numero_residencial },
          ]}
          emails={cliente.emails}
        />
      );
    },
  },
  {
    id: 'endereco',
    header: 'Endereço',
    meta: { align: 'left' },
    size: 280,
    cell: ({ row }) => {
      const cliente = row.original;
      const enderecoFormatado = formatarEnderecoCompleto(cliente.endereco);
      const hasEndereco = enderecoFormatado && enderecoFormatado !== '-';

      return (
        <div className="flex items-start gap-1 max-w-full overflow-hidden">
          <span
            className="text-sm whitespace-normal wrap-break-word flex-1"
            title={enderecoFormatado}
          >
            {enderecoFormatado || '-'}
          </span>
          {hasEndereco && (
            <>
              <CopyButton text={enderecoFormatado} label="Copiar endereço" />
              <MapButton address={enderecoFormatado} />
            </>
          )}
        </div>
      );
    },
  },
  {
    id: 'processos',
    header: 'Processos',
    meta: { align: 'center' },
    size: 200,
    cell: ({ row }) => {
      const cliente = row.original;
      return (
        <div className="flex items-center justify-center">
          <ProcessosRelacionadosCell
            processos={cliente.processos_relacionados || []}
          />
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    meta: { align: 'center' },
    size: 120,
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <ClienteActions cliente={row.original} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
