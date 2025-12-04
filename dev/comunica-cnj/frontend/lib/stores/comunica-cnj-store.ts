export type Pagination = { pagina: number; totalPaginas: number; total: number } | null
export type ComunicaCNJState = {
  comunicacoes: any[]
  pagination: Pagination
  isLoading: boolean
  schedules: any[]
  searchFilters?: any
  fetchComunicacoes: (filters: any) => Promise<void>
  fetchSchedules?: () => Promise<void>
  toggleSchedule?: (id: string) => Promise<void>
  deleteSchedule?: (id: string) => Promise<void>
}

const state: ComunicaCNJState = {
  comunicacoes: [],
  pagination: null,
  isLoading: false,
  schedules: [],
  searchFilters: undefined,
  fetchComunicacoes: async () => {}
}

type StoreFn = (() => ComunicaCNJState) & { getState: () => ComunicaCNJState }

export const useComunicaCNJStore: StoreFn = Object.assign(() => state, { getState: () => state })
