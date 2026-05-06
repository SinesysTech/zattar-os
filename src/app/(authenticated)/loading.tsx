import { Skeleton } from '@/components/ui/skeleton'

export default function AuthenticatedLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-[420px] rounded-2xl" />

      <span className="sr-only">Carregando conteúdo da página...</span>
    </div>
  )
}
