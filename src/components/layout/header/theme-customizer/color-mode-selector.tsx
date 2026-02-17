"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "next-themes";

interface ColorModeSelectorProps {
  label?: string;
  lightLabel?: string;
  darkLabel?: string;
}

export function ColorModeSelector({ 
  label = "Color mode",
  lightLabel = "Light",
  darkLabel = "Dark"
}: ColorModeSelectorProps = {}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <Label htmlFor="roundedCorner">{label}</Label>
      <ToggleGroup
        value={theme}
        type="single"
        onValueChange={(value) => setTheme(value)}
        className="*:border-input w-full gap-4 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="light">
          {lightLabel}
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="dark"
          className="data-[variant=outline]:border-l">
          {darkLabel}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
