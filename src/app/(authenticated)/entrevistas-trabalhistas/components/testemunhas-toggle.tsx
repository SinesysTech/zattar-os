'use client';

import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface TestemunhasToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function TestemunhasToggle({ checked, onCheckedChange }: TestemunhasToggleProps) {
  return (
    <GlassPanel className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 inset-card-compact")}>
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className={cn("flex flex-1 items-center inline-tight")}>
        <Checkbox
          id="testemunhas"
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        <Label htmlFor="testemunhas" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "cursor-pointer text-body-sm font-medium")}>
          Testemunhas foram mapeadas durante a entrevista
        </Label>
      </div>
    </GlassPanel>
  );
}
