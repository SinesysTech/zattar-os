'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Edit2, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Parcela {
  id: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosSucumbenciais: number;
  honorariosContratuais: number;
  dataVencimento: string;
  status: 'pendente' | 'recebida' | 'paga' | 'atrasado';
  formaPagamento: string;
  statusRepasse: string;
  valorRepasseCliente: number | null;
  editadoManualmente: boolean;
}

interface ParcelasTableProps {
  parcelas: Parcela[];
  onEdit?: (parcela: Parcela) => void;
  onMarcarRecebida?: (parcelaId: number) => void;
  onMarcarPaga?: (parcelaId: number) => void;
  direcao: 'recebimento' | 'pagamento';
}

export function ParcelasTable({
  parcelas,
  onEdit,
  onMarcarRecebida,
  onMarcarPaga,
  direcao,
}: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const getStatusBadge = (status: Parcela['status']) => {
    const variants = {
      pendente: 'secondary' as const,
      recebida: 'default' as const,
      paga: 'default' as const,
      atrasado: 'destructive' as const,
    };

    const labels = {
      pendente: 'Pendente',
      recebida: 'Recebida',
      paga: 'Paga',
      atrasado: 'Atrasado',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getStatusRepasseBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      nao_aplicavel: 'outline',
      pendente_declaracao: 'secondary',
      pendente_transferencia: 'default',
      repassado: 'default',
    };

    const labels: Record<string, string> = {
      nao_aplicavel: 'N/A',
      pendente_declaracao: 'Pendente Declaração',
      pendente_transferencia: 'Pendente Transferência',
      repassado: 'Repassado',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handleMarcar = async (parcelaId: number, tipo: 'recebida' | 'paga') => {
    setLoadingId(parcelaId);
    try {
      if (tipo === 'recebida' && onMarcarRecebida) {
        await onMarcarRecebida(parcelaId);
      } else if (tipo === 'paga' && onMarcarPaga) {
        await onMarcarPaga(parcelaId);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Parcela</TableHead>
            <TableHead>Crédito Principal</TableHead>
            <TableHead>Hon. Contratuais</TableHead>
            <TableHead>Hon. Sucumbenciais</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Forma Pgto</TableHead>
            {direcao === 'recebimento' && <TableHead>Repasse</TableHead>}
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Nenhuma parcela encontrada
              </TableCell>
            </TableRow>
          ) : (
            parcelas.map((parcela) => (
              <TableRow key={parcela.id}>
                <TableCell className="font-medium">
                  {parcela.numeroParcela}
                  {parcela.editadoManualmente && (
                    <span className="ml-1 text-xs text-muted-foreground" title="Editado manualmente">
                      *
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(parcela.valorBrutoCreditoPrincipal)}</TableCell>
                <TableCell>{formatCurrency(parcela.honorariosContratuais)}</TableCell>
                <TableCell>{formatCurrency(parcela.honorariosSucumbenciais)}</TableCell>
                <TableCell>{formatDate(parcela.dataVencimento)}</TableCell>
                <TableCell>{getStatusBadge(parcela.status)}</TableCell>
                <TableCell className="text-xs">
                  {parcela.formaPagamento.replace(/_/g, ' ')}
                </TableCell>
                {direcao === 'recebimento' && (
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusRepasseBadge(parcela.statusRepasse)}
                      {parcela.valorRepasseCliente && (
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(parcela.valorRepasseCliente)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {onEdit && parcela.status === 'pendente' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(parcela)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {parcela.status === 'pendente' && (
                      <>
                        {direcao === 'recebimento' && onMarcarRecebida && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcar(parcela.id, 'recebida')}
                            disabled={loadingId === parcela.id}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Recebida
                          </Button>
                        )}
                        {direcao === 'pagamento' && onMarcarPaga && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarcar(parcela.id, 'paga')}
                            disabled={loadingId === parcela.id}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Paga
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
