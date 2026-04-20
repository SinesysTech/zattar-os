'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Database, Link2, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { actionObterMetricas } from '@/app/(authenticated)/comunica-cnj/actions/comunica-cnj-actions';
import type { GazetteMetrics } from '@/app/(authenticated)/comunica-cnj/domain';

/**
 * Tira horizontal de mini-stats sobre comunicações já capturadas.
 * Serve de ponte para a página `/comunica-cnj/capturadas` (gestão).
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

  const items: { label: string; value: number | string; icon: typeof Database; tone: string }[] = [
    {
      label: 'Capturadas',
      value: metricas?.totalCapturadas ?? '—',
      icon: Database,
      tone: 'text-primary',
    },
    {
      label: 'Vinculadas a expediente',
      value: metricas?.vinculados ?? '—',
      icon: Link2,
      tone: 'text-success',
    },
    {
      label: 'Prazos críticos',
      value: metricas?.prazosCriticos ?? '—',
      icon: AlertTriangle,
      tone: 'text-destructive',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex items-center justify-between gap-3">
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
      <GlassPanel className="mt-2 grid grid-cols-3 divide-x divide-border/30 overflow-hidden">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3">
            <div className={`flex size-8 items-center justify-center rounded-lg bg-muted/40 ${item.tone}`}>
              <item.icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <Text variant="micro-caption" className="truncate">
                {item.label}
              </Text>
              <Heading level="widget" className="tabular-nums">
                {isLoading
                  ? '—'
                  : typeof item.value === 'number'
                    ? item.value.toLocaleString('pt-BR')
                    : item.value}
              </Heading>
            </div>
          </div>
        ))}
      </GlassPanel>
    </div>
  );
}
