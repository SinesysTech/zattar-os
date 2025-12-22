"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Estilos base para botões de navegação em dialogs multi-step
 *
 * Design:
 * - Botões circulares com fundo primary (roxo Zattar)
 * - Ícone branco (primary-foreground)
 * - No hover: fundo levemente escurecido, ícone permanece branco com traço mais grosso
 */
const navButtonStyles = cn(
  "rounded-full",
  "bg-primary text-primary-foreground",
  "hover:bg-primary/90 hover:text-primary-foreground",
  "[&_svg]:transition-all [&_svg]:duration-200",
  "[&_svg]:hover:stroke-[2.5]"
);

interface DialogNavButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * Se true, o botão será ocultado (usado quando está no primeiro step)
   */
  hidden?: boolean;
}

/**
 * Botão de navegação "Anterior" para dialogs multi-step
 *
 * @example
 * ```tsx
 * <DialogNavPrevious
 *   onClick={handlePrevious}
 *   disabled={isFirstStep || isPending}
 *   hidden={isFirstStep}
 * />
 * ```
 */
export function DialogNavPrevious({
  className,
  hidden,
  ...props
}: DialogNavButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Voltar"
      className={cn(
        navButtonStyles,
        hidden && "hidden",
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );
}

/**
 * Botão de navegação "Próximo" para dialogs multi-step
 *
 * @example
 * ```tsx
 * <DialogNavNext
 *   onClick={handleNext}
 *   disabled={isPending}
 * />
 * ```
 */
export function DialogNavNext({
  className,
  ...props
}: DialogNavButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Continuar"
      className={cn(navButtonStyles, className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

export type { DialogNavButtonProps };
