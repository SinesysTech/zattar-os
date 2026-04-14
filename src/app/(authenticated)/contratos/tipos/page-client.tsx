'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useContratoTipos } from '@/app/(authenticated)/contratos/tipos-config/hooks';
import type { ContratoTipo } from '@/app/(authenticated)/contratos/tipos-config';

// =============================================================================
// SCHEMA
// =============================================================================

const formSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Slug deve conter apenas letras minúsculas, números e underscores'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .optional(),
  ordem: z.coerce
    .number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem deve ser maior ou igual a 0'),
});

type FormValues = z.infer<typeof formSchema>;

// =============================================================================
// HELPER: gera slug a partir do nome
// =============================================================================

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

// =============================================================================
// DIALOG DE CRIAÇÃO / EDIÇÃO
// =============================================================================

interface TipoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: ContratoTipo | null;
  onSuccess: () => void;
}

function TipoDialog({ open, onOpenChange, tipo, onSuccess }: TipoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = tipo !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      ordem: 0,
    },
  });

  // Preenche o form ao abrir para edição
  React.useEffect(() => {
    if (open) {
      if (tipo) {
        form.reset({
          nome: tipo.nome,
          slug: tipo.slug,
          descricao: tipo.descricao ?? '',
          ordem: tipo.ordem,
        });
      } else {
        form.reset({
          nome: '',
          slug: '',
          descricao: '',
          ordem: 0,
        });
      }
    }
  }, [open, tipo, form]);

  // Auto-gera slug ao digitar nome (apenas no modo criação)
  const nomeValue = form.watch('nome');
  React.useEffect(() => {
    if (!isEditing && nomeValue) {
      form.setValue('slug', generateSlug(nomeValue), { shouldValidate: false });
    }
  }, [nomeValue, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/contratos/tipos/${tipo.id}`
        : '/api/contratos/tipos';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: values.nome,
          slug: values.slug,
          descricao: values.descricao || null,
          ordem: values.ordem,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar tipo de contrato');
      }

      toast.success(isEditing ? 'Tipo atualizado com sucesso!' : 'Tipo criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Tipo de Contrato' : 'Novo Tipo de Contrato'}
      maxWidth="md"
      footer={
        <Button type="submit" form="tipo-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar alterações' : 'Criar tipo'}
        </Button>
      }
    >
      <Form {...form}>
        <form id="tipo-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Ajuizamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="ex: ajuizamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do tipo de contrato..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DialogFormShell>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TiposPageClient() {
  const { data: tipos, isLoading, error, refetch } = useContratoTipos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<ContratoTipo | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleNovo = useCallback(() => {
    setEditingTipo(null);
    setDialogOpen(true);
  }, []);

  const handleEditar = useCallback((tipo: ContratoTipo) => {
    setEditingTipo(tipo);
    setDialogOpen(true);
  }, []);

  const handleToggleAtivo = useCallback(
    async (tipo: ContratoTipo) => {
      setTogglingId(tipo.id);
      try {
        const res = await fetch(`/api/contratos/tipos/${tipo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !tipo.ativo }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao atualizar status');
        }
        toast.success(`Tipo ${tipo.ativo ? 'desativado' : 'ativado'} com sucesso!`);
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro inesperado');
      } finally {
        setTogglingId(null);
      }
    },
    [refetch]
  );

  const handleDialogSuccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const total = tipos.length;
  const ativosCount = tipos.filter((t) => t.ativo).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Tipos de Contrato</Heading>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {ativosCount} ativo{ativosCount !== 1 ? 's' : ''} &middot; {total} total
            </p>
          )}
        </div>
        <Button size="sm" className="rounded-xl" onClick={handleNovo}>
          <Plus className="size-3.5" />
          Novo Tipo
        </Button>
      </div>

      {/* Lista Glass */}
      <GlassPanel depth={1} className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">{error}</div>
        ) : tipos.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhum tipo de contrato cadastrado.
          </div>
        ) : (
          <div role="table" aria-label="Tipos de Contrato">
            <div
              role="row"
              className="grid grid-cols-[1.5fr_1fr_80px_100px_120px] gap-4 px-4 py-2.5 border-b border-border/40 text-[11px] uppercase tracking-wide font-medium text-muted-foreground/70"
            >
              <span>Nome</span>
              <span>Slug</span>
              <span>Ordem</span>
              <span>Status</span>
              <span className="text-right">Ações</span>
            </div>
            <div className="divide-y divide-border/30">
              {tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  role="row"
                  className="grid grid-cols-[1.5fr_1fr_80px_100px_120px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium truncate">{tipo.nome}</span>
                  <span className="text-xs text-muted-foreground truncate">{tipo.slug}</span>
                  <span className="text-sm text-muted-foreground">{tipo.ordem}</span>
                  <span>
                    <Badge tone="soft" variant={tipo.ativo ? 'success' : 'neutral'}>
                      {tipo.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </span>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleEditar(tipo)}
                      aria-label={`Editar ${tipo.nome}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Switch
                      checked={tipo.ativo}
                      disabled={togglingId === tipo.id}
                      onCheckedChange={() => void handleToggleAtivo(tipo)}
                      aria-label={`${tipo.ativo ? 'Desativar' : 'Ativar'} ${tipo.nome}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>

      <TipoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tipo={editingTipo}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
