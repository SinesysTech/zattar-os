"use client";

import { Label } from "@/components/ui/label";
import { useThemeConfig } from "@/components/layout/theme/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ContentLayoutSelectorProps {
  label?: string;
  fullLabel?: string;
  centeredLabel?: string;
}

export function ContentLayoutSelector({ 
  label = "Content layout",
  fullLabel = "Full",
  centeredLabel = "Centered"
}: ContentLayoutSelectorProps = {}) {
  const { theme, setTheme } = useThemeConfig();

  return (
    <div className="hidden flex-col gap-4 lg:flex">
      <Label>{label}</Label>
      <ToggleGroup
        value={theme.contentLayout}
        type="single"
        onValueChange={(value) => setTheme({ ...theme, contentLayout: value as 'full' | 'centered' })}
        className="*:border-input w-full gap-4 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="full">
          {fullLabel}
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="centered"
          className="data-[variant=outline]:border-l">
          {centeredLabel}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
