'use client';

import { cn } from '@/lib/utils';
import {
  Banknote,
  Scale,
  Landmark,
  ChevronRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useMemo } from 'react';

// Tipagem mock para POC. Em prod usaremos from '../domain'
export interface POCAcordo {
  id: number;
  descricao: string;
  processoNumero: string;
  valorOriginal: number;
  data: string;
  status: 'pendente' | 'atrasada' | 'quitada';
  direcao: 'pagar' | 'receber';
}

export interface ObrigacaoListRowProps {
  obrigacao: POCAcordo;
  onClick?: (obrigacao: POCAcordo) => void;
  selected?: boolean;
  className?: string;
}

export function ObrigacaoListRow({ obrigacao, onClick, selected, className }: ObrigacaoListRowProps) {
  const isQuitada = obrigacao.status === 'quitada';
  const isAtrasada = obrigacao.status === 'atrasada';
  const isReceber = obrigacao.direcao === 'receber';

  const statusDotColor = isQuitada
    ? 'bg-success/50'
    : isAtrasada
    ? 'bg-destructive/50'
    : 'bg-warning/50';

  const IconBg = isReceber ? 'bg-success/8' : 'bg-destructive/8';
  const IconFg = isReceber ? 'text-success/50' : 'text-destructive/50';
  const Icon = isReceber ? TrendingUp : TrendingDown;

  return (
    <button
      onClick={() => onClick?.(obrigacao)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all outline-none text-left',
        'focus-visible:ring-1 focus-visible:ring-primary/30 hover:bg-white/4',
        selected && 'bg-primary/6',
        isQuitada && 'opacity-55',
        className,
      )}
    >
      {/* Status dot */}
      <div className={cn('size-2.5 rounded-full shrink-0', statusDotColor)} />

      {/* Icon */}
      <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', IconBg)}>
        <Icon className={cn('size-3.5', IconFg)} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{obrigacao.descricao}</p>
        <p className="text-[10px] text-muted-foreground/30 truncate flex items-center gap-1 mt-0.5">
          <Scale className="size-2.5 opacity-60" /> {obrigacao.processoNumero}
        </p>
      </div>

      {/* Valor */}
      <div className="text-right shrink-0 w-24 hidden sm:block">
        <p className="text-[11px] font-medium tabular-nums text-foreground/80">
          R$ {obrigacao.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-[9px] text-muted-foreground/40 tabular-nums">
          Valor Original
        </p>
      </div>

      {/* Responsável/Caixa */}
      <div className="flex items-center gap-1 shrink-0 md:flex w-24">
        <Landmark className="size-2.5 text-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground/50">{isReceber ? "Conta Itaú" : "Caixa Geral"}</span>
      </div>

      {/* Countdown or date */}
      <span className={cn(
        'text-[9px] shrink-0 w-20 text-right tabular-nums font-medium',
        isQuitada ? 'text-success/50' :
        isAtrasada ? 'text-destructive/50' :
        'text-warning/60',
      )}>
        {isQuitada ? 'Paga / Finalizada' : 
         isAtrasada ? `Venceu ${obrigacao.data}` : `Vence ${obrigacao.data}`}
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/15 shrink-0" />
    </button>
  );
}
