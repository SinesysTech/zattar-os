"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface FormStepLayoutProps {
  /** Titulo do step */
  title: string;
  /** Descricao do step */
  description?: string;
  /** Step atual (1-based) */
  currentStep: number;
  /** Total de steps */
  totalSteps: number;
  /** Callback ao clicar em voltar */
  onPrevious?: () => void;
  /** Callback ao clicar em continuar */
  onNext?: () => void;
  /** Label do botao de avancar */
  nextLabel?: string;
  /** Label do botao de voltar */
  previousLabel?: string;
  /** Desabilitar botao de avancar */
  isNextDisabled?: boolean;
  /** Desabilitar botao de voltar */
  isPreviousDisabled?: boolean;
  /** Estado de loading */
  isLoading?: boolean;
  /** Classe CSS adicional para o Card */
  cardClassName?: string;
  /** Conteudo do step */
  children: ReactNode;
  /** Esconder botao de voltar */
  hidePrevious?: boolean;
  /** Esconder botao de avancar */
  hideNext?: boolean;
  /** ID do formulário HTML para submit via botão externo */
  formId?: string;
}

export default function FormStepLayout({
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
  cardClassName,
  children,
  hidePrevious = false,
  hideNext = false,
  formId,
}: FormStepLayoutProps) {
  const isFirstStep = currentStep === 1;
  const nextButtonType = formId ? 'submit' : 'button';
  const nextButtonForm = formId ?? undefined;
  const handleNextClick = formId ? undefined : onNext;

  return (
    <Card className={cn("w-full", cardClassName)}>
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {currentStep} de {totalSteps}
          </span>
        </div>
        {description && <CardDescription>{description}</CardDescription>}

        {/* Progress bar */}
        {/* eslint-disable-next-line react/forbid-dom-props */}
        <div 
          className="w-full bg-muted rounded-full h-2 mt-4"
          // Inline style required: dynamic progress value calculated at runtime
          style={{ '--progress-width': `${(currentStep / totalSteps) * 100}%` } as React.CSSProperties}
        >
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            // Inline style required: uses CSS custom property for dynamic width
            style={{ width: 'var(--progress-width)' }}
          />
        </div>
      </CardHeader>

      <CardContent>{children}</CardContent>

      <CardFooter className="flex justify-between gap-4">
        {!hidePrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isPreviousDisabled || isLoading || isFirstStep}
            className={cn(isFirstStep && "invisible")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {previousLabel}
          </Button>
        )}

        {hidePrevious && <div />}

        {!hideNext && (
          <Button
            type={nextButtonType}
            form={nextButtonForm}
            onClick={handleNextClick}
            disabled={isNextDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
