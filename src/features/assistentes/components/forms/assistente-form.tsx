'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import {
  atualizarAssistenteSchema,
  Assistente
} from '../../domain';

interface AssistenteFormProps {
  initialData?: Assistente;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssistenteForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AssistenteFormProps) {
  const isEditing = !!initialData;
  // Use atualizarAssistenteSchema for both create and edit since it supports all fields as optional
  const formSchema = atualizarAssistenteSchema;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      iframe_code: initialData?.iframe_code || '',
      ativo: initialData?.ativo ?? true,
    },
  });

  const ativo = useWatch({ control, name: 'ativo' });

  const onFormSubmit = async (data: Record<string, unknown>) => {
    // Convert generic object to FormData for Server Action
    const formData = new FormData();
    if (data.nome && typeof data.nome === 'string') formData.append('nome', data.nome);
    if (data.descricao && typeof data.descricao === 'string') formData.append('descricao', data.descricao);
    if (data.iframe_code && typeof data.iframe_code === 'string') formData.append('iframe_code', data.iframe_code);
    if (data.ativo !== undefined) formData.append('ativo', String(data.ativo));

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
      {/* Nome */}
      <div className="grid gap-2">
        <Label htmlFor="nome">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nome"
          placeholder="Digite o nome do assistente"
          {...register('nome')}
          disabled={isLoading}
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome?.message as string}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="grid gap-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Digite uma descrição opcional"
          {...register('descricao')}
          disabled={isLoading}
          rows={3}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao?.message as string}</p>
        )}
      </div>

      {/* Código do Iframe */}
      <div className="grid gap-2">
        <Label htmlFor="iframe_code">
          Código do Iframe <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="iframe_code"
          placeholder={`<iframe src="https://example.com/assistant" ...></iframe>`}
          {...register('iframe_code')}
          disabled={isLoading}
          rows={5}
        />
        {errors.iframe_code && (
          <p className="text-sm text-destructive">{errors.iframe_code?.message as string}</p>
        )}
      </div>

      {/* Status - apenas edição */}
      {isEditing && (
        <div className="grid gap-2">
          <Label htmlFor="ativo">Status</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={Boolean(ativo)}
              onCheckedChange={(checked) => setValue('ativo', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="ativo" className="cursor-pointer font-normal">
              Ativo
            </Label>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar' : 'Criar Assistente'}
        </Button>
      </div>
    </form>
  );
}
