"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  searchText?: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  searchHint?: string
  emptyText?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
  selectAllText?: string
  clearAllText?: string
}

function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  multiple = false,
  disabled = false,
  className,
}: ComboboxProps) {
  const [query, setQuery] = React.useState("")

  const normalizedValue = React.useMemo(() => {
    return Array.isArray(value) ? value : []
  }, [value])

  const filteredOptions = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options

    return options.filter((opt) => {
      const haystack = `${opt.label} ${opt.searchText ?? ""} ${opt.value}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [options, query])

  if (multiple) {
    return (
      <div className={cn("space-y-2", className)}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder ?? "Buscar..."}
          disabled={disabled}
          className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
        />
        <select
          multiple
          value={normalizedValue}
          onChange={(e) => {
            const selectedValues = Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value)
            onValueChange(selectedValues)
          }}
          disabled={disabled}
          className="min-h-24 w-full rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
        >
          {filteredOptions.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {filteredOptions.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyText ?? "Nenhuma opção encontrada"}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder ?? "Buscar..."}
        disabled={disabled}
        className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      />
      <select
        value={normalizedValue[0] ?? ""}
        onChange={(e) => {
          const selected = e.currentTarget.value
          onValueChange(selected ? [selected] : [])
        }}
        disabled={disabled}
        className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
      >
        <option value="">{placeholder ?? "Selecione..."}</option>
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {filteredOptions.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyText ?? "Nenhuma opção encontrada"}</p>
      )}
    </div>
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export { Combobox, useComboboxAnchor }
