'use client';

/**
 * ParcelasTable — Glass Briefing
 * ============================================================================
 * Lista de parcelas em GlassPanel rows (ex-shadcn Table).
 * Agrupa dados financeiros na mesma coluna para manter cada row respirável.
 * ============================================================================
 */

import { useState } from 'react';
import { CheckCircle2, Edit2, FileX } from 'lucide-react';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { formatCurrency, formatDate } from '../../utils';
import type { Parcela } from '../../types';
import { actionMarcarParcelaRecebida } from '../../actions/parcelas';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

interface ParcelasTableProps {
  parcelas: Parcela[];
  onEdit?: (parcela: Parcela) => void;
  onMarcarRecebida?: (parcelaId: number) => void;
  onMarcarPaga?: (parcelaId: number) => void;
  direcao: 'recebimento' | 'pagamento';
  onParcelaUpdated?: () => void;
  acordoCondenacaoId?: number;
}

const PARCELA_STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  recebida: 'Recebida',
  paga: 'Paga',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
};

const REPASSE_STATUS_LABELS: Record<string, string> = {
  nao_aplicavel: 'N/A',
  pendente_declaracao: 'Pend. Declaração',
  pendente_transferencia: 'Pend. Transferência',
  repassado: 'Repassado',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ParcelasTable({
  parcelas,
  onEdit,
  onMarcarRecebida,
  onMarcarPaga,
  direcao,
  onParcelaUpdated,
}: ParcelasTableProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleMarcar = async (
    parcelaId: number,
    tipo: 'recebida' | 'paga',
  ) => {
    setLoadingId(parcelaId);
    try {
      if (tipo === 'recebida' && onMarcarRecebida) {
        await onMarcarRecebida(parcelaId);
      } else if (tipo === 'paga' && onMarcarPaga) {
        await onMarcarPaga(parcelaId);
      } else {
        const response = await actionMarcarParcelaRecebida(parcelaId, {
          dataRecebimento: new Date().toISOString(),
        });

        if (response.success) {
          toast.success(
            tipo === 'recebida'
              ? 'Parcela marcada como recebida'
              : 'Parcela marcada como paga',
          );
          onParcelaUpdated?.();
        } else {
          toast.error(response.error || 'Erro ao atualizar parcela');
        }
      }
    } catch {
      toast.error('Erro inesperado');
    } finally {
      setLoadingId(null);
    }
  };

  if (parcelas.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 opacity-60")}>
        <FileX className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className={cn( "text-body-sm font-medium text-muted-foreground/50")}>
          Nenhuma parcela encontrada
        </p>
      </div>
    );
  }

  const isRecebimento = direcao === 'recebimento';

  return (
    <div className={cn("flex flex-col inline-tight")}>
      {parcelas.map((parcela) => {
        const isPendente = parcela.status === 'pendente';
        const isAtrasada = parcela.status === 'atrasada';
        const isLoading = loadingId === parcela.id;

        return (
          <GlassPanel
            key={parcela.id}
            depth={1}
            className={cn(
              'px-4 py-3 transition-colors',
              isAtrasada && 'border-destructive/20',
            )}
          >
            <div className={cn("flex items-center inline-medium flex-wrap")}>
              {/* Numero da parcela */}
              <div className="size-8 rounded-lg bg-primary/8 text-primary/80 flex items-center justify-center shrink-0">
                <span className={cn( "text-[11px] font-bold tabular-nums")}>
                  {parcela.numeroParcela}
                </span>
              </div>

              {/* Dados financeiros agrupados */}
              <div className="flex-1 min-w-60">
                <div className={cn( "text-body-sm font-medium tabular-nums")}>
                  {formatCurrency(parcela.valorBrutoCreditoPrincipal)}
                  {parcela.editadoManualmente && (
                    <span
                      className="ml-1 text-[10px] text-warning/70"
                      title="Editado manualmente"
                    >
                      ●
                    </span>
                  )}
                </div>
                <div className={cn("text-[10px] text-muted-foreground/55 mt-0.5 flex inline-tight flex-wrap")}>
                  <span>
                    Hon. contr: {formatCurrency(parcela.honorariosContratuais)}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>
                    Hon. suc: {formatCurrency(parcela.honorariosSucumbenciais)}
                  </span>
                </div>
              </div>

              {/* Vencimento + forma pagamento */}
              <div className="min-w-25">
                <Text variant="caption" className="tabular-nums">
                  {formatDate(parcela.dataVencimento)}
                </Text>
                {parcela.formaPagamento && (
                  <div className="text-[10px] text-muted-foreground/50 capitalize mt-0.5 truncate">
                    {parcela.formaPagamento.replace(/_/g, ' ')}
                  </div>
                )}
              </div>

              {/* Status parcela */}
              <div className="shrink-0">
                <SemanticBadge
                  category="parcela_status"
                  value={parcela.status}
                  className="text-[10px]"
                >
                  {PARCELA_STATUS_LABELS[parcela.status] || parcela.status}
                </SemanticBadge>
              </div>

              {/* Repasse (apenas em recebimento) */}
              {isRecebimento && (
                <div className="min-w-27.5 shrink-0">
                  <SemanticBadge
                    category="repasse_status"
                    value={parcela.statusRepasse}
                    className="text-[9px]"
                  >
                    {REPASSE_STATUS_LABELS[parcela.statusRepasse] ||
                      parcela.statusRepasse}
                  </SemanticBadge>
                  {parcela.valorRepasseCliente ? (
                    <div className="text-[10px] text-muted-foreground/55 tabular-nums mt-0.5">
                      {formatCurrency(parcela.valorRepasseCliente)}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Ações */}
              <div className={cn("flex items-center inline-micro shrink-0")}>
                {onEdit && isPendente && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn("h-7 w-7 inset-none")}
                    onClick={() => onEdit(parcela)}
                    aria-label="Editar parcela"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {isPendente && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn("h-7 text-[11px] px-2.5")}
                    onClick={() =>
                      handleMarcar(
                        parcela.id,
                        isRecebimento ? 'recebida' : 'paga',
                      )
                    }
                    disabled={isLoading}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {isRecebimento ? 'Recebida' : 'Paga'}
                  </Button>
                )}
              </div>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
