"use client"

import * as React from "react"
import { Search, Filter, Plus, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

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

  // Filtrar opções de filtro baseado na busca
  const filteredFilterOptions = React.useMemo(() => {
    if (!filterSearch) return filterOptions

    const searchLower = filterSearch.toLowerCase()
    return filterOptions.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(searchLower)
      const searchTextMatch = option.searchText?.toLowerCase().includes(searchLower)
      return labelMatch || searchTextMatch
    })
  }, [filterOptions, filterSearch])

  const handleFilterSelect = (optionValue: string) => {
    const newSelected = selectedFilters.includes(optionValue)
      ? selectedFilters.filter((v) => v !== optionValue)
      : [...selectedFilters, optionValue]
    onFiltersChange(newSelected)
  }

  const handleSelectAllFilters = () => {
    const allValues = filteredFilterOptions.map((opt) => opt.value)
    const allSelected = allValues.every((val) => selectedFilters.includes(val))
    if (allSelected) {
      // Desmarcar todas as filtradas
      onFiltersChange(selectedFilters.filter((val) => !allValues.includes(val)))
    } else {
      // Marcar todas as filtradas
      const newValues = [...new Set([...selectedFilters, ...allValues])]
      onFiltersChange(newValues)
    }
  }

  const handleClearAllFilters = () => {
    onFiltersChange([])
  }

  const allFilteredSelected = filteredFilterOptions.length > 0 &&
    filteredFilterOptions.every((opt) => selectedFilters.includes(opt.value))

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
          <div className="flex flex-col">
            {/* Barra de busca */}
            <div className="p-2 border-b">
              <Input
                placeholder="Buscar filtros..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Botões de ação */}
            {filteredFilterOptions.length > 0 && (
              <div className="flex gap-2 p-2 border-b">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSelectAllFilters}
                >
                  {allFilteredSelected ? "Desmarcar todas" : "Selecionar todas"}
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

            {/* Lista de opções */}
            <div className="max-h-[300px] overflow-auto p-1">
              {filteredFilterOptions.length === 0 ? (
                <Empty className="border-0 py-4">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Search className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle className="text-base">Nenhum filtro encontrado.</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                filteredFilterOptions.map((option) => {
                  const isSelected = selectedFilters.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent"
                      )}
                      onClick={() => handleFilterSelect(option.value)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSelected && "bg-primary border-primary"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="flex-1">{option.label}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
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