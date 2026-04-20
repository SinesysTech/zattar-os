'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { actionObterMetricas } from '@/app/(authenticated)/comunica-cnj/actions/comunica-cnj-actions';

type SubnavKey = 'pesquisa' | 'capturadas';

interface SubnavItem {
  id: SubnavKey;
  label: string;
  href: string;
  icon: typeof Search;
}

const ITEMS: SubnavItem[] = [
  { id: 'pesquisa', label: 'Pesquisa', href: '/comunica-cnj', icon: Search },
  {
    id: 'capturadas',
    label: 'Capturadas',
    href: '/comunica-cnj/capturadas',
    icon: Inbox,
  },
];

/**
 * Navegação horizontal entre as sub-páginas do módulo Comunica CNJ.
 * Exibe contador de capturadas sincronizado com as métricas.
 */
export function ComunicaCnjSubnav({ active }: { active: SubnavKey }) {
  const [totalCapturadas, setTotalCapturadas] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await actionObterMetricas();
        if (!cancelled && res.success && res.data) {
          setTotalCapturadas(res.data.totalCapturadas);
        }
      } catch {
        // silencioso — subnav é secundário
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      aria-label="Navegação do Diário Oficial"
      className="inline-flex items-center gap-1 self-start rounded-2xl border border-border/40 bg-card/50 p-1"
    >
      {ITEMS.map((item) => {
        const isActive = active === item.id;
        const showCount = item.id === 'capturadas' && totalCapturadas !== null;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
            )}
          >
            <item.icon className="size-3.5" aria-hidden />
            {item.label}
            {showCount && (
              <span
                className={cn(
                  'tabular-nums text-[10px]',
                  isActive ? 'text-primary/70' : 'text-muted-foreground/60',
                )}
              >
                {totalCapturadas!.toLocaleString('pt-BR')}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
