"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/core/app/_lib/utils/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export interface ComboboxOption {
  value: string
  label: string
  searchText?: string // Texto adicional para busca
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  multiple?: boolean
  disabled?: boolean
  selectAllText?: string
  clearAllText?: string
  className?: string
}

export function Combobox({
  options,
  value = [],
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  multiple = false,
  disabled = false,
  selectAllText = "Selecionar todas",
  clearAllText = "Limpar todas",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Limpar busca quando fechar
  React.useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  const selectedValues = multiple ? (value || []) : (value?.[0] ? [value[0]] : [])

  // Filtrar opções baseado na busca
  const filteredOptions = React.useMemo(() => {
    if (!search) return options

    const searchLower = search.toLowerCase()
    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(searchLower)
      const searchTextMatch = option.searchText?.toLowerCase().includes(searchLower)
      return labelMatch || searchTextMatch
    })
  }, [options, search])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const newValue = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onValueChange(newValue)
    } else {
      onValueChange([optionValue])
      setOpen(false)
    }
  }

  const handleSelectAll = () => {
    if (multiple) {
      const allValues = filteredOptions.map((opt) => opt.value)
      const allSelected = allValues.every((val) => selectedValues.includes(val))
      if (allSelected) {
        // Desmarcar todas as filtradas
        onValueChange(selectedValues.filter((val) => !allValues.includes(val)))
      } else {
        // Marcar todas as filtradas
        const newValues = [...new Set([...selectedValues, ...allValues])]
        onValueChange(newValues)
      }
    }
  }

  const handleClearAll = () => {
    if (multiple) {
      onValueChange([])
    } else {
      onValueChange([])
    }
  }

  const handleRemove = (valueToRemove: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    if (multiple) {
      onValueChange(selectedValues.filter((v) => v !== valueToRemove))
    } else {
      onValueChange([])
    }
  }

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value))
  const allFilteredSelected = multiple && filteredOptions.length > 0 &&
    filteredOptions.every((opt) => selectedValues.includes(opt.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-[44px] touch-manipulation", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : multiple ? (
              selectedOptions.length > 2 ? (
                <>
                  {selectedOptions.slice(0, 2).map((opt) => (
                    <Badge key={opt.value} variant="secondary" className="text-xs">
                      {opt.label}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleRemove(opt.value, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleRemove(opt.value, e)
                          }
                        }}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 cursor-pointer inline-flex items-center"
                        aria-label={`Remover ${opt.label}`}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - 2} mais
                  </Badge>
                </>
              ) : (
                selectedOptions.map((opt) => (
                  <Badge key={opt.value} variant="secondary" className="text-xs">
                    {opt.label}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(opt.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleRemove(opt.value, e)
                        }
                      }}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5 cursor-pointer inline-flex items-center"
                      aria-label={`Remover ${opt.label}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              )
            ) : (
              <span>{selectedOptions[0]?.label}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {/* Barra de busca */}
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 min-h-[44px] touch-manipulation"
              autoFocus
            />
          </div>

          {/* Botões de ação (apenas para múltipla seleção) */}
          {multiple && filteredOptions.length > 0 && (
            <div className="flex gap-2 p-2 border-b">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSelectAll}
              >
                {allFilteredSelected ? "Desmarcar todas" : selectAllText}
              </Button>
              {selectedValues.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleClearAll}
                >
                  {clearAllText}
                </Button>
              )}
            </div>
          )}

          {/* Lista de opções */}
          <div className="max-h-[300px] md:max-h-[400px] overflow-auto p-1 scroll-smooth">
            {filteredOptions.length === 0 ? (
              <Empty className="border-0 py-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle className="text-base">{emptyText}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 min-h-[44px] text-sm outline-none hover:bg-accent hover:text-accent-foreground touch-manipulation active:scale-[0.98] transition-transform",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {multiple && (
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected && "bg-primary border-primary"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                      <span className="flex-1">{option.label}</span>
                      {!multiple && isSelected && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

