"use client";

import { Label } from "@/components/ui/label";
import { useThemeConfig } from "@/components/layout/theme/active-theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon } from "lucide-react";

interface ThemeRadiusSelectorProps {
  label?: string;
}

export function ThemeRadiusSelector({ 
  label = "Radius"
}: ThemeRadiusSelectorProps = {}) {
  const { theme, setTheme } = useThemeConfig();

  return (
    <div className="flex flex-col gap-4">
      <Label htmlFor="roundedCorner">{label}</Label>
      <ToggleGroup
        value={theme.radius}
        type="single"
        onValueChange={(value) => setTheme({ ...theme, radius: value as typeof theme.radius })}
        className="*:border-input w-full gap-3 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="none">
          <BanIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="sm"
          className="text-xs data-[variant=outline]:border-l">
          SM
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="md"
          className="text-xs data-[variant=outline]:border-l">
          MD
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="lg"
          className="text-xs data-[variant=outline]:border-l">
          LG
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="xl"
          className="text-xs data-[variant=outline]:border-l">
          XL
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
