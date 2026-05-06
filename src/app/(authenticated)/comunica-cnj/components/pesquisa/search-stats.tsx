'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Database, Link2, AlertTriangle, type LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { actionObterMetricas } from '@/app/(authenticated)/comunica-cnj/actions/comunica-cnj-actions';
import type { GazetteMetrics } from '@/app/(authenticated)/comunica-cnj/domain';

interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

/**
 * Tira horizontal de mini-stats sobre comunicações já capturadas.
 * Padrão PulseStrip (3 GlassPanel em grid-cols-3), diferenciado por tons
 * semânticos (primary/success/destructive).
 */
export function SearchStats() {
  const [metricas, setMetricas] = useState<GazetteMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await actionObterMetricas();
        if (!cancelled && res.success && res.data) setMetricas(res.data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items: StatItem[] = [
    {
      label: 'Capturadas',
      value: metricas?.totalCapturadas ?? '—',
      icon: Database,
      iconBg: 'bg-primary/8',
      iconColor: 'text-primary/70',
    },
    {
      label: 'Vinculadas a expediente',
      value: metricas?.vinculados ?? '—',
      icon: Link2,
      iconBg: 'bg-success/8',
      iconColor: 'text-success/70',
    },
    {
      label: 'Prazos críticos',
      value: metricas?.prazosCriticos ?? '—',
      icon: AlertTriangle,
      iconBg: 'bg-destructive/8',
      iconColor: 'text-destructive/50',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className={cn("flex items-center justify-between inline-medium mb-2")}>
        <Text variant="overline" className="text-muted-foreground/70">
          Sua base capturada
        </Text>
        <Link
          href="/comunica-cnj/capturadas"
          className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "inline-flex items-center inline-micro text-caption font-medium text-primary hover:underline")}
        >
          Ver gestão completa
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      <div className={cn("grid grid-cols-3 inline-medium")}>
        {items.map((item) => (
          <GlassPanel key={item.label} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
            <div className={cn("flex items-start justify-between inline-tight")}>
              <div className="min-w-0">
                <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate")}>
                  {item.label}
                </p>
                <Heading level="widget" className="tabular-nums mt-1">
                  {isLoading
                    ? '—'
                    : typeof item.value === 'number'
                      ? item.value.toLocaleString('pt-BR')
                      : item.value}
                </Heading>
              </div>
              <IconContainer size="md" className={item.iconBg}>
                <item.icon className={`size-4 ${item.iconColor}`} />
              </IconContainer>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
