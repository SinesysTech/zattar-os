/**
 * PulseStrip — Barra de estatísticas rápidas (totalizadores por categoria)
 * ============================================================================
 * Exibe cards compactos com ícone, total, delta e barra de proporção.
 *
 * USO:
 *   <PulseStrip items={[
 *     { label: 'Clientes', total: 142, delta: '+5', icon: User, color: 'text-primary' },
 *   ]} />
 * ============================================================================
 */

'use client';

import { type LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PulseItem {
  label: string;
  total: number;
  delta?: string;  // e.g. "+5"
  icon: LucideIcon;
  color: string;   // e.g. 'text-primary'
}

interface PulseStripProps {
  items: PulseItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Mapeia o prefixo de cor Tailwind (text-primary, text-warning, etc.)
 * para classes de background usadas na barra de proporção.
 */
function colorToBg(color: string): string {
  const base = color.replace('text-', '');
  return `bg-${base}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PulseStrip({ items }: PulseStripProps) {
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const pct = grandTotal > 0 ? Math.round((item.total / grandTotal) * 100) : 0;

        return (
          <GlassPanel key={item.label} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate">
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className="font-display text-xl font-bold tabular-nums leading-none">
                    {item.total.toLocaleString('pt-BR')}
                  </p>
                  {item.delta && (
                    <span className="text-[10px] font-medium text-success/70">{item.delta}</span>
                  )}
                </div>
              </div>
              <div className={`size-8 rounded-lg ${colorToBg(item.color)}/8 flex items-center justify-center shrink-0`}>
                <item.icon className={`size-4 ${item.color}/50`} />
              </div>
            </div>
            {/* Barra de proporção */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorToBg(item.color)}/25 transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
                {pct}%
              </span>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
