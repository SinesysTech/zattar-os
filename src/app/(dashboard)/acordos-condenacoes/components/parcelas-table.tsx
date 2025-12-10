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
import type { BadgeProps } from '@/components/ui/badge';
import { CheckCircle2, Edit2, FileX } from 'lucide-react';
import { formatCurrency, formatDate } from '@/core/app/_lib/utils/utils';
import { toast } from 'sonner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

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
  onParcelaUpdated?: () => void;
  acordoCondenacaoId?: number;
}

export function ParcelasTable({
  parcelas,
  onEdit,
  onMarcarRecebida,
  onMarcarPaga,
  direcao,
  onParcelaUpdated,
  acordoCondenacaoId,
}: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

    const getStatusBadge = (status: Parcela['status']) => {
      const styles: Record<Parcela['status'], { tone: 'warning' | 'success' | 'danger'; variant: 'soft' | 'solid' }> = {
        pendente: { tone: 'warning', variant: 'soft' },
        recebida: { tone: 'success', variant: 'soft' },
        paga: { tone: 'success', variant: 'soft' },
        atrasado: { tone: 'danger', variant: 'solid' },
      };

      const labels = {
        pendente: 'Pendente',
        recebida: 'Recebida',
        paga: 'Paga',
        atrasado: 'Atrasado',
      };

      return (
        <Badge {...styles[status]}>
          {labels[status]}
        </Badge>
      );
    };

    const getStatusRepasseBadge = (status: string) => {
      const styles: Record<string, { tone: BadgeProps['tone']; variant: BadgeProps['variant'] }> = {
        nao_aplicavel: { tone: 'neutral', variant: 'outline' },
        pendente_declaracao: { tone: 'warning', variant: 'soft' },
        pendente_transferencia: { tone: 'info', variant: 'soft' },
        repassado: { tone: 'success', variant: 'soft' },
      };

      const labels: Record<string, string> = {
        nao_aplicavel: 'N/A',
        pendente_declaracao: 'Pendente Declaração',
        pendente_transferencia: 'Pendente Transferência',
        repassado: 'Repassado',
      };

      const style = styles[status] || { tone: 'neutral' as const, variant: 'outline' as const };

      return (
        <Badge {...style}>
          {labels[status] || status}
        </Badge>
      );
    };

  const handleMarcar = async (parcelaId: number, tipo: 'recebida' | 'paga') => {
    setLoadingId(parcelaId);
    try {
      // Se callbacks customizados foram fornecidos, use-os
      if (tipo === 'recebida' && onMarcarRecebida) {
        await onMarcarRecebida(parcelaId);
      } else if (tipo === 'paga' && onMarcarPaga) {
        await onMarcarPaga(parcelaId);
      } else if (acordoCondenacaoId) {
        // Caso contrário, chame a API diretamente
        const response = await fetch(
          `/api/acordos-condenacoes/${acordoCondenacaoId}/parcelas/${parcelaId}/receber`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dataEfetivacao: new Date().toISOString(),
            }),
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success(
            tipo === 'recebida'
              ? 'Parcela marcada como recebida'
              : 'Parcela marcada como paga'
          );
          if (onParcelaUpdated) {
            onParcelaUpdated();
          }
        } else {
          toast.error(result.error || 'Erro ao atualizar parcela');
        }
      }
    } catch (error) {
      console.error('Erro ao marcar parcela:', error);
      toast.error('Erro ao comunicar com o servidor');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Parcela</TableHead>
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
              <TableCell colSpan={9} className="p-0">
                <Empty className="border-0 py-8">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileX className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma parcela encontrada</EmptyTitle>
                  </EmptyHeader>
                </Empty>
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
