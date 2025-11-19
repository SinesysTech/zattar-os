'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Parcela {
  id: number;
  numeroParcela: number;
  valorBrutoCreditoPrincipal: number;
  honorariosSucumbenciais: number;
  honorariosContratuais: number;
  dataVencimento: string;
  status: string;
  formaPagamento: string;
  statusRepasse: string;
  valorRepasseCliente: number | null;
  editadoManualmente: boolean;
}

interface EditParcelaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: Parcela | null;
  acordoCondenacaoId: number;
  onSuccess?: () => void;
}

export function EditParcelaDialog({
  open,
  onOpenChange,
  parcela,
  acordoCondenacaoId,
  onSuccess,
}: EditParcelaDialogProps) {
  const [valores, setValores] = useState({
    valorBrutoCreditoPrincipal: 0,
    honorariosSucumbenciais: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (parcela) {
      setValores({
        valorBrutoCreditoPrincipal: parcela.valorBrutoCreditoPrincipal,
        honorariosSucumbenciais: parcela.honorariosSucumbenciais,
      });
    }
  }, [parcela]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    // Remove tudo exceto números e vírgula/ponto
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleSave = async () => {
    if (!parcela) return;

    // Validações
    if (valores.valorBrutoCreditoPrincipal <= 0) {
      toast.error('O valor bruto do crédito principal deve ser maior que zero');
      return;
    }

    if (valores.honorariosSucumbenciais < 0) {
      toast.error('Os honorários sucumbenciais não podem ser negativos');
      return;
    }

    try {
      setIsSaving(true);

      // Atualizar a parcela
      const updateResponse = await fetch(
        `/api/acordos-condenacoes/${acordoCondenacaoId}/parcelas/${parcela.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valorBrutoCreditoPrincipal: valores.valorBrutoCreditoPrincipal,
            honorariosSucumbenciais: valores.honorariosSucumbenciais,
            editadoManualmente: true,
          }),
        }
      );

      const updateResult = await updateResponse.json();

      if (!updateResponse.ok || !updateResult.success) {
        toast.error(updateResult.error || 'Erro ao atualizar parcela');
        return;
      }

      // Recalcular distribuição
      const recalcResponse = await fetch(
        `/api/acordos-condenacoes/${acordoCondenacaoId}/recalcular`,
        {
          method: 'POST',
        }
      );

      const recalcResult = await recalcResponse.json();

      if (!recalcResponse.ok || !recalcResult.success) {
        toast.warning(
          'Parcela atualizada, mas houve erro ao recalcular distribuição'
        );
      }

      toast.success('Parcela atualizada com sucesso');

      // Limpar e fechar
      onOpenChange(false);

      // Notificar sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      toast.error('Erro ao comunicar com o servidor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Parcela #{parcela.numeroParcela}</DialogTitle>
          <DialogDescription>
            Altere os valores da parcela. Os valores das parcelas não editadas serão
            redistribuídos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valorBrutoCreditoPrincipal">
              Valor Bruto do Crédito Principal
            </Label>
            <Input
              id="valorBrutoCreditoPrincipal"
              type="text"
              value={valores.valorBrutoCreditoPrincipal.toFixed(2)}
              onChange={(e) =>
                setValores((prev) => ({
                  ...prev,
                  valorBrutoCreditoPrincipal: parseCurrency(e.target.value),
                }))
              }
              disabled={isSaving}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Atual: {formatCurrency(parcela.valorBrutoCreditoPrincipal)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="honorariosSucumbenciais">
              Honorários Sucumbenciais
            </Label>
            <Input
              id="honorariosSucumbenciais"
              type="text"
              value={valores.honorariosSucumbenciais.toFixed(2)}
              onChange={(e) =>
                setValores((prev) => ({
                  ...prev,
                  honorariosSucumbenciais: parseCurrency(e.target.value),
                }))
              }
              disabled={isSaving}
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Atual: {formatCurrency(parcela.honorariosSucumbenciais)}
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium mb-1">Atenção</p>
              <p>
                Ao editar manualmente os valores de uma parcela, as demais parcelas
                não editadas terão seus valores redistribuídos proporcionalmente para
                manter o valor total do acordo/condenação.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-pulse" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
