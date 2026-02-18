"use client";

import * as React from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DialogFormShellProps {
  /**
   * Controla se o diálogo está aberto
   */
  open: boolean;
  /**
   * Callback quando o estado de abertura muda
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Título do diálogo
   */
  title: React.ReactNode;
  /**
   * Conteúdo do formulário
   */
  children: React.ReactNode;
  /**
   * Botões de ação do rodapé
   * Deve incluir botões de ação (Salvar, Próximo, etc.)
   * O botão Cancelar é opcional, mas recomendado se não houver outra forma de fechar
   */
  footer?: React.ReactNode;
  /**
   * Configuração para formulários multi-step
   */
  multiStep?: {
    current: number;
    total: number;
    stepTitle?: string;
  };
  /**
   * Largura máxima do diálogo (apenas desktop)
   * @default "lg"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  /**
   * Classes adicionais para o container do conteúdo
   */
  className?: string;
  /**
   * Ocultar o rodapé padrão do shell (útil quando o formulário tem seu próprio rodapé)
   */
  hideFooter?: boolean;
}

export function DialogFormShell({
  open,
  onOpenChange,
  title,
  children,
  footer,
  multiStep,
  maxWidth = "lg",

  className,
  hideFooter,
}: DialogFormShellProps) {
  // Calcular largura máxima
  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
  }[maxWidth];

  // Calcular progresso para multi-step
  const progressValue = multiStep
    ? multiStep.total <= 1
      ? 100 // Se total <= 1, progresso completo (evita divisão por zero)
      : ((multiStep.current - 1) / (multiStep.total - 1)) * 100
    : 0;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        showCloseButton={false} // Removemos o botão X padrão
        className={cn(
          maxWidthClass,
          "bg-white", // Background branco explícito
          "p-0 gap-0", // Removemos padding padrão para controlar layout
          className
        )}
      >
        <ResponsiveDialogHeader className="px-6 py-4 shrink-0">
          <ResponsiveDialogTitle className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </ResponsiveDialogTitle>

          {/* Barra de progresso para multi-step */}
          {multiStep && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {multiStep.stepTitle}
                </span>
                <span>
                  Etapa {multiStep.current} de {multiStep.total}
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          )}
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="flex-1 min-h-0 bg-white">
          {children}
        </ResponsiveDialogBody>

        {!hideFooter && (
          <ResponsiveDialogFooter className="px-6 py-4 border-t shrink-0 bg-white">
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                {footer}
              </div>
            </div>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export type { DialogFormShellProps };
