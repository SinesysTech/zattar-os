"use client";

import * as React from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export interface PublicStepLayoutProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  hideProgress?: boolean;
}

export function PublicStepLayout({
  title,
  description,
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  nextLabel = "Continuar",
  previousLabel = "Voltar",
  isNextDisabled = false,
  isPreviousDisabled = false,
  isLoading = false,
  children,
  hideProgress = false,
}: PublicStepLayoutProps) {
  // Safe calculation: handle totalSteps <= 0 and clamp to 0-100
  const safeTotal = totalSteps > 0 ? totalSteps : 1;
  const safeCurrent = Math.max(0, Math.min(currentStep, safeTotal));
  const progressPercentage = Math.min(100, Math.max(0, (safeCurrent / safeTotal) * 100));

  return (
    <Card className="w-full rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b28]">
      <CardHeader className="space-y-4 pb-4">
        {/* Progress Bar */}
        {!hideProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Passo {safeCurrent} de {safeTotal}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div
              className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={safeCurrent}
              aria-valuemin={0}
              aria-valuemax={safeTotal}
              aria-label={`Passo ${safeCurrent} de ${safeTotal}`}
            >
              <div
                className="h-full bg-[#135bec] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Title and Description */}
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-6">{children}</CardContent>

      <CardFooter className="flex justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Previous Button */}
        {onPrevious ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading}
            className="flex items-center gap-2 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {previousLabel}
          </Button>
        ) : (
          <div />
        )}

        {/* Next Button */}
        {onNext && (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className="flex items-center gap-2 rounded-lg bg-[#135bec] hover:bg-[#114dc8] text-white shadow-md shadow-[#135bec]/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Carregando...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
