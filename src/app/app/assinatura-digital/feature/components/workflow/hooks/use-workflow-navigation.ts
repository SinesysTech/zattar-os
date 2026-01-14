'use client';

/**
 * Hook para navegação do workflow de assinatura digital
 *
 * Conecta ao formulario-store e calcula o status de cada etapa.
 */

import { useMemo, useCallback } from 'react';
import { useFormularioStore } from '../../../store/formulario-store';
import { STEP_IDS } from '../../../constants/step-config';
import type { WorkflowStep, WorkflowNavigationState } from '../types';

/**
 * Mapeamento de IDs de etapas para labels amigáveis
 */
const STEP_LABELS: Record<string, string> = {
  [STEP_IDS.CPF]: 'CPF',
  [STEP_IDS.DADOS_PESSOAIS]: 'Dados Pessoais',
  [STEP_IDS.DADOS_ACAO]: 'Dados da Ação',
  [STEP_IDS.TERMOS_ACEITE]: 'Termos',
  [STEP_IDS.FOTO]: 'Foto',
  [STEP_IDS.VISUALIZACAO]: 'Visualização',
  [STEP_IDS.ASSINATURA]: 'Assinatura',
  [STEP_IDS.SUCESSO]: 'Concluído',
};

/**
 * Hook que gerencia a navegação do workflow de assinatura
 *
 * @returns Estado da navegação com steps, métodos de navegação e progresso
 *
 * @example
 * ```tsx
 * const { steps, currentStep, goToStep, progressPercentage } = useWorkflowNavigation();
 * ```
 */
export function useWorkflowNavigation(): WorkflowNavigationState {
  const {
    etapaAtual,
    stepConfigs,
    getTotalSteps,
    setEtapaAtual,
    proximaEtapa,
    etapaAnterior,
  } = useFormularioStore();

  const totalSteps = getTotalSteps();

  // Calcula o status de cada step baseado na etapa atual
  const steps = useMemo<WorkflowStep[]>(() => {
    if (!stepConfigs || stepConfigs.length === 0) {
      // Fallback para steps padrão se stepConfigs não estiver definido
      return Object.entries(STEP_IDS).map(([, id], index) => ({
        id,
        index,
        label: STEP_LABELS[id] || id,
        status:
          index < etapaAtual
            ? 'completed'
            : index === etapaAtual
              ? 'current'
              : 'pending',
      }));
    }

    return stepConfigs
      .filter((config) => config.enabled)
      .map((config) => ({
        id: config.id,
        index: config.index,
        label: STEP_LABELS[config.id] || config.id,
        status:
          config.index < etapaAtual
            ? 'completed'
            : config.index === etapaAtual
              ? 'current'
              : 'pending',
      }));
  }, [stepConfigs, etapaAtual]);

  // Calcula a porcentagem de progresso
  const progressPercentage = useMemo(() => {
    if (totalSteps <= 1) return 100;
    return Math.round((etapaAtual / (totalSteps - 1)) * 100);
  }, [etapaAtual, totalSteps]);

  // Navega para um step específico (apenas se for anterior ao atual)
  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < etapaAtual) {
        setEtapaAtual(index);
      }
    },
    [etapaAtual, setEtapaAtual]
  );

  return {
    steps,
    currentStep: etapaAtual,
    totalSteps,
    canGoBack: etapaAtual > 0,
    canGoForward: etapaAtual < totalSteps - 1,
    goToStep,
    nextStep: proximaEtapa,
    previousStep: etapaAnterior,
    progressPercentage,
  };
}
