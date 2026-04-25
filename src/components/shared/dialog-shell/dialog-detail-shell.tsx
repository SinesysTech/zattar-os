"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * DialogDetailShell — shell canônico para dialogs de **detalhe/visualização**.
 *
 * Irmão do `DialogFormShell`: cobre o caso em que o dialog não é um formulário
 * de cadastro (várias linhas de input + footer com Salvar/Cancelar) e sim uma
 * **capa de entidade** com seções de leitura e inline-edits pontuais — ex:
 * audiências, processos, contratos (detalhe).
 *
 * Estrutura visual:
 *
 *   ┌─────────────────────────────────────┐
 *   │  header (capa) — title + meta + X   │
 *   ├─────────────────────────────────────┤
 *   │                                     │
 *   │  body (scrollável)                  │
 *   │  children — hero, sections, edits   │
 *   │                                     │
 *   ├─────────────────────────────────────┤
 *   │  footer (opcional)                  │
 *   └─────────────────────────────────────┘
 *
 * Com split aberto (md+), vira horizontal:
 *
 *   ┌──────────────┬──────────────────────┐
 *   │  principal   │  painel sidecar      │
 *   │  (acima)     │  (split.content)     │
 *   │              │  — ex: PDF, linha do │
 *   │              │    tempo, preview    │
 *   └──────────────┴──────────────────────┘
 *
 * Integração com o eixo de densidade (ver globals.css §"DENSITY AXIS"):
 * emite `data-density` no `DialogContent` e marca cada filho com
 * `data-slot="dialog-header|body|footer"` — os overrides CSS já instalados
 * adaptam padding automaticamente quando `density="compact"`.
 */
interface DialogDetailShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * Título da capa (DialogTitle — a11y + visual).
   * Aceita nó complexo: "X × Y", com separadores, etc.
   */
  title: React.ReactNode;

  /**
   * Acessório à direita do título — tipicamente um `StatusBadge`.
   * Fica entre o título e o botão de fechar.
   */
  titleAccessory?: React.ReactNode;

  /**
   * Linha de metadata abaixo do título (número do processo, órgão, data
   * de autuação…). Use `Text variant="micro-caption"` + `<MetaDot>` para
   * separadores, conforme o padrão dos detail dialogs do sistema.
   */
  meta?: React.ReactNode;

  /**
   * Descrição a11y — sempre renderizada como `DialogDescription`.
   * Quando omitida, usa o título como fallback (sr-only).
   */
  description?: React.ReactNode;

  /**
   * Bloco hero fixo entre header e body (não rola com o conteúdo).
   * Use para pinar a informação central da entidade (tipo, data, ações
   * primárias) — permanece visível enquanto o usuário rola pelas seções.
   * Aceita omissão: muitos detail dialogs simples não precisam.
   */
  hero?: React.ReactNode;

  /** Conteúdo do body (scrollável). Seções, inline edits, timeline. */
  children: React.ReactNode;

  /** Rodapé opcional. Se ausente, o dialog termina no body. */
  footer?: React.ReactNode;

  /**
   * Split panel (sidecar). Quando `open=true`, o dialog cresce lateralmente
   * e renderiza `content` num `<aside>` à direita em md+, empilhado abaixo
   * em mobile. Ideal para leitura de PDF, preview, linha do tempo estendida.
   */
  split?: {
    open: boolean;
    content: React.ReactNode;
    /**
     * Classe opcional no `<aside>` para ajustar largura/altura do painel.
     * Default: `md:w-1/2 max-h-[50vh] md:max-h-none`.
     */
    className?: string;
  };

  /**
   * Largura máxima quando **fechado** (sem split). Valores mapeiam aos
   * tokens do Tailwind (`max-w-*`).
   * @default "xl"
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

  /**
   * Largura máxima quando o split está **aberto**. Normalmente ~dobro do
   * `maxWidth` fechado.
   * @default "4xl"
   */
  splitMaxWidth?: "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

  /**
   * Eixo de densidade. Detail dialogs normalmente operam em `comfortable`
   * (leitura confortável) e deixam inline-edits herdarem o mesmo tom.
   * Use `compact` em telas muito densas de entidade com muitos campos.
   * @default "comfortable"
   */
  density?: "comfortable" | "compact";

  /**
   * Oculta o botão X padrão (canto superior direito do header). Use quando
   * o dialog deve ser fechado exclusivamente via footer ou ação explícita.
   */
  hideCloseButton?: boolean;

  /** Classes adicionais no `DialogContent`. */
  className?: string;
}

