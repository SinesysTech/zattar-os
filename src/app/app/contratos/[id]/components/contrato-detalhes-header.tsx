'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, MoreHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Contrato } from '@/features/contratos';
import {
  formatarStatusContrato,
  formatarTipoContrato,
  getStatusVariant,
  ContratoDeleteDialog,
} from '@/features/contratos';

interface ContratoDetalhesHeaderProps {
  contrato: Contrato;
  clienteNome: string;
  onEdit?: () => void;
}

export function ContratoDetalhesHeader({
  contrato,
  clienteNome,
  onEdit,
}: ContratoDetalhesHeaderProps) {
  const router = useRouter();
  const statusLabel = formatarStatusContrato(contrato.status);
  const tipoContratoLabel = formatarTipoContrato(contrato.tipoContrato);
  const statusVariant = getStatusVariant(contrato.status);

  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app/contratos')}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            title="Voltar para Contratos"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {tipoContratoLabel} - {clienteNome.toUpperCase()}
              </h1>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Contrato #{contrato.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="size-4 mr-2" />
              Editar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/app/clientes/${contrato.clienteId}`}>
                  Ver Cliente
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4 mr-2" />
                Excluir Contrato
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContratoDeleteDialog
        contratoId={contrato.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push('/app/contratos')}
      />
    </>
  );
}
