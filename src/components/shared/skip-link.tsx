import { cn } from "@/lib/utils";

/**
 * SkipLink - Link de acessibilidade para pular navegação
 * 
 * Permite que usuários de teclado e leitores de tela pulem
 * diretamente para o conteúdo principal, ignorando a sidebar.
 * 
 * Invisível por padrão, torna-se visível ao receber foco (TAB).
 * 
 * @example
 * ```tsx
 * <SkipLink />
 * // Em outro lugar do layout, adicione:
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        // Sr-only: oculto visualmente mas acessível para leitores de tela
        "sr-only",
        // Focus: torna-se visível quando focado
        "focus:not-sr-only",
        // Posicionamento fixo no topo esquerdo
        "focus:fixed focus:top-4 focus:left-4 focus:z-9999",
        // Estilo de alto contraste
        "focus:inline-block focus:px-4 focus:py-2",
        "focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg",
        // Transição suave
        "focus:transition-all focus:duration-200",
        // Estilo do texto
        "focus:text-sm focus:font-medium",
        // Outline para acessibilidade
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      aria-label="Pular para o conteúdo principal"
    >
      Pular para o conteúdo principal
    </a>
  );
}
