"use client";

import { DEFAULT_THEME, THEMES } from "@/lib/themes";
import { useThemeConfig } from "@/components/layout/theme/active-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PresetSelectorProps {
  label?: string;
  placeholder?: string;
}

export function PresetSelector({ 
  label = "Theme preset",
  placeholder = "Select a theme"
}: PresetSelectorProps = {}) {
  const { theme, setTheme } = useThemeConfig();

  const handlePreset = (value: string) => {
    setTheme({ ...theme, ...DEFAULT_THEME, preset: value as typeof theme.preset });
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>{label}</Label>
      <Select value={theme.preset} onValueChange={(value) => handlePreset(value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="end">
          {THEMES.map((theme) => (
            <SelectItem key={theme.name} value={theme.value}>
              <div className="flex shrink-0 gap-1">
                {theme.colors.map((color, key) => (
                  <span
                    key={key}
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}></span>
                ))}
              </div>
              {theme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
