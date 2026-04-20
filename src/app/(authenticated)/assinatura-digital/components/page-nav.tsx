'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSignature, LayoutTemplate, ClipboardList, Tags } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Prefixo de rota que marca a tab como ativa (inclusivo) */
  match: string;
}

const TABS: readonly TabItem[] = [
  {
    href: '/app/assinatura-digital/documentos/lista',
    label: 'Documentos',
    icon: FileSignature,
    match: '/app/assinatura-digital/documentos',
  },
  {
    href: '/app/assinatura-digital/templates',
    label: 'Templates',
    icon: LayoutTemplate,
    match: '/app/assinatura-digital/templates',
  },
  {
    href: '/app/assinatura-digital/formularios',
    label: 'Formulários',
    icon: ClipboardList,
    match: '/app/assinatura-digital/formularios',
  },
  {
    href: '/app/assinatura-digital/segmentos',
    label: 'Segmentos',
    icon: Tags,
    match: '/app/assinatura-digital/segmentos',
  },
] as const;

interface AssinaturaDigitalPageNavProps {
  /** Ação primária contextual da aba ativa (ex.: botão "Novo documento"). */
  action?: React.ReactNode;
}

/**
 * Header unificado do módulo Assinatura Digital.
 * - Título de módulo ("Assinatura Digital") à esquerda
 * - Ação primária à direita (slot `action`, varia por aba ativa)
 * - Sub-navegação por aba abaixo, com estilo alinhado ao TabPills do DS
 */
export function AssinaturaDigitalPageNav({ action }: AssinaturaDigitalPageNavProps) {
  const pathname = usePathname() ?? '';

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <Heading level="page">Assinatura Digital</Heading>
        {action}
      </div>

      <nav
        aria-label="Navegação do módulo Assinatura Digital"
        className="flex gap-1 p-1 rounded-xl bg-border/6 overflow-x-auto w-fit"
      >
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = pathname.startsWith(match);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200',
                active
                  ? 'bg-primary/12 text-primary shadow-sm'
                  : 'text-muted-foreground/55 hover:text-muted-foreground hover:bg-white/4',
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
