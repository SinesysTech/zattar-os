"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"

interface PageSearchContextValue {
  /** Valor atual da busca */
  value: string
  /** Atualiza o valor (chamado pela search bar do header) */
  setValue: (v: string) => void
  /** Registra o handler de busca da página (chamado pelo DataTableToolbar ao montar) */
  register: (handler: (v: string) => void, placeholder?: string) => void
  /** Desregistra ao desmontar */
  unregister: () => void
  /** Se alguma página registrou um handler */
  hasHandler: boolean
  /** Placeholder customizado da página atual */
  placeholder: string
}

const noop = () => {}
const fallback: PageSearchContextValue = {
  value: "",
  setValue: noop,
  register: noop,
  unregister: noop,
  hasHandler: false,
  placeholder: "Buscar...",
}

const PageSearchContext = createContext<PageSearchContextValue>(fallback)

export function PageSearchProvider({ children }: { children: ReactNode }) {
  const [value, setValueState] = useState("")
  const [hasHandler, setHasHandler] = useState(false)
  const [placeholder, setPlaceholder] = useState("Buscar...")
  const handlerRef = useRef<((v: string) => void) | null>(null)

  const setValue = useCallback((v: string) => {
    setValueState(v)
    handlerRef.current?.(v)
  }, [])

  const register = useCallback((handler: (v: string) => void, ph?: string) => {
    handlerRef.current = handler
    setHasHandler(true)
    if (ph) setPlaceholder(ph)
    setValueState("")
  }, [])

  const unregister = useCallback(() => {
    handlerRef.current = null
    setHasHandler(false)
    setPlaceholder("Buscar...")
    setValueState("")
  }, [])

  return (
    <PageSearchContext.Provider
      value={{ value, setValue, register, unregister, hasHandler, placeholder }}
    >
      {children}
    </PageSearchContext.Provider>
  )
}

export function usePageSearch() {
  return useContext(PageSearchContext)
}
