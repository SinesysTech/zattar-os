'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FiltroCategoriaProps {
  value: string;
  onChange: (value: string) => void;
  tipo: 'despesa' | 'receita';
  placeholder?: string;
  className?: string;
}

// Categorias fixas para despesas (Contas a Pagar)
const CATEGORIAS_DESPESA = [
  { value: '', label: 'Todas' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'custas_processuais', label: 'Custas Processuais' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

// Categorias fixas para receitas (Contas a Receber)
const CATEGORIAS_RECEITA = [
  { value: '', label: 'Todas' },
  { value: 'honorarios_contratuais', label: 'Honorários Contratuais' },
  { value: 'honorarios_sucumbenciais', label: 'Honorários Sucumbenciais' },
  { value: 'honorarios_exito', label: 'Honorários de Êxito' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'assessoria', label: 'Assessoria' },
  { value: 'outros', label: 'Outros' },
];

export function FiltroCategoria({ value, onChange, tipo, placeholder = 'Categoria', className = 'w-[200px]' }: FiltroCategoriaProps) {
  const categorias = tipo === 'despesa' ? CATEGORIAS_DESPESA : CATEGORIAS_RECEITA;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categorias.map((categoria) => (
          <SelectItem key={categoria.value} value={categoria.value}>
            {categoria.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
