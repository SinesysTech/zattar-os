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
  title: string;
  /**
   * Descrição opcional do diálogo
   */
  description?: string;
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
}

export function DialogFormShell({
  open,
  onOpenChange,
  title,
  description: _description,
  children,
  footer,
  multiStep,
  maxWidth = "lg",
  className,
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
          "bg-white dark:bg-gray-950", // Background branco explícito
          "p-0 gap-0", // Removemos padding padrão para controlar layout
          className
        )}
      >
        <ResponsiveDialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 space-y-2">
          <ResponsiveDialogTitle className="text-xl">
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

        <ResponsiveDialogBody className="bg-white dark:bg-gray-950">
          {children}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="px-6 py-4 border-t shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex w-full items-center gap-2">
            {/* Botão Cancelar padrão à esquerda */}
            <Button
              type="button"
              variant="destructive"
              onClick={() => onOpenChange(false)}
              className="mr-auto"
            >
              Cancelar
            </Button>

            {/* Botões de ação personalizados */}
            {footer}
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
