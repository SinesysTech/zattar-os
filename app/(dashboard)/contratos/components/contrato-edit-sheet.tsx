'use client';

// Componente Sheet para edição de contrato

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Contrato, ContratoDados } from '@/backend/contratos/services/persistence/contrato-persistence.service';

interface ContratoEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: Contrato | null;
  onSuccess: () => void;
}

export function ContratoEditSheet({
  open,
  onOpenChange,
  contrato,
  onSuccess,
}: ContratoEditSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<Partial<ContratoDados>>({});

  React.useEffect(() => {
    if (contrato && open) {
      // Preencher formulário com dados do contrato
      setFormData({
        areaDireito: contrato.areaDireito,
        tipoContrato: contrato.tipoContrato,
        tipoCobranca: contrato.tipoCobranca,
        status: contrato.status,
        clienteId: contrato.clienteId,
        poloCliente: contrato.poloCliente,
        parteContrariaId: contrato.parteContrariaId || undefined,
        responsavelId: contrato.responsavelId || undefined,
        dataContratacao: contrato.dataContratacao || undefined,
        dataAssinatura: contrato.dataAssinatura || undefined,
        dataDistribuicao: contrato.dataDistribuicao || undefined,
        dataDesistencia: contrato.dataDesistencia || undefined,
        observacoes: contrato.observacoes || undefined,
      });
      setError(null);
    }
  }, [contrato, open]);

  React.useEffect(() => {
    if (!open) {
      // Resetar erro quando fechar
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contrato) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contratos/${contrato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao atualizar contrato';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!contrato) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="pb-5">
            <SheetTitle className="text-xl font-semibold">
              Editar Contrato #{contrato.id}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>

              <div className="space-y-2">
                <Label htmlFor="areaDireito">Área de Direito</Label>
                <Select
                  value={formData.areaDireito}
                  onValueChange={(value) =>
                    setFormData({ ...formData, areaDireito: value as ContratoDados['areaDireito'] })
                  }
                >
                  <SelectTrigger id="areaDireito">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trabalhista">Trabalhista</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="previdenciario">Previdenciário</SelectItem>
                    <SelectItem value="criminal">Criminal</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoContrato">Tipo de Contrato</Label>
                <Select
                  value={formData.tipoContrato}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoContrato: value as ContratoDados['tipoContrato'] })
                  }
                >
                  <SelectTrigger id="tipoContrato">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ajuizamento">Ajuizamento</SelectItem>
                    <SelectItem value="defesa">Defesa</SelectItem>
                    <SelectItem value="ato_processual">Ato Processual</SelectItem>
                    <SelectItem value="assessoria">Assessoria</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="extrajudicial">Extrajudicial</SelectItem>
                    <SelectItem value="parecer">Parecer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                <Select
                  value={formData.tipoCobranca}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoCobranca: value as ContratoDados['tipoCobranca'] })
                  }
                >
                  <SelectTrigger id="tipoCobranca">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro_exito">Pró-Êxito</SelectItem>
                    <SelectItem value="pro_labore">Pró-Labore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ContratoDados['status'] })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_contratacao">Em Contratação</SelectItem>
                    <SelectItem value="contratado">Contratado</SelectItem>
                    <SelectItem value="distribuido">Distribuído</SelectItem>
                    <SelectItem value="desistencia">Desistência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datas</h3>

              <div className="space-y-2">
                <Label htmlFor="dataContratacao">Data de Contratação</Label>
                <Input
                  id="dataContratacao"
                  type="date"
                  value={formData.dataContratacao || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dataContratacao: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataAssinatura">Data de Assinatura</Label>
                <Input
                  id="dataAssinatura"
                  type="date"
                  value={formData.dataAssinatura || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dataAssinatura: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataDistribuicao">Data de Distribuição</Label>
                <Input
                  id="dataDistribuicao"
                  type="date"
                  value={formData.dataDistribuicao || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dataDistribuicao: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataDesistencia">Data de Desistência</Label>
                <Input
                  id="dataDesistencia"
                  type="date"
                  value={formData.dataDesistencia || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dataDesistencia: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Digite observações sobre o contrato"
                rows={4}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
