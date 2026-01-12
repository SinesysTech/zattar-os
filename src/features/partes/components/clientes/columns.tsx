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
  // Compat: alguns repositories mapeiam snake_case -> camelCase
  tipoPessoa?: string;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  nomeCompleto?: string | null;
  dataNascimento?: string | null;
  dddCelular?: string | null;
  numeroCelular?: string | null;
  dddComercial?: string | null;
  numeroComercial?: string | null;
  dddResidencial?: string | null;
  numeroResidencial?: string | null;
  processosRelacionados?: ProcessoRelacionado[];
};

function coalesceString(...values: Array<unknown>): string | null {
  for (const v of values) {
    if (typeof v === 'string') return v;
  }
  return null;
}

function normalizeTipoPessoa(cliente: ClienteComProcessos): 'pf' | 'pj' | null {
  const raw = coalesceString((cliente as any).tipo_pessoa, (cliente as any).tipoPessoa);
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();
  if (lower === 'pf') return 'pf';
  if (lower === 'pj') return 'pj';
  return null;
}

function normalizeEndereco(endereco: ClienteComProcessos['endereco']): ClienteEndereco | null {
  if (!endereco || typeof endereco !== 'object') return null;

  // Aceita tanto estado_sigla quanto estadoSigla
  const estadoSigla =
    (endereco as any).estado_sigla ??
    (endereco as any).estadoSigla ??
    null;

  return {
    ...(endereco as any),
    estado_sigla: estadoSigla,
  } as ClienteEndereco;
}

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
            <Link href={`/app/partes/clientes/${cliente.id}`}>
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
      const tipoPessoa = normalizeTipoPessoa(cliente);
      const isPF = tipoPessoa === 'pf';

      const documento = isPF
        ? formatarCpf((cliente as any).cpf)
        : formatarCnpj((cliente as any).cnpj);
      const documentoRaw = isPF ? (cliente as any).cpf : (cliente as any).cnpj;

      const dataNascimento = isPF
        ? coalesceString((cliente as any).data_nascimento, (cliente as any).dataNascimento)
        : null;
      const idade = calcularIdade(dataNascimento);

      // Identificação: para PJ, priorizar razão social/nome completo; para PF, usar nome
      const labelPrimario = formatarNome(
        coalesceString(
          (isPF ? (cliente as any).nome : null),
          (cliente as any).razao_social,
          (cliente as any).razaoSocial,
          (cliente as any).nome_completo,
          (cliente as any).nomeCompleto,
          (cliente as any).nome
        ) || ''
      );
      const labelSecundario = coalesceString(
        (cliente as any).nome_social_fantasia,
        (cliente as any).nomeFantasia
      );

      return (
        <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
          <div className="flex items-center gap-1 max-w-full">
            <span className="text-sm font-medium wrap-break-word whitespace-normal">
              {labelPrimario}
            </span>
            <CopyButton text={labelPrimario} label="Copiar nome" />
          </div>
          {labelSecundario && (
            <div className="flex items-center gap-1 max-w-full">
              <span className="text-xs text-muted-foreground wrap-break-word whitespace-normal">
                {labelSecundario}
              </span>
              <CopyButton text={labelSecundario} label="Copiar nome fantasia" />
            </div>
          )}
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
            {
              ddd: (cliente as any).ddd_celular ?? (cliente as any).dddCelular,
              numero: (cliente as any).numero_celular ?? (cliente as any).numeroCelular,
            },
            {
              ddd: (cliente as any).ddd_comercial ?? (cliente as any).dddComercial,
              numero: (cliente as any).numero_comercial ?? (cliente as any).numeroComercial,
            },
            {
              ddd: (cliente as any).ddd_residencial ?? (cliente as any).dddResidencial,
              numero: (cliente as any).numero_residencial ?? (cliente as any).numeroResidencial,
            },
          ]}
          emails={(cliente as any).emails}
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
      const enderecoFormatado = formatarEnderecoCompleto(normalizeEndereco((cliente as any).endereco));
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
      const processos =
        ((cliente as any).processos_relacionados ??
          (cliente as any).processosRelacionados ??
          []) as ProcessoRelacionado[];
      return (
        <div className="flex items-center justify-center">
          <ProcessosRelacionadosCell
            processos={processos}
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
