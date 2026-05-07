import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export function CnCallCases({ active }: { active: boolean }) {
  return (
    <>
      <Text variant="caption" weight="medium" className={cn(active && "text-primary")}>cn case A</Text>
      <Text variant="body" weight="bold" className={cn("text-foreground", "leading-tight")}>cn case B</Text>
    </>
  );
}
