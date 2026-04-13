'use client';

import * as React from 'react';
import { Building2, Smartphone, Briefcase, ChevronRight } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { TipoLitigio, PerfilReclamante } from '../domain';
import {
  TIPO_LITIGIO_LABELS,
  TIPO_LITIGIO_DESCRICAO,
  PERFIL_RECLAMANTE_LABELS,
  PERFIS_POR_TRILHA,
} from '../domain';

interface NoZeroSelectorProps {
  onSelect: (tipoLitigio: TipoLitigio, perfilReclamante?: PerfilReclamante) => void;
  isLoading?: boolean;
}

const TIPO_CONFIG: {
  value: TipoLitigio;
  icon: React.ReactNode;
}[] = [
  {
    value: 'trabalhista_classico',
    icon: <Building2 className="h-8 w-8" />,
  },
  {
    value: 'gig_economy',
    icon: <Smartphone className="h-8 w-8" />,
  },
  {
    value: 'pejotizacao',
    icon: <Briefcase className="h-8 w-8" />,
  },
];

export function NoZeroSelector({ onSelect, isLoading }: NoZeroSelectorProps) {
  const [selected, setSelected] = React.useState<TipoLitigio | null>(null);
  const [perfil, setPerfil] = React.useState<PerfilReclamante | undefined>(undefined);

  // Resetar perfil quando trocar de trilha
  const handleSelect = (value: TipoLitigio) => {
    setSelected(value);
    setPerfil(undefined);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected, perfil);
    }
  };

  // Perfis filtrados por trilha selecionada
  const perfisDisponiveis = selected ? PERFIS_POR_TRILHA[selected] : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <Heading level="card">Qual era a natureza principal do serviço prestado?</Heading>
        <Text variant="caption" className="mt-1">
          Isso define o modelo de investigação que será utilizado
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIPO_CONFIG.map(({ value, icon }) => {
          const isSelected = selected === value;

          return (
            <div
              key={value}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(value)}
            >
              <GlassPanel
                className={`relative cursor-pointer transition-all flex flex-col items-center gap-3 p-6 text-center ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary/20'
                    : 'hover:border-primary/50'
                }`}
              >
                <div className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                  {icon}
                </div>
                <div>
                  <p className="font-medium">{TIPO_LITIGIO_LABELS[value]}</p>
                  <Text variant="caption" className="mt-1">
                    {TIPO_LITIGIO_DESCRICAO[value]}
                  </Text>
                </div>
              </GlassPanel>
            </div>
          );
        })}
      </div>

      {selected && (
        <GlassPanel className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil do reclamante (opcional)</Label>
            <Select value={perfil ?? ''} onValueChange={(v) => setPerfil(v as PerfilReclamante)}>
              <SelectTrigger id="perfil">
                <SelectValue placeholder="Selecione o perfil..." />
              </SelectTrigger>
              <SelectContent>
                {perfisDisponiveis.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PERFIL_RECLAMANTE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Entrevista'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </GlassPanel>
      )}
    </div>
  );
}
