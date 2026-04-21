'use client';

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
      iconColor: 'text-primary/50',
    },
    {
      label: 'Vinculadas a expediente',
      value: metricas?.vinculados ?? '—',
      icon: Link2,
      iconBg: 'bg-success/8',
      iconColor: 'text-success/50',
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
      <div className="flex items-center justify-between gap-3 mb-2">
        <Text variant="overline" className="text-muted-foreground/70">
          Sua base capturada
        </Text>
        <Link
          href="/comunica-cnj/capturadas"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver gestão completa
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <GlassPanel key={item.label} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate">
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
