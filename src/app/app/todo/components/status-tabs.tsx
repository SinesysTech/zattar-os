"use client";

import React from "react";

import { AnimatedIconTabs } from "@/components/ui/animated-icon-tabs";
import { LayoutList, CircleDashed, CircleDot, CircleCheck } from "lucide-react";
import type { FilterTab } from "../types";
import { EnumTodoStatus, todoStatusNamed } from "../enum";

const TABS_CONFIG = [
  { value: "all" as FilterTab, label: "Todas", icon: LayoutList },
  { value: EnumTodoStatus.Pending as FilterTab, label: todoStatusNamed[EnumTodoStatus.Pending], icon: CircleDashed },
  { value: EnumTodoStatus.InProgress as FilterTab, label: todoStatusNamed[EnumTodoStatus.InProgress], icon: CircleDot },
  { value: EnumTodoStatus.Completed as FilterTab, label: todoStatusNamed[EnumTodoStatus.Completed], icon: CircleCheck },
];

const TABS_UI = TABS_CONFIG.map((tab) => {
  const Icon = tab.icon;
  return { value: tab.value, label: tab.label, icon: <Icon /> };
});

interface StatusTabsProps {
  onTabChange: (tab: FilterTab) => void;
  activeTab: FilterTab;
}

export default function StatusTabs({ onTabChange, activeTab }: StatusTabsProps) {
  return (
    <AnimatedIconTabs
      tabs={TABS_UI}
      value={activeTab}
      onValueChange={(value) => onTabChange(value as FilterTab)}
    />
  );
}


