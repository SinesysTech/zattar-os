'use client';

/**
 * Dialog para adicionar/editar itens do orçamento
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  criarItemOrcamento,
  atualizarItemOrcamento,
} from '@/app/_lib/hooks/use-orcamentos';
import { usePlanoContasHierarquiaAchatada } from '@/app/_lib/hooks/use-plano-contas-hierarquia';
import { PlanoContaSelect } from '@/app/(dashboard)/financeiro/plano-contas/components/plano-conta-select';
import type {
  OrcamentoItemComDetalhes,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
} from '@/backend/types/financeiro/orcamento.types';

// ============================================================================
// Tipos
// ============================================================================

interface OrcamentoItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId: number;
  item?: OrcamentoItemComDetalhes | null;
  onSuccess?: () => void;
}

interface FormData {
  contaContabilId: number | null;
  centroCustoId: number | null;
  valorOrcado: string;
  observacoes: string;
}

// ============================================================================
// Componente
// ============================================================================

export function OrcamentoItemDialog({
  open,
  onOpenChange,
  orcamentoId,
  item,
  onSuccess,
}: OrcamentoItemDialogProps) {
  const isEditing = !!item;
  const [isLoading, setIsLoading] = React.useState(false);

  const [formData, setFormData] = React.useState<FormData>({
    contaContabilId: null,
    centroCustoId: null,
    valorOrcado: '',
    observacoes: '',
  });

  // Preencher formulário ao editar
  React.useEffect(() => {
    if (item) {
      setFormData({
        contaContabilId: item.contaContabilId,
        centroCustoId: item.centroCustoId || null,
        valorOrcado: item.valorOrcado.toString(),
        observacoes: item.observacoes || '',
      });
    } else {
      setFormData({
        contaContabilId: null,
        centroCustoId: null,
        valorOrcado: '',
        observacoes: '',
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.contaContabilId) {
      toast.error('Conta contábil é obrigatória');
      return;
    }

    const valorNumerico = parseFloat(formData.valorOrcado.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Valor orçado deve ser maior que zero');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && item) {
        const dados: AtualizarOrcamentoItemDTO = {
          contaContabilId: formData.contaContabilId,
          centroCustoId: formData.centroCustoId || undefined,
          valorOrcado: valorNumerico,
          observacoes: formData.observacoes || undefined,
        };

        const resultado = await atualizarItemOrcamento(orcamentoId, item.id, dados);
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
        toast.success('Item atualizado com sucesso');
      } else {
        const dados: Omit<CriarOrcamentoItemDTO, 'orcamentoId'> = {
          contaContabilId: formData.contaContabilId,
          centroCustoId: formData.centroCustoId || undefined,
          valorOrcado: valorNumerico,
          observacoes: formData.observacoes || undefined,
        };

        const resultado = await criarItemOrcamento(orcamentoId, dados);
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
        toast.success('Item adicionado com sucesso');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar item';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    // Remove tudo exceto números e vírgula/ponto
    const numericValue = value.replace(/[^\d,\.]/g, '');
    return numericValue;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Item' : 'Adicionar Item ao Orçamento'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize as informações do item.'
                : 'Preencha as informações do novo item do orçamento.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Conta Contábil */}
            <div className="grid gap-2">
              <Label htmlFor="contaContabilId">Conta Contábil *</Label>
              <PlanoContaSelect
                value={formData.contaContabilId}
                onChange={(value) => setFormData({ ...formData, contaContabilId: value })}
                disabled={isLoading}
                placeholder="Selecione a conta contábil"
              />
            </div>

            {/* Valor Orçado */}
            <div className="grid gap-2">
              <Label htmlFor="valorOrcado">Valor Orçado *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="valorOrcado"
                  type="text"
                  inputMode="decimal"
                  value={formData.valorOrcado}
                  onChange={(e) =>
                    setFormData({ ...formData, valorOrcado: formatCurrency(e.target.value) })
                  }
                  className="pl-10"
                  placeholder="0,00"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o item"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
