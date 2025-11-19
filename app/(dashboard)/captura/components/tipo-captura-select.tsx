'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Database, Archive, Calendar, AlertCircle } from 'lucide-react';

export type TipoCaptura = 'acervo-geral' | 'arquivados' | 'audiencias' | 'pendentes';

interface TipoCapturaSelectProps {
  value: TipoCaptura;
  onValueChange: (value: TipoCaptura) => void;
  disabled?: boolean;
}

const tiposCaptura = [
  {
    value: 'acervo-geral' as TipoCaptura,
    label: 'Acervo Geral',
    description: 'Capturar processos ativos do acervo',
    icon: Database,
  },
  {
    value: 'arquivados' as TipoCaptura,
    label: 'Arquivados',
    description: 'Capturar processos arquivados',
    icon: Archive,
  },
  {
    value: 'audiencias' as TipoCaptura,
    label: 'Audiências',
    description: 'Capturar audiências agendadas',
    icon: Calendar,
  },
  {
    value: 'pendentes' as TipoCaptura,
    label: 'Expedientes',
    description: 'Capturar pendências de manifestação',
    icon: AlertCircle,
  },
];

export function TipoCapturaSelect({
  value,
  onValueChange,
  disabled,
}: TipoCapturaSelectProps) {
  const selectedTipo = tiposCaptura.find((tipo) => tipo.value === value);
  const Icon = selectedTipo?.icon || Database;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{selectedTipo?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {tiposCaptura.map((tipo) => {
          const TipoIcon = tipo.icon;
          return (
            <SelectItem key={tipo.value} value={tipo.value}>
              <div className="flex items-center gap-3">
                <TipoIcon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{tipo.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {tipo.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export { tiposCaptura };
