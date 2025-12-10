'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/app/_lib/utils/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  href?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: {
    icon: 'text-primary bg-primary/10',
    trend: {
      up: 'text-emerald-600',
      down: 'text-red-600',
      neutral: 'text-muted-foreground',
    },
  },
  success: {
    icon: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    trend: {
      up: 'text-emerald-600',
      down: 'text-red-600',
      neutral: 'text-muted-foreground',
    },
  },
  warning: {
    icon: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    trend: {
      up: 'text-amber-600',
      down: 'text-emerald-600',
      neutral: 'text-muted-foreground',
    },
  },
  danger: {
    icon: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    trend: {
      up: 'text-red-600',
      down: 'text-emerald-600',
      neutral: 'text-muted-foreground',
    },
  },
  info: {
    icon: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30',
    trend: {
      up: 'text-sky-600',
      down: 'text-red-600',
      neutral: 'text-muted-foreground',
    },
  },
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  trend = 'neutral',
  icon: Icon,
  href,
  description,
  className,
  variant = 'default',
}: StatCardProps) {
  const styles = variantStyles[variant];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const content = (
    <Card className={cn('transition-all hover:shadow-md', href && 'cursor-pointer', className)}>
      <CardContent className="pt-4 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight break-all">
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              </p>
              {change !== undefined && (
                <div className={cn('flex items-center gap-1 text-sm font-medium whitespace-nowrap', styles.trend[trend])}>
                  <TrendIcon className="h-4 w-4" />
                  <span>
                    {change > 0 ? '+' : ''}
                    {change}%
                  </span>
                </div>
              )}
            </div>
            {(changeLabel || description) && (
              <p className="text-xs text-muted-foreground line-clamp-2">{changeLabel || description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('rounded-lg p-2 sm:p-3 flex-shrink-0', styles.icon)}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// Versão compacta para uso dentro de widgets
interface MiniStatProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export function MiniStat({ label, value, icon: Icon, color, className }: MiniStatProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {Icon && (
        <div
          className="rounded-md p-2"
          style={{ backgroundColor: color ? `${color}20` : undefined }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </p>
      </div>
    </div>
  );
}
