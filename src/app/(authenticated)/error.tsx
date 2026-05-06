'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/typography'
import { isServerActionVersionMismatch } from '@/lib/server-action-error-handler'

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isReloading, setIsReloading] = useState(false)
  const isVersionMismatch = isServerActionVersionMismatch(error)

  useEffect(() => {
    console.error('[AuthenticatedError]', error)

    if (isVersionMismatch) {
      const timer = setTimeout(() => {
        setIsReloading(true)
        window.location.reload()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, isVersionMismatch])

  if (isVersionMismatch) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
        <div className="flex animate-in flex-col items-center gap-4 text-center zoom-in-95 fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-info/10">
            <RefreshCw className={`h-10 w-10 text-info ${isReloading ? 'animate-spin' : ''}`} />
          </div>
          <div className="space-y-2">
            <Heading level="section">Nova versão disponível</Heading>
            <Text variant="body-sm" className="max-w-md text-muted-foreground">
              O sistema foi atualizado. A página será recarregada automaticamente em alguns segundos.
            </Text>
          </div>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setIsReloading(true)
              window.location.reload()
            }}
            disabled={isReloading}
          >
            {isReloading ? (
              <>
                <RefreshCw className="mr-2 size-3.5 animate-spin" />
                Recarregando...
              </>
            ) : (
              'Recarregar agora'
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
      <div className="flex animate-in flex-col items-center gap-4 text-center zoom-in-95 fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <Heading level="section">Algo deu errado nesta página</Heading>
          <Text variant="body-sm" className="max-w-md text-muted-foreground">
            Ocorreu um erro inesperado ao carregar este módulo. Você pode tentar novamente ou voltar ao Dashboard.
          </Text>
          {error.digest && (
            <Text variant="caption" className="font-mono text-muted-foreground/70">
              ref: {error.digest}
            </Text>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Button size="sm" className="rounded-xl" asChild>
            <a href="/app/dashboard">Ir para o Dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
