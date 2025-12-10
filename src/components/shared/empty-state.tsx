import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Componente simplificado para estados vazios.
 * Uso rápido quando não é necessário o componente Empty modular completo.
 *
 * @example
 * <EmptyState
 *   icon={FileSearch}
 *   title="Nenhum processo encontrado"
 *   description="Tente ajustar os filtros ou realizar uma nova busca."
 *   action={<Button>Nova Busca</Button>}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        "animate-in fade-in-50 zoom-in-95 duration-300",
        className
      )}
    >
      {/* Círculo de fundo com ícone */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
        <Icon className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
      </div>

      {/* Título */}
      <h3 className="text-lg font-heading font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      {/* Descrição */}
      <p className="mt-2 text-sm text-muted-foreground max-w-sm text-balance">
        {description}
      </p>

      {/* Área de ação (opcional) */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
