/**
 * Hook para gerenciar lembretes (reminders) do dashboard
 */

'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import type { Lembrete, CriarLembreteInput, AtualizarLembreteInput } from '../domain';
import {
  actionListarLembretes,
  actionCriarLembrete,
  actionAtualizarLembrete,
  actionMarcarLembreteConcluido,
  actionDeletarLembrete,
} from '../actions';

export interface UseRemindersProps {
  lembretes?: Lembrete[];
  concluido?: boolean;
  limite?: number;
}

export interface UseRemindersReturn {
  lembretes: Lembrete[];
  isPending: boolean;
  criar: (input: CriarLembreteInput) => Promise<boolean>;
  atualizar: (input: AtualizarLembreteInput) => Promise<boolean>;
  marcarConcluido: (id: number, concluido: boolean) => Promise<boolean>;
  deletar: (id: number) => Promise<boolean>;
  recarregar: () => Promise<void>;
}

/**
 * Hook para gerenciar lembretes do dashboard
 * Usa optimistic updates para melhor UX
 */
export function useReminders({
  lembretes: initialReminders = [],
  concluido,
  limite = 10,
}: UseRemindersProps = {}): UseRemindersReturn {
  const [isPending, startTransition] = useTransition();
  const [optimisticReminders, setOptimisticReminders] = useOptimistic<Lembrete[]>(
    initialReminders
  );

  /**
   * Recarrega a lista de lembretes do servidor
   */
  const recarregar = useCallback(async () => {
    try {
      const result = await actionListarLembretes({ concluido, limite });

      if (!result.success) {
        toast.error(result.message || 'Erro ao carregar lembretes');
        return;
      }

      // A página será revalidada automaticamente
    } catch (error) {
      console.error('Erro ao recarregar lembretes:', error);
      toast.error('Erro ao carregar lembretes');
    }
  }, [concluido, limite]);

  /**
   * Cria um novo lembrete
   */
  const criar = useCallback(
    async (input: CriarLembreteInput): Promise<boolean> => {
      try {
        // Optimistic update: adiciona o novo lembrete imediatamente
        startTransition(() => {
          setOptimisticReminders((prev) => [
            ...prev,
            {
              id: Date.now(), // ID temporário
              usuario_id: 0,
              texto: input.texto,
              prioridade: input.prioridade,
              categoria: input.categoria,
              data_lembrete: input.data_lembrete,
              concluido: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
        });

        const result = await actionCriarLembrete(input);

        if (result.success) {
          toast.success(result.message || 'Lembrete criado com sucesso');
          return true;
        }

        toast.error(result.message || 'Erro ao criar lembrete');
        return false;
      } catch (error) {
        console.error('Erro ao criar lembrete:', error);
        toast.error('Erro ao criar lembrete');
        return false;
      }
    },
    []
  );

  /**
   * Atualiza um lembrete existente
   */
  const atualizar = useCallback(
    async (input: AtualizarLembreteInput): Promise<boolean> => {
      try {
        // Optimistic update: atualiza o lembrete imediatamente
        startTransition(() => {
          setOptimisticReminders((prev) =>
            prev.map((lembrete) =>
              lembrete.id === input.id
                ? {
                    ...lembrete,
                    ...(input.texto && { texto: input.texto }),
                    ...(input.prioridade && { prioridade: input.prioridade }),
                    ...(input.categoria && { categoria: input.categoria }),
                    ...(input.data_lembrete && { data_lembrete: input.data_lembrete }),
                    ...(input.concluido !== undefined && { concluido: input.concluido }),
                    updated_at: new Date().toISOString(),
                  }
                : lembrete
            )
          );
        });

        const result = await actionAtualizarLembrete(input);

        if (result.success) {
          toast.success(result.message || 'Lembrete atualizado com sucesso');
          return true;
        }

        toast.error(result.message || 'Erro ao atualizar lembrete');
        return false;
      } catch (error) {
        console.error('Erro ao atualizar lembrete:', error);
        toast.error('Erro ao atualizar lembrete');
        return false;
      }
    },
    []
  );

  /**
   * Marca um lembrete como concluído ou não concluído
   */
  const marcarConcluido = useCallback(
    async (id: number, concluido: boolean): Promise<boolean> => {
      try {
        // Optimistic update: marca como concluído imediatamente
        startTransition(() => {
          setOptimisticReminders((prev) =>
            prev.map((lembrete) =>
              lembrete.id === id
                ? { ...lembrete, concluido, updated_at: new Date().toISOString() }
                : lembrete
            )
          );
        });

        const result = await actionMarcarLembreteConcluido({ id, concluido });

        if (result.success) {
          toast.success(result.message || 'Status atualizado');
          return true;
        }

        toast.error(result.message || 'Erro ao atualizar status');
        return false;
      } catch (error) {
        console.error('Erro ao marcar lembrete:', error);
        toast.error('Erro ao atualizar status');
        return false;
      }
    },
    []
  );

  /**
   * Deleta um lembrete
   */
  const deletar = useCallback(async (id: number): Promise<boolean> => {
    try {
      // Optimistic update: remove o lembrete imediatamente
      startTransition(() => {
        setOptimisticReminders((prev) =>
          prev.filter((lembrete) => lembrete.id !== id)
        );
      });

      const result = await actionDeletarLembrete({ id });

      if (result.success) {
        toast.success(result.message || 'Lembrete deletado');
        return true;
      }

      toast.error(result.message || 'Erro ao deletar lembrete');
      return false;
    } catch (error) {
      console.error('Erro ao deletar lembrete:', error);
      toast.error('Erro ao deletar lembrete');
      return false;
    }
  }, []);

  return {
    lembretes: optimisticReminders,
    isPending,
    criar,
    atualizar,
    marcarConcluido,
    deletar,
    recarregar,
  };
}
