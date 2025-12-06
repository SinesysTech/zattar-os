'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsuarios } from '@/app/_lib/hooks/use-usuarios';
import { useCargos } from '@/app/_lib/hooks/use-cargos';
import { criarSalario, atualizarSalario } from '@/app/_lib/hooks/use-salarios';
import type { SalarioComDetalhes, CriarSalarioDTO } from '@/backend/types/financeiro/salarios.types';
import { toast } from 'sonner';

const schema = z.object({
  usuarioId: z.coerce.number().positive('Selecione um funcionário'),
  cargoId: z.coerce.number().positive().nullable().optional(),
  salarioBruto: z.coerce.number().positive('Salário deve ser maior que zero'),
  dataInicioVigencia: z.string().min(8, 'Informe a data de início da vigência'),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SalarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salario: SalarioComDetalhes | null;
  onSuccess?: () => void;
}

export function SalarioFormDialog({
  open,
  onOpenChange,
  salario,
  onSuccess,
}: SalarioFormDialogProps) {
  const { usuarios } = useUsuarios({ limite: 200, apenasAtivos: true });
  const { cargos } = useCargos({ ativos: true });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      usuarioId: salario?.usuarioId ?? undefined,
      cargoId: salario?.cargoId ?? undefined,
      salarioBruto: salario?.salarioBruto ?? undefined,
      dataInicioVigencia: salario?.dataInicioVigencia ?? '',
      observacoes: salario?.observacoes ?? '',
    },
    values: {
      usuarioId: salario?.usuarioId ?? form.getValues().usuarioId,
      cargoId: salario?.cargoId ?? form.getValues().cargoId,
      salarioBruto: salario?.salarioBruto ?? form.getValues().salarioBruto,
      dataInicioVigencia: salario?.dataInicioVigencia ?? form.getValues().dataInicioVigencia,
      observacoes: salario?.observacoes ?? form.getValues().observacoes,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: CriarSalarioDTO = {
      usuarioId: values.usuarioId,
      cargoId: values.cargoId ?? undefined,
      salarioBruto: values.salarioBruto,
      dataInicioVigencia: values.dataInicioVigencia,
      observacoes: values.observacoes,
    };

    const result = salario
      ? await atualizarSalario(salario.id, payload)
      : await criarSalario(payload);

    if (!result.success) {
      toast.error(result.error || 'Erro ao salvar salário');
      return;
    }

    toast.success(salario ? 'Salário atualizado' : 'Salário criado');
    onOpenChange(false);
    form.reset();
    onSuccess?.();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{salario ? 'Editar Salário' : 'Novo Salário'}</DialogTitle>
          <DialogDescription>Preencha os dados do salário do funcionário.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select
              value={form.watch('usuarioId')?.toString() ?? ''}
              onValueChange={(value) => form.setValue('usuarioId', Number(value))}
              disabled={!!salario}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id.toString()}>
                    {usuario.nome_exibicao || usuario.nome_completo || usuario.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.usuarioId && (
              <p className="text-sm text-destructive">{form.formState.errors.usuarioId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cargo</Label>
            <Select
              value={form.watch('cargoId')?.toString() ?? ''}
              onValueChange={(value) =>
                form.setValue('cargoId', value ? Number(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.id.toString()}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Salário Bruto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              {...form.register('salarioBruto', { valueAsNumber: true })}
            />
            {form.formState.errors.salarioBruto && (
              <p className="text-sm text-destructive">
                {form.formState.errors.salarioBruto.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data de Início da Vigência</Label>
            <Input type="date" {...form.register('dataInicioVigencia')} />
            {form.formState.errors.dataInicioVigencia && (
              <p className="text-sm text-destructive">
                {form.formState.errors.dataInicioVigencia.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={3} {...form.register('observacoes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {salario ? 'Salvar alterações' : 'Criar salário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
