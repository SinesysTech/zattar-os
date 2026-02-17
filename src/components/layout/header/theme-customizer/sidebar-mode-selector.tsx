"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarModeSelectorProps {
  label?: string;
  defaultLabel?: string;
  iconLabel?: string;
}

export function SidebarModeSelector({ 
  label = "Sidebar mode",
  defaultLabel = "Default",
  iconLabel = "Icon"
}: SidebarModeSelectorProps = {}) {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="hidden flex-col gap-4 lg:flex">
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        onValueChange={() => toggleSidebar()}
        className="*:border-input w-full gap-4 *:rounded-md *:border">
        <ToggleGroupItem variant="outline" value="full">
          {defaultLabel}
        </ToggleGroupItem>
        <ToggleGroupItem
          variant="outline"
          value="centered"
          className="data-[variant=outline]:border-l">
          {iconLabel}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
