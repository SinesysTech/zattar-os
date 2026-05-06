'use client';

import {
  cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import type { Signatario } from '../types';
import { Text } from '@/components/ui/typography';

const signerSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

type SignerFormData = z.infer<typeof signerSchema>;

interface SignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signer?: Signatario;
  onSave: (nome: string, email: string) => void;
  mode: 'add' | 'edit';
}

/**
 * SignerDialog - Dialog for adding or editing a signer
 */
export default function SignerDialog({
  open,
  onOpenChange,
  signer,
  onSave,
  mode,
}: SignerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignerFormData>({
    resolver: zodResolver(signerSchema),
    defaultValues: {
      nome: signer?.nome || '',
      email: signer?.email || '',
    },
  });

  // Reset form when dialog opens or signer changes
  useEffect(() => {
    if (open) {
      reset({
        nome: signer?.nome || '',
        email: signer?.email || '',
      });
    }
  }, [open, signer, reset]);

  const onSubmit = (data: SignerFormData) => {
    onSave(data.nome, data.email);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-sm  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>{mode === 'add' ? 'Adicionar Signatário' : 'Editar Signatário'}</DialogTitle>
          <DialogDescription className="sr-only">
            {mode === 'add' ? 'Preencha os dados do novo signatário.' : 'Edite os dados do signatário.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <form id="signer-form" onSubmit={handleSubmit(onSubmit)} className={cn("flex flex-col inset-dialog stack-default")}>
            <div className={cn("flex flex-col stack-tight")}>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                autoFocus
                {...register('nome')}
                aria-invalid={!!errors.nome}
              />
              {errors.nome && (
                <Text variant="caption" className="text-destructive">{errors.nome.message}</Text>
              )}
            </div>

            <div className={cn("flex flex-col stack-tight")}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <Text variant="caption" className="text-destructive">{errors.email.message}</Text>
              )}
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button type="submit" form="signer-form" disabled={isSubmitting}>
              {mode === 'add' ? 'Adicionar' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
