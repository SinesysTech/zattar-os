"use client";

import * as React from "react";
import { CheckCircle2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui/typography";

export type DialogSectionStepState = "pending" | "active" | "complete";

export interface DialogSectionProps {
  /**
   * Título semântico da seção (renderizado como Heading subsection — 16px).
   * Pode ser omitido quando a seção é apenas um agrupamento visual.
   */
  title?: React.ReactNode;
  /**
   * Descrição opcional abaixo do título (caption — 13px).
   */
  description?: React.ReactNode;
  /**
   * Ícone Lucide à esquerda do título. Ignorado quando `step` está presente.
   */
  icon?: LucideIcon;
  /**
   * Número da etapa em um wizard (1, 2, 3…). Quando presente, renderiza
   * badge circular no lugar do ícone.
   */
  step?: number;
  /**
   * Estado visual da etapa no wizard.
   * @default "pending"
   */
  stepState?: DialogSectionStepState;
  /**
   * Peso visual do container.
   * - `default`: border + background sutil (padrão — uma única camada).
   * - `quiet`: sem border/background, apenas estrutura de espaçamento.
   * @default "default"
   */
  tone?: "default" | "quiet";
  /**
   * Ação à direita do header (ex: link "Limpar", botão secundário).
   */
  headerAction?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<NonNullable<DialogSectionProps["tone"]>, string> = {
  default: "rounded-xl border border-border/25 bg-muted/15 px-5 py-4",
  quiet: "px-0 py-0",
};

const STEP_BADGE_CLASSES: Record<DialogSectionStepState, string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary ring-1 ring-primary/25",
  complete: "bg-primary text-primary-foreground",
};

/**
 * DialogSection — agrupa um bloco de formulário dentro de um Dialog.
 *
 * Substitui o padrão antigo de aninhar `<GlassPanel depth={2}>` dentro de
 * um dialog (que gerava "card dentro de card"). Mantém uma única camada
 * visual discreta e aplica hierarquia tipográfica semântica.
 */
export function DialogSection({
  title,
  description,
  icon: Icon,
  step,
  stepState = "pending",
  tone = "default",
  headerAction,
  className,
  children,
}: DialogSectionProps) {
  const hasHeader =
    !!title || !!description || !!Icon || typeof step === "number";

  return (
    <section
      data-slot="dialog-section"
      data-state={stepState}
      className={cn("flex flex-col gap-3", TONE_CLASSES[tone], className)}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {typeof step === "number" ? (
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  STEP_BADGE_CLASSES[stepState],
                )}
              >
                {stepState === "complete" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  step
                )}
              </span>
            ) : Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}

            <div className="min-w-0">
              {title && (
                <Heading
                  level="subsection"
                  as="h3"
                  className="text-subsection-title"
                >
                  {title}
                </Heading>
              )}
              {description && (
                <Text variant="caption" className="mt-0.5">
                  {description}
                </Text>
              )}
            </div>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </header>
      )}

      {children && <div className="flex flex-col gap-3">{children}</div>}
    </section>
  );
}
