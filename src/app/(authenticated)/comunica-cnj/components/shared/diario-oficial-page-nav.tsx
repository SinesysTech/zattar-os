'use client';

import * as React from 'react';
import Link from 'next/link';
import { Inbox, Search } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type SubnavKey = 'pesquisa' | 'capturadas';

interface TabItem {
  id: SubnavKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: readonly TabItem[] = [
  { id: 'pesquisa', label: 'Pesquisa', href: '/comunica-cnj', icon: Search },
  { id: 'capturadas', label: 'Capturadas', href: '/comunica-cnj/capturadas', icon: Inbox },
] as const;

interface DiarioOficialPageNavProps {
  active: SubnavKey;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DiarioOficialPageNav({
  active,
  subtitle,
  action,
}: DiarioOficialPageNavProps) {
  return (
    <div className={cn("stack-medium")}>
      <div className={cn("flex items-end justify-between inline-default")}>
        <div>
          <Heading level="page">Diário Oficial</Heading>
          {subtitle && (
            <p className={cn("text-body-sm text-muted-foreground/50 mt-0.5")}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>

      <nav
        aria-label="Navegação do Diário Oficial"
        className={cn(
          /* design-system-escape: p-1 → usar <Inset> */ 'inline-flex items-center inline-micro rounded-2xl border border-border/40 bg-card/60 p-1',
          'backdrop-blur-xl',
        )}
      >
        {TABS.map(({ id, href, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                /* design-system-escape: gap-1.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'flex items-center inline-snug rounded-xl px-3 py-1.5 text-caption font-medium transition-colors',
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