const CLOSED_MAX_WIDTH_CLASSES: Record<
  NonNullable<DialogDetailShellProps["maxWidth"]>,
  string
> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-lg md:max-w-xl",
  "2xl": "sm:max-w-xl md:max-w-2xl",
  "3xl": "sm:max-w-2xl md:max-w-3xl",
  "4xl": "sm:max-w-3xl md:max-w-4xl",
};

const SPLIT_MAX_WIDTH_CLASSES: Record<
  NonNullable<DialogDetailShellProps["splitMaxWidth"]>,
  string
> = {
  xl: "sm:max-w-xl md:max-w-2xl",
  "2xl": "sm:max-w-2xl md:max-w-3xl",
  "3xl": "sm:max-w-3xl md:max-w-4xl",
  "4xl": "sm:max-w-4xl md:max-w-5xl",
  "5xl": "sm:max-w-5xl md:max-w-6xl",
  "6xl": "sm:max-w-6xl md:max-w-7xl",
  "7xl": "sm:max-w-7xl md:max-w-[90rem]",
};

export function DialogDetailShell({
  open,
  onOpenChange,
  title,
  titleAccessory,
  meta,
  description,
  hero,
  children,
  footer,
  split,
  maxWidth = "xl",
  splitMaxWidth = "4xl",
  density = "comfortable",
  hideCloseButton,
  className,
}: DialogDetailShellProps) {
  const isSplitOpen = !!split?.open;
  const widthClass = isSplitOpen
    ? SPLIT_MAX_WIDTH_CLASSES[splitMaxWidth]
    : CLOSED_MAX_WIDTH_CLASSES[maxWidth];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density={density}
        className={cn(
          "glass-dialog flex max-h-[90vh] w-[95vw] flex-col overflow-hidden p-0 gap-0",
          "[scrollbar-width:thin] transition-[max-width] duration-300 ease-out",
          isSplitOpen && "md:flex-row",
          widthClass,
          className,
        )}
      >
        {/* a11y — sempre `sr-only`. O detail shell trata `description` como
            metadata de aria-describedby, não como subtítulo visível. Subtítulo
            visual deve ir pelo slot `meta` (número do processo, órgão, etc.). */}
        <DialogDescription className="sr-only">
          {description ?? (typeof title === "string" ? title : "Detalhes")}
        </DialogDescription>

        {/* Coluna principal */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            isSplitOpen && "border-border/50 md:border-r",
          )}
        >
          <header
            data-slot="dialog-header"
            className="shrink-0 border-b border-border/40 px-5 pt-4 pb-3"
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <DialogTitle className="min-w-0 flex-1 truncate -tracking-[0.01em] text-foreground">
                {title}
              </DialogTitle>
              {titleAccessory && (
                <div className="shrink-0">{titleAccessory}</div>
              )}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Fechar"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {meta && <div>{meta}</div>}
          </header>

          {hero && (
            <div data-slot="dialog-hero" className="shrink-0">
              {hero}
            </div>
          )}

          <div
            data-slot="dialog-body"
            className="flex-1 overflow-y-auto px-5 py-3.5 [scrollbar-width:thin]"
          >
            {children}
          </div>

          {footer && (
            <footer
              data-slot="dialog-footer"
              className="flex shrink-0 items-center justify-end border-t border-border/40 bg-card/40 px-5 py-2.5"
            >
              {footer}
            </footer>
          )}
        </div>

        {/* Painel split (sidecar) */}
        {isSplitOpen && split && (
          <aside
            className={cn(
              "w-full shrink-0 flex flex-col overflow-hidden bg-muted/30",
              "border-t border-border/50 md:border-t-0",
              "max-h-[50vh] md:max-h-none md:w-1/2",
              split.className,
            )}
          >
            {split.content}
          </aside>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { DialogDetailShellProps };
