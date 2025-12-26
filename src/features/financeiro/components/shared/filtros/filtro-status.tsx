'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StatusOrcamento = 'rascunho' | 'aprovado' | 'em_execucao' | 'encerrado' | 'cancelado';
type StatusLancamento = 'pendente' | 'confirmado' | 'cancelado' | 'estornado';

interface FiltroStatusProps {
  value: string;
  onChange: (value: string) => void;
  tipo: 'orcamento' | 'lancamento';
  placeholder?: string;
  className?: string;
}

const STATUS_ORCAMENTO_OPTIONS: { value: StatusOrcamento | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'em_execucao', label: 'Em Execução' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const STATUS_LANCAMENTO_OPTIONS: { value: StatusLancamento | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'estornado', label: 'Estornado' },
];

export function FiltroStatus({ value, onChange, tipo, placeholder = 'Status', className = 'w-[150px]' }: FiltroStatusProps) {
  const options = tipo === 'orcamento' ? STATUS_ORCAMENTO_OPTIONS : STATUS_LANCAMENTO_OPTIONS;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
