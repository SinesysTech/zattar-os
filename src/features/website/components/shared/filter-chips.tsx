"use client";

import { cn } from "@/lib/utils";

interface FilterChipsProps {
  options: string[];
  activeOption: string;
  onSelect: (option: string) => void;
  className?: string;
}

/**
 * Filter chips row for content filtering (Insights, Processes, etc.).
 * Active chip is solid primary, inactive chips are surface-container-highest.
 */
export function FilterChips({
  options,
  activeOption,
  onSelect,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3 items-center", className)}>
      {options.map((option) => {
        const isActive = option === activeOption;
        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer",
              isActive
                ? "bg-primary text-on-primary-fixed"
                : "bg-surface-container-highest text-primary hover:bg-surface-variant"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
