"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface FilterOption<T> {
  label: string
  value: T
}

interface PortalFilterBarProps<T> {
  filters: FilterOption<T>[]
  activeFilter: T
  onFilterChange: (value: T) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
}

export function PortalFilterBar<T extends string | null>({
  filters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
}: PortalFilterBarProps<T>) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {onSearchChange !== undefined && (
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {filters.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onFilterChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
