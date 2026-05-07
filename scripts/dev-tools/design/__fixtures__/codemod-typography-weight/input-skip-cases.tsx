import { Text } from '@/components/ui/typography';

export function SkipCases({ cond, extra }: { cond: boolean; extra: string }) {
  return (
    <>
      <Text variant="caption" className={cond ? "font-medium" : "font-bold"}>ternário</Text>
      <Text variant="body" className={"font-medium " + extra}>concat</Text>
      <Text variant="caption" className="font-medium font-bold">peso duplo</Text>
      <Text variant="caption" weight="medium" className="font-bold">já tem weight</Text>
    </>
  );
}
