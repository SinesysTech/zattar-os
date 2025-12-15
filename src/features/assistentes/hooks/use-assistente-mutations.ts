'use client';

import { useTransition } from 'react';
import {
  actionCriarAssistente,
  actionAtualizarAssistente,
  actionDeletarAssistente
} from '../actions/assistentes-actions';
import { toast } from 'sonner'; // Assuming sonner is used for toasts
import { Assistente } from '../domain';

export function useAssistenteMutations() {
  const [isLoading, startTransition] = useTransition();

  const criar = async (formData: FormData) => {
    return new Promise<{ success: boolean; data?: Assistente; error?: string }>((resolve) => {
      startTransition(async () => {
        const result = await actionCriarAssistente(formData);
        if (result.success) {
          toast.success('Assistente criado com sucesso');
          resolve(result);
        } else {
          toast.error(result.error || 'Erro ao criar assistente');
          resolve(result);
        }
      });
    });
  };

  const atualizar = async (id: number, formData: FormData) => {
    return new Promise<{ success: boolean; data?: Assistente; error?: string }>((resolve) => {
      startTransition(async () => {
        const result = await actionAtualizarAssistente(id, formData);
        if (result.success) {
          toast.success('Assistente atualizado com sucesso');
          resolve(result);
        } else {
          toast.error(result.error || 'Erro ao atualizar assistente');
          resolve(result);
        }
      });
    });
  };

  const deletar = async (id: number) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        const result = await actionDeletarAssistente(id);
        if (result.success) {
          toast.success('Assistente removido com sucesso');
          resolve(result);
        } else {
          toast.error(result.error || 'Erro ao remover assistente');
          resolve(result);
        }
      });
    });
  };

  return {
    criar,
    atualizar,
    deletar,
    isLoading,
  };
}
