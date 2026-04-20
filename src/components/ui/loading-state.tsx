import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type LoadingSize = "sm" | "md" | "lg"

const SIZE_MAP: Record<LoadingSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

type SpinnerProps = {
  size?: LoadingSize
  className?: string
} & Omit<React.SVGProps<SVGSVGElement>, "ref">

/**
 * Spinner circular consistente para estados inline (botões, popovers, empty states).
 * Usa `text-muted-foreground/60` por padrão — cor neutra, sem tingimento temático.
 * Aceita props SVG extras (aria-label, aria-hidden, etc.) via spread.
 */
export function LoadingSpinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      aria-hidden="true"
      {...props}
      className={cn(
        SIZE_MAP[size],
        "animate-spin text-muted-foreground/60",
        className
      )}
    />
  )
}

/**
 * Bloco centralizado com spinner + mensagem opcional.
 * Ideal para conteúdo vazio aguardando dados (listas, dialogs, cards).
 */
export function LoadingState({
  label,
  size = "md",
  className,
}: {
  label?: string
  size?: LoadingSize
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 py-8",
        className
      )}
    >
      <LoadingSpinner size={size} />
      {label ? (
        <span className="text-[12px] text-muted-foreground/60">{label}</span>
      ) : (
        <span className="sr-only">Carregando</span>
      )}
    </div>
  )
}

/**
 * Fallback para <Suspense> em páginas inteiras.
 * Centralizado vertical/horizontal dentro do container pai.
 */
export function PageLoadingState({
  label = "Carregando",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[60vh] flex-col items-center justify-center gap-3",
        className
      )}
    >
      <LoadingSpinner size="lg" />
      <span className="text-[13px] text-muted-foreground/70">{label}</span>
    </div>
  )
}
