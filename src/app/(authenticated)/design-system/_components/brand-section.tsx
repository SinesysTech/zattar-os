import { BrandMark } from "@/components/shared/brand-mark";
import { Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

export function BrandSection() {
  return (
    <SpecimenCard eyebrow="BRAND · LOGO" title="Zattar wordmark">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-border bg-card p-8">
          <BrandMark variant="dark" size="xl" />
        </div>
        <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-white/10 bg-sidebar p-8">
          <BrandMark variant="light" size="xl" />
        </div>
      </div>
      <div className="mt-3 flex justify-between px-1">
        <Text variant="meta-label">LIGHT SURFACE</Text>
        <Text variant="meta-label">DARK SURFACE · SIDEBAR</Text>
      </div>
    </SpecimenCard>
  );
}
