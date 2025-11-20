"use client"

import * as React from "react"
import { Search, Filter, Plus, Check, Loader2, ChevronRight } from "lucide-react"
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

export interface FilterGroup {
  label: string
  options: ComboboxOption[]
}

interface TableToolbarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  isSearching?: boolean
  searchPlaceholder?: string
  filterOptions: ComboboxOption[]
  filterGroups?: FilterGroup[]
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
  filterGroups,
  selectedFilters,
  onFiltersChange,
  onNewClick,
  newButtonTooltip = "Novo",
  className,
}: TableToolbarProps) {
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [filterSearch, setFilterSearch] = React.useState("")
  const [activeGroup, setActiveGroup] = React.useState<string | null>(null)

  // Limpar busca quando fechar
  React.useEffect(() => {
    if (!filterOpen) {
      setFilterSearch("")
      setActiveGroup(null)
    }
  }, [filterOpen])

  const handleFilterSelect = (optionValue: string) => {
    const newSelected = selectedFilters.includes(optionValue)
      ? selectedFilters.filter((v) => v !== optionValue)
      : [...selectedFilters, optionValue]
    onFiltersChange(newSelected)
  }

  const handleSelectAllFilters = () => {
    if (filterGroups) {
      const allValues = filterGroups.flatMap(group => group.options.map(opt => opt.value))
      onFiltersChange(allValues)
    } else {
      onFiltersChange(filterOptions.map((opt) => opt.value))
    }
  }

  const handleClearAllFilters = () => {
    onFiltersChange([])
  }

  // Usar grupos se disponível, senão fallback para lista plana
  const useGroupedFilters = filterGroups && filterGroups.length > 0

  return (
    <ButtonGroup className={cn("w-fit", className)}>
      <InputGroup className="w-full max-w-md">
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
          <Button variant="outline" size="icon" aria-label="Filtros" className="relative bg-black hover:bg-black/90 text-white border-black">
            <Filter className="h-4 w-4" />
            {selectedFilters.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {selectedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" sideOffset={4}>
          {useGroupedFilters ? (
            // Renderização hierarquizada com grupos
            <div className="flex">
              {/* Lista de grupos (lado esquerdo) */}
              <div className="w-full border-r">
                <div className="p-2 border-b">
                  <div className="text-sm font-semibold px-2 py-1.5">Filtros</div>
                </div>
                <div className="max-h-[400px] overflow-auto">
                  {filterGroups!.map((group) => {
                    const groupSelectedCount = group.options.filter(opt => 
                      selectedFilters.includes(opt.value)
                    ).length
                    const isActive = activeGroup === group.label
                    
                    return (
                      <div
                        key={group.label}
                        className={cn(
                          "relative flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors",
                          isActive && "bg-accent"
                        )}
                        onMouseEnter={() => setActiveGroup(group.label)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span>{group.label}</span>
                          {groupSelectedCount > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                              {groupSelectedCount}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submenu com opções (lado direito) */}
              {activeGroup && (
                <div className="w-80 border-l">
                  <div className="p-2 border-b">
                    <div className="text-sm font-semibold px-2 py-1.5">{activeGroup}</div>
                  </div>
                  <div className="max-h-[400px] overflow-auto p-1">
                    {filterGroups!.find(g => g.label === activeGroup)?.options.map((option) => {
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
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border mr-2",
                              isSelected && "bg-primary border-primary"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="flex-1">{option.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Renderização original (lista plana)
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
          )}
        </PopoverContent>
      </Popover>
      {onNewClick && (
        <>
          <ButtonGroupSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onNewClick} aria-label="Novo">
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