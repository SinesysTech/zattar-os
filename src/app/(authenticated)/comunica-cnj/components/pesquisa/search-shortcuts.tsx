'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarClock, FileText, Gavel, UserCircle2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { usePesquisaStore } from '../hooks/use-pesquisa-store';
import type { PesquisaFiltros } from '../hooks/use-pesquisa-store';

interface Shortcut {
  id: string;
  label: string;
  descricao: string;
  icon: LucideIcon;
  tone: 'primary' | 'info' | 'warning' | 'success';
  apply: (opts: { setFiltros: (f: Partial<PesquisaFiltros>) => void; setTermo: (v: string) => void }) => void;
}

const toneStyles: Record<Shortcut['tone'], { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const SHORTCUTS: Shortcut[] = [
  {
    id: 'hoje',
    label: 'Publicações de hoje',
    descricao: 'Comunicações disponibilizadas no dia',
    icon: CalendarClock,
    tone: 'primary',
    apply: ({ setFiltros }) =>
      setFiltros({ dataInicio: today(), dataFim: today() }),
  },
  {
    id: 'ultima-semana',
    label: 'Última semana',
    descricao: 'Tudo dos últimos 7 dias',
    icon: FileText,
    tone: 'info',
    apply: ({ setFiltros }) =>
      setFiltros({ dataInicio: daysAgo(7), dataFim: today() }),
  },
  {
    id: 'tst',
    label: 'Só TST',
    descricao: 'Tribunal Superior do Trabalho',
    icon: Gavel,
    tone: 'warning',
    apply: ({ setFiltros }) => setFiltros({ siglaTribunal: 'TST' }),
  },
  {
    id: 'limpar',
    label: 'Minhas buscas recentes',
    descricao: 'Em breve — histórico de consultas',
    icon: UserCircle2,
    tone: 'success',
    apply: () => undefined,
  },
];

export interface SearchShortcutsProps {
  onAfterApply?: () => void;
}

/**
 * Atalhos populares exibidos abaixo do hero (antes de qualquer busca).
 * Aplicam filtros pré-configurados e disparam a busca.
 */
export function SearchShortcuts({ onAfterApply }: SearchShortcutsProps) {
  const setFiltros = usePesquisaStore((s) => s.setFiltros);
  const setTermo = usePesquisaStore((s) => s.setTermo);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Text variant="overline" className="mb-3 block text-center text-muted-foreground/70">
        Atalhos populares
      </Text>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3 sm:grid-cols-4")}>
        {SHORTCUTS.map((s) => {
          const tone = toneStyles[s.tone];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                s.apply({ setFiltros, setTermo });
                onAfterApply?.();
              }}
              className="group text-left"
            >
              <GlassPanel className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "h-full inline-tight p-4 transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-[0_4px_24px_color-mix(in_oklch,var(--primary)_8%,transparent)]")}>
                <IconContainer
                  size="md"
                  className={`border ${tone.bg} ${tone.border} ${tone.text}`}
                >
                  <s.icon className="size-4" aria-hidden />
                </IconContainer>
                <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "mt-2 flex flex-col gap-0.5")}>
                  <Heading level="widget" className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1 text-body-sm")}>
                    {s.label}
                    <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
                  </Heading>
                  <Text variant="micro-caption">{s.descricao}</Text>
                </div>
              </GlassPanel>
            </button>
          );
        })}
      </div>
    </div>
  );
}
