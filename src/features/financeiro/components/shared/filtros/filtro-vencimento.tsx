'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VencimentoPreset } from '../../../utils/parse-vencimento';

interface FiltroVencimentoProps {
  value: VencimentoPreset;
  onChange: (value: VencimentoPreset) => void;
  placeholder?: string;
  className?: string;
}

const VENCIMENTO_OPTIONS: { value: VencimentoPreset; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'vencidas', label: 'Vencidas' },
  { value: 'hoje', label: 'Vencem hoje' },
  { value: '7dias', label: 'Próximos 7 dias' },
  { value: '30dias', label: 'Próximos 30 dias' },
];

export function FiltroVencimento({ value, onChange, placeholder = 'Vencimento', className = 'w-[170px]' }: FiltroVencimentoProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {VENCIMENTO_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
