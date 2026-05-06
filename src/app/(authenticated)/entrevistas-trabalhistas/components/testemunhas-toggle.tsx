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
    <GlassPanel className={cn(/* design-system-escape: gap-3 gap sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ "flex items-center gap-3 p-4")}>
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-1 items-center gap-2")}>
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
