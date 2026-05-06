'use client';

import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface SimNaoRadioProps {
  value: boolean | undefined;
  onValueChange: (value: boolean) => void;
  id: string;
  labelSim?: string;
  labelNao?: string;
}

export function SimNaoRadio({
  value,
  onValueChange,
  id,
  labelSim = 'Sim',
  labelNao = 'Não',
}: SimNaoRadioProps) {
  const radioValue = value === undefined ? '' : value ? 'sim' : 'nao';

  return (
    <RadioGroup
      value={radioValue}
      onValueChange={(v) => onValueChange(v === 'sim')}
      className={cn("flex inline-default")}
    >
      <div className={cn("flex items-center inline-tight")}>
        <RadioGroupItem value="sim" id={`${id}-sim`} />
        <Label htmlFor={`${id}-sim`} className="cursor-pointer font-normal">
          {labelSim}
        </Label>
      </div>
      <div className={cn("flex items-center inline-tight")}>
        <RadioGroupItem value="nao" id={`${id}-nao`} />
        <Label htmlFor={`${id}-nao`} className="cursor-pointer font-normal">
          {labelNao}
        </Label>
      </div>
    </RadioGroup>
  );
}
