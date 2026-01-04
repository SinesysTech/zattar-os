'use client';

/**
 * Componente para agrupar widgets por domínio funcional no dashboard admin
 *
 * Exibe título, ícone opcional, descrição opcional e grid responsivo de widgets filhos.
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface DomainSectionProps {
  /** Título da seção */
  title: string;
  /** Descrição opcional da seção */
  description?: string;
  /** Ícone opcional (Lucide) */
  icon?: LucideIcon;
  /** Widgets filhos */
  children: ReactNode;
  /** Classes CSS adicionais */
  className?: string;
  /** Número de colunas no grid (default: 2) */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Seção de domínio para organizar widgets por área funcional
 *
 * @example
 * <DomainSection
 *   title="Processos"
 *   icon={FileText}
 *   description="Métricas e resumos de processos"
 * >
 *   <WidgetProcessosResumo />
 *   <MetricCard title="Total" value={100} />
 * </DomainSection>
 */
export function DomainSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  columns = 2,
}: DomainSectionProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header da seção */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <Typography.H4 className="text-lg font-semibold">{title}</Typography.H4>
          {description && (
            <Typography.Muted className="text-sm">{description}</Typography.Muted>
          )}
        </div>
      </div>

      <Separator />

      {/* Grid de widgets */}
      <div className={cn('grid gap-4', gridCols[columns])}>
        {children}
      </div>
    </section>
  );
}
