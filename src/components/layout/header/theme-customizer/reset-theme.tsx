"use client";

import { useThemeConfig } from "@/components/layout/theme/active-theme";
import { Button } from "@/components/ui/button";
import { DEFAULT_THEME } from "@/lib/themes";

interface ResetThemeButtonProps {
  label?: string;
}

export function ResetThemeButton({ 
  label = "Reset to Default"
}: ResetThemeButtonProps = {}) {
  const { setTheme } = useThemeConfig();

  const resetThemeHandle = () => {
    setTheme(DEFAULT_THEME);
  };

  return (
    <Button variant="destructive" className="w-full" onClick={resetThemeHandle}>
      {label}
    </Button>
  );
}
