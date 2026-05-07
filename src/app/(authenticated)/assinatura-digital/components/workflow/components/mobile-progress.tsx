'use client';

/**
 * Versão mobile do stepper - barra de progresso simplificada
 */

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';

interface MobileProgressProps {
  /** Etapa atual (0-indexed) */
  currentStep: number;
  /** Total de etapas */
  totalSteps: number;
  /** Porcentagem de progresso calculada */
  progressPercentage: number;
  /** Label da etapa atual */
  currentStepLabel?: string;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Barra de progresso simplificada para mobile
 *
 * Exibe:
 * - Label "Etapa X de Y" ou nome da etapa atual
 * - Barra de progresso fina com animação suave
 */
export function MobileProgress({
  currentStep,
  totalSteps,
  progressPercentage,
  currentStepLabel,
  className,
}: MobileProgressProps) {
  return (
    <div className={cn('flex flex-col inline-snug animate-fade-in animate-duration-300', className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Text variant="caption" weight="medium">
          Etapa {currentStep + 1} de {totalSteps}
        </Text>
        {currentStepLabel && (
          <Text variant="caption" weight="semibold" className="text-primary">
            {currentStepLabel}
          </Text>
        )}
      </div>

      {/* Progress bar */}
      <Progress
        value={progressPercentage}
        className="h-1"
        aria-label={`Progresso: ${progressPercentage}%`}
      />
    </div>
  );
}
