'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TribunalBadgeProps {
  codigo: string;
  className?: string;
}

/**
 * Mapeia siglas de tribunal para cores
 */
const TRIBUNAL_COLORS: Record<string, string> = {
  // Tribunais Regionais do Trabalho
  TRT1: 'bg-blue-100 text-blue-800 border-blue-300',
  TRT2: 'bg-green-100 text-green-800 border-green-300',
  TRT3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  TRT4: 'bg-red-100 text-red-800 border-red-300',
  TRT5: 'bg-purple-100 text-purple-800 border-purple-300',
  TRT6: 'bg-pink-100 text-pink-800 border-pink-300',
  TRT7: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  TRT8: 'bg-teal-100 text-teal-800 border-teal-300',
  TRT9: 'bg-orange-100 text-orange-800 border-orange-300',
  TRT10: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  TRT11: 'bg-lime-100 text-lime-800 border-lime-300',
  TRT12: 'bg-amber-100 text-amber-800 border-amber-300',
  TRT13: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  TRT14: 'bg-violet-100 text-violet-800 border-violet-300',
  TRT15: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  TRT16: 'bg-rose-100 text-rose-800 border-rose-300',
  TRT17: 'bg-sky-100 text-sky-800 border-sky-300',
  TRT18: 'bg-blue-100 text-blue-800 border-blue-300',
  TRT19: 'bg-green-100 text-green-800 border-green-300',
  TRT20: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  TRT21: 'bg-red-100 text-red-800 border-red-300',
  TRT22: 'bg-purple-100 text-purple-800 border-purple-300',
  TRT23: 'bg-pink-100 text-pink-800 border-pink-300',
  TRT24: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  // TST
  TST: 'bg-slate-100 text-slate-800 border-slate-300',
  // Tribunais de Justiça
  TJSP: 'bg-blue-100 text-blue-800 border-blue-300',
  TJRJ: 'bg-green-100 text-green-800 border-green-300',
  TJMG: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  TJRS: 'bg-red-100 text-red-800 border-red-300',
  TJPR: 'bg-purple-100 text-purple-800 border-purple-300',
  // STJ e STF
  STJ: 'bg-slate-100 text-slate-800 border-slate-300',
  STF: 'bg-zinc-100 text-zinc-800 border-zinc-300',
};

/**
 * Badge para exibir siglas de tribunal com cores diferenciadas
 */
export function TribunalBadge({ codigo, className }: TribunalBadgeProps) {
  if (!codigo) {
    return null;
  }

  // Remove espaços e converte para uppercase para matching
  const codigoNormalizado = codigo.replace(/\s+/g, '').toUpperCase();
  const colorClass = TRIBUNAL_COLORS[codigoNormalizado] || 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <Badge
      variant="outline"
      className={cn('border', colorClass, className)}
    >
      {codigo}
    </Badge>
  );
}
