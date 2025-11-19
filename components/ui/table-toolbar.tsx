"use client"

import * as React from "react"
import { Search, Filter, Plus, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface ComboboxOption {
  value: string
  label: string
  searchText?: string
}

interface TableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  isSearching?: boolean
  searchPlaceholder?: string
  filterOptions: ComboboxOption[]
  selectedFilters: string[]
  onFiltersChange: (filters: string[]) => void
  onNewClick?: () => void
  newButtonTooltip?: string
  className?: string
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  isSearching = false,
  searchPlaceholder = "Buscar...",
  filterOptions,
  selectedFilters,
  onFiltersChange,
  onNewClick,
  newButtonTooltip = "Novo",
  className,
}: TableToolbarProps) {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [filterSearch, setFilterSearch] = React.useState("")

  // Limpar busca quando fechar
  React.useEffect(() => {
    if (!filterOpen) {
      setFilterSearch("")
    }
  }, [filterOpen])

  const handleFilterSelect = (optionValue: string) => {
    const newSelected = selectedFilters.includes(optionValue)
      ? selectedFilters.filter((v) => v !== optionValue)
      : [...selectedFilters, optionValue]
    onFiltersChange(newSelected)
  }

  const handleSelectAllFilters = () => {
    onFiltersChange(filterOptions.map((opt) => opt.value))
  }

  const handleClearAllFilters = () => {
    onFiltersChange([])
  }

  return (
    <ButtonGroup className={cn("w-full", className)}>
      <InputGroup className="flex-1">
        <InputGroupAddon>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
        {isSearching && (
          <InputGroupAddon align="inline-end">
            <Loader2 className="h-4 w-4 animate-spin" />
          </InputGroupAddon>
        )}
      </InputGroup>
      <ButtonGroupSeparator />
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Filtros" className="relative">
            <Filter className="h-4 w-4" />
            {selectedFilters.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {selectedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" sideOffset={4}>
          <Command shouldFilter={true}>
            <CommandInput
              placeholder="Buscar filtros..."
              value={filterSearch}
              onValueChange={setFilterSearch}
            />
            {/* Botões de ação */}
            {filterOptions.length > 0 && (
              <div className="flex gap-2 p-2 border-b">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSelectAllFilters}
                >
                  Selecionar todas
                </Button>
                {selectedFilters.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleClearAllFilters}
                  >
                    Limpar todas
                  </Button>
                )}
              </div>
            )}
            <CommandList>
              <CommandEmpty>
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum filtro encontrado.
                </div>
              </CommandEmpty>
              {filterOptions.map((option) => {
                const isSelected = selectedFilters.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={option.searchText ? [option.searchText] : undefined}
                    onSelect={() => handleFilterSelect(option.value)}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected && "bg-primary border-primary"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="flex-1">{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onNewClick && (
        <>
          <ButtonGroupSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onNewClick} aria-label="Novo">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {newButtonTooltip}
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </ButtonGroup>
  )
}