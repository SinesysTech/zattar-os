'use client';

// Componente Sheet para criação de novo contrato

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
import type { ContratoDados } from '@/backend/contratos/services/persistence/contrato-persistence.service';

interface ContratoCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ContratoCreateSheet({
  open,
  onOpenChange,
  onSuccess,
}: ContratoCreateSheetProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [formData, setFormData] = React.useState<Partial<ContratoDados>>({
    status: 'em_contratacao',
  });

  React.useEffect(() => {
    if (!open) {
      // Resetar formulário quando fechar
      setFormData({ status: 'em_contratacao' });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios
      if (
        !formData.areaDireito ||
        !formData.tipoContrato ||
        !formData.tipoCobranca ||
        !formData.clienteId ||
        !formData.poloCliente
      ) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const response = await fetch('/api/contratos', {
        method: 'POST',
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
        err instanceof Error ? err.message : 'Erro ao criar contrato';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-6">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="pb-5">
            <SheetTitle className="text-xl font-semibold">
              Novo Contrato
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
                <Label htmlFor="areaDireito">
                  Área de Direito <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.areaDireito}
                  onValueChange={(value) =>
                    setFormData({ ...formData, areaDireito: value as ContratoDados['areaDireito'] })
                  }
                  required
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
                <Label htmlFor="tipoContrato">
                  Tipo de Contrato <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tipoContrato}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoContrato: value as ContratoDados['tipoContrato'] })
                  }
                  required
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
                <Label htmlFor="tipoCobranca">
                  Tipo de Cobrança <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.tipoCobranca}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tipoCobranca: value as ContratoDados['tipoCobranca'] })
                  }
                  required
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

            {/* Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cliente</h3>

              <div className="space-y-2">
                <Label htmlFor="clienteId">
                  ID do Cliente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clienteId"
                  type="number"
                  value={formData.clienteId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clienteId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="Digite o ID do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poloCliente">
                  Polo do Cliente <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.poloCliente}
                  onValueChange={(value) =>
                    setFormData({ ...formData, poloCliente: value as ContratoDados['poloCliente'] })
                  }
                  required
                >
                  <SelectTrigger id="poloCliente">
                    <SelectValue placeholder="Selecione o polo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autor">Autor</SelectItem>
                    <SelectItem value="re">Réu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parteContrariaId">ID da Parte Contrária (Opcional)</Label>
                <Input
                  id="parteContrariaId"
                  type="number"
                  value={formData.parteContrariaId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parteContrariaId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  placeholder="Digite o ID da parte contrária"
                />
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
              Criar Contrato
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
