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
import { ProcessosRelacionadosCell } from '../shared/processos-relacionados-cell';
import { CopyButton } from '../shared/copy-button';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
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
    cell: ({ row }) => {
      const cliente = row.original;
      const isPF = cliente.tipo_pessoa === 'pf';
      const documento = isPF ? formatarCpf(cliente.cpf) : formatarCnpj(cliente.cnpj);
      const documentoRaw = isPF ? cliente.cpf : cliente.cnpj;
      const dataNascimento = isPF && 'data_nascimento' in cliente ? cliente.data_nascimento : null;
      const idade = calcularIdade(dataNascimento);

      return (
        <div className="flex flex-col gap-0.5 min-w-[300px]">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium truncate">
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
            <span className="text-xs text-muted-foreground">
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
    cell: ({ row }) => {
      const cliente = row.original;
      const emails = cliente.emails || [];

      const telefones: { ddd: string; numero: string; tipo: string }[] = [];
      if (cliente.ddd_celular && cliente.numero_celular) {
        telefones.push({ ddd: cliente.ddd_celular, numero: cliente.numero_celular, tipo: 'Cel' });
      }
      if (cliente.ddd_residencial && cliente.numero_residencial) {
        telefones.push({ ddd: cliente.ddd_residencial, numero: cliente.numero_residencial, tipo: 'Res' });
      }
      if (cliente.ddd_comercial && cliente.numero_comercial) {
        telefones.push({ ddd: cliente.ddd_comercial, numero: cliente.numero_comercial, tipo: 'Com' });
      }

      const hasContato = emails.length > 0 || telefones.length > 0;

      return (
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          {hasContato ? (
            <>
              {emails.slice(0, 2).map((email, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground truncate max-w-[220px]">
                    {email}
                  </span>
                  <CopyButton text={email} label="Copiar e-mail" />
                </div>
              ))}
              {emails.length > 2 && (
                <span className="text-sm text-muted-foreground">
                  +{emails.length - 2} e-mail(s)
                </span>
              )}
              {telefones.map((tel, idx) => {
                const telefoneFormatado = formatarTelefone(`${tel.ddd}${tel.numero}`);
                const telefoneRaw = `${tel.ddd}${tel.numero}`;
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      {telefoneFormatado}
                    </span>
                    <CopyButton text={telefoneRaw} label="Copiar telefone" />
                  </div>
                );
              })}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'endereco',
    header: 'Endereço',
    cell: ({ row }) => {
      const cliente = row.original;
      const enderecoFormatado = formatarEnderecoCompleto(cliente.endereco);
      return (
        <div
          className="min-w-0 max-w-full overflow-hidden text-sm text-muted-foreground whitespace-normal wrap-break-word"
          title={enderecoFormatado}
        >
          {enderecoFormatado || '-'}
        </div>
      );
    },
  },
  {
    id: 'processos',
    header: 'Processos',
    cell: ({ row }) => {
      const cliente = row.original;
      return (
        <ProcessosRelacionadosCell
          processos={cliente.processos_relacionados || []}
        />
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => (
      <ClienteActions cliente={row.original} onEdit={onEdit} onDelete={onDelete} />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
