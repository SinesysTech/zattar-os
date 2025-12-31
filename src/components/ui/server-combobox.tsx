"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

export interface ComboboxOption {
  value: string
  label: string
  searchText?: string
}

interface ServerComboboxProps {
  /**
   * Função assíncrona para buscar opções no servidor
   * @param query - Termo de busca (vazio para carregar inicial)
   * @returns Promise com array de opções
   */
  onSearch: (query: string) => Promise<ComboboxOption[]>
  value?: string[]
  onValueChange: (value: string[]) => void
  /**
   * Opções iniciais para itens já selecionados (para mostrar labels corretos)
   * Útil quando editando registros existentes
   */
  initialSelectedOptions?: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loadingText?: string
  multiple?: boolean
  disabled?: boolean
  selectAllText?: string
  clearAllText?: string
  className?: string
  /**
   * Delay em ms antes de disparar a busca (debounce)
   * @default 300
   */
  debounceMs?: number
  /**
   * Número mínimo de caracteres para iniciar busca
   * @default 0
   */
  minSearchLength?: number
}

export function ServerCombobox({
  onSearch,
  value = [],
  onValueChange,
  initialSelectedOptions = [],
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  loadingText = "Buscando...",
  multiple = false,
  disabled = false,
  selectAllText = "Selecionar todas",
  clearAllText = "Limpar todas",
  className,
  debounceMs = 300,
  minSearchLength = 0,
}: ServerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [options, setOptions] = React.useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>()

  const selectedValues = multiple ? (value || []) : (value?.[0] ? [value[0]] : [])
  const hasLoadedRef = React.useRef(false)

  // Carregar opções iniciais ao abrir
  React.useEffect(() => {
    if (open && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadOptions("")
    }
  }, [open])

  // Limpar busca e resetar flag quando fechar
  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setOptions([])
      hasLoadedRef.current = false
    }
  }, [open])

  // Buscar com debounce
  React.useEffect(() => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Não buscar se não atingir tamanho mínimo
    if (search.length > 0 && search.length < minSearchLength) {
      return
    }

    // Agendar nova busca
    searchTimeoutRef.current = setTimeout(() => {
      loadOptions(search)
    }, debounceMs)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search, debounceMs, minSearchLength])

  const loadOptions = async (query: string) => {
    setIsLoading(true)
    try {
      const results = await onSearch(query)
      setOptions(results)
    } catch (error) {
      console.error("Erro ao buscar opções:", error)
      setOptions([])
    } finally {
      setIsLoading(false)
    }
  }

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
      const allValues = options.map((opt) => opt.value)
      const allSelected = allValues.every((val) => selectedValues.includes(val))
      if (allSelected) {
        onValueChange(selectedValues.filter((val) => !allValues.includes(val)))
      } else {
        const newValues = [...new Set([...selectedValues, ...allValues])]
        onValueChange(newValues)
      }
    }
  }

  const handleClearAll = () => {
    onValueChange([])
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

  // Para mostrar labels de itens selecionados que não estão nas opções atuais,
  // usa initialSelectedOptions como fallback e depois cria placeholder para os não encontrados.
  const allSelectedOptions = React.useMemo(() => {
    // Tentar encontrar nas opções atuais
    const found = options.filter((opt) => selectedValues.includes(opt.value))

    // Se todos foram encontrados, retornar
    if (found.length === selectedValues.length) {
      return found
    }

    // Tentar encontrar nas opções iniciais para itens não encontrados
    const foundValues = new Set(found.map(o => o.value))
    const fromInitial = initialSelectedOptions.filter(
      (opt) => selectedValues.includes(opt.value) && !foundValues.has(opt.value)
    )

    // Atualizar set com valores encontrados nas opções iniciais
    fromInitial.forEach(opt => foundValues.add(opt.value))

    // Criar placeholder para os que ainda não foram encontrados
    const missing = selectedValues
      .filter(v => !foundValues.has(v))
      .map(v => ({ value: v, label: `ID: ${v}` }))

    return [...found, ...fromInitial, ...missing]
  }, [options, selectedValues, initialSelectedOptions])

  const allFilteredSelected = multiple && options.length > 0 &&
    options.every((opt) => selectedValues.includes(opt.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-9 px-3", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 min-w-0 items-center overflow-hidden">
            {allSelectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : multiple ? (
              allSelectedOptions.length > 2 ? (
                <>
                  {allSelectedOptions.slice(0, 2).map((opt) => (
                    <Badge key={opt.value} variant="secondary" className="text-[10px] px-1 h-5 font-normal">
                      {opt.label.split(' - ')[0]}
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
                        className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full cursor-pointer inline-flex items-center"
                        aria-label={`Remover ${opt.label}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </span>
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-[10px] px-1 h-5 font-normal">
                    +{allSelectedOptions.length - 2}
                  </Badge>
                </>
              ) : (
                allSelectedOptions.map((opt) => (
                  <Badge key={opt.value} variant="secondary" className="text-[10px] px-1 h-5 font-normal">
                    {opt.label.split(' - ')[0]}
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
                      className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full cursor-pointer inline-flex items-center"
                      aria-label={`Remover ${opt.label}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  </Badge>
                ))
              )
            ) : (
              <span className="truncate">{allSelectedOptions[0]?.label}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {/* Barra de busca */}
          <div className="p-2 border-b">
            <div className="relative">
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm pr-8"
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação (apenas para múltipla seleção) */}
          {multiple && options.length > 0 && !isLoading && (
            <div className="flex gap-2 p-2 border-b">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleSelectAll}
              >
                {allFilteredSelected ? "Desmarcar" : selectAllText}
              </Button>
              {selectedValues.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={handleClearAll}
                >
                  {clearAllText}
                </Button>
              )}
            </div>
          )}

          {/* Lista de opções */}
          <div className="max-h-[300px] overflow-auto p-1 scroll-smooth">
            {isLoading ? (
              <Empty className="border-0 py-4 h-auto min-h-0">
                <EmptyHeader>
                  <EmptyTitle className="text-sm font-normal text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingText}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : options.length === 0 ? (
              <Empty className="border-0 py-4 h-auto min-h-0">
                <EmptyHeader>
                  <EmptyTitle className="text-sm font-normal text-muted-foreground">{emptyText}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground touch-manipulation active:scale-[0.98] transition-transform",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      {multiple && (
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border shrink-0",
                            isSelected && "bg-primary border-primary"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      )}
                      <span className="truncate">{option.label}</span>
                      {!multiple && isSelected && (
                        <Check className="h-4 w-4 shrink-0" />
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
