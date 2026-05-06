import { cn } from '@/lib/utils';
import { BrandMark } from "@/components/shared/brand-mark";
import { Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

export function BrandSection() {
  return (
    <SpecimenCard eyebrow="BRAND · LOGO" title="Zattar wordmark">
      <div className={cn("grid grid-cols-1 inline-default sm:grid-cols-2")}>
        <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex min-h-[140px] items-center justify-center rounded-2xl border border-border bg-card inset-extra-loose")}>
          <BrandMark variant="dark" size="xl" />
        </div>
        <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex min-h-[140px] items-center justify-center rounded-2xl border border-white/10 bg-sidebar inset-extra-loose")}>
          <BrandMark variant="light" size="xl" />
        </div>
      </div>
      <div className={cn("mt-3 flex justify-between px-1")}>
        <Text variant="meta-label">LIGHT SURFACE</Text>
        <Text variant="meta-label">DARK SURFACE · SIDEBAR</Text>
      </div>
    </SpecimenCard>
  );
}
