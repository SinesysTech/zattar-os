import { Text, Heading } from '@/components/ui/typography';

export function StringLiteralCases() {
  return (
    <>
      <Text variant="caption" weight="medium" className="text-foreground">label A</Text>
      <Text variant="body" weight="bold">label B (only weight)</Text>
      <Heading level="card" weight="semibold" className="mt-4">heading C</Heading>
      <span className="font-medium uppercase">wrapper bruto — não toca</span>
      <Text variant="label">sem className — não toca</Text>
    </>
  );
}
