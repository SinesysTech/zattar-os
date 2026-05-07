import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export function CnCallCases({ active }: { active: boolean }) {
  return (
    <>
      <Text variant="caption" className={cn("font-medium", active && "text-primary")}>cn case A</Text>
      <Text variant="body" className={cn("text-foreground", "font-bold", "leading-tight")}>cn case B</Text>
    </>
  );
}
