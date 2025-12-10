'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Assistente } from '@/core/app/_lib/types/assistentes'
import { sanitizarIframeCode } from '@/core/app/_lib/utils/format-assistentes'
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes'

export default function AssistentePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const assistenteId = parseInt(id)

  const [assistente, setAssistente] = useState<Assistente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar permissões granulares
  const { temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes('assistentes')
  const canView = temPermissao('assistentes', 'visualizar')

  useEffect(() => {
    // Aguardar carregamento das permissões
    if (isLoadingPermissoes) {
      return
    }

    if (isNaN(assistenteId)) {
      setError('ID do assistente inválido')
      setIsLoading(false)
      return
    }

    // Se não tem permissão para visualizar, não buscar
    if (!canView) {
      setIsLoading(false)
      return
    }

    const fetchAssistente = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/assistentes/${assistenteId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAssistente(data.data)
          } else {
            setError(data.error || 'Erro ao carregar assistente')
          }
        } else if (response.status === 404) {
          setError('Assistente não encontrado')
        } else if (response.status === 403) {
          setError('Você não tem permissão para visualizar este assistente')
        } else {
          setError('Erro ao carregar assistente')
        }
      } catch {
        setError('Erro de conexão')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssistente()
  }, [assistenteId, canView, isLoadingPermissoes])

  // Sanitizar o código do iframe antes de renderizar
  const sanitizedIframeResult = useMemo(() => {
    if (!assistente?.iframe_code) {
      return { html: '', error: null }
    }
    try {
      const sanitized = sanitizarIframeCode(assistente.iframe_code)
      return { html: sanitized, error: null }
    } catch {
      return {
        html: '',
        error: err instanceof Error ? err.message : 'Erro ao processar código do iframe',
      }
    }
  }, [assistente?.iframe_code])

  // Aguardar carregamento das permissões
  if (isLoadingPermissoes) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[80vh] w-full" />
      </div>
    )
  }

  if (!canView) {
    return (
      <div className="py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para visualizar este assistente.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[80vh] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!assistente) {
    return (
      <div className="py-8">
        <Alert>
          <AlertDescription>Assistente não encontrado</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => router.push('/assistentes')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">{assistente.nome}</h1>
      </div>

      {/* Iframe */}
      <div className="relative w-full min-h-[600px] h-[80vh]">
        {sanitizedIframeResult.error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao processar iframe: {sanitizedIframeResult.error}
            </AlertDescription>
          </Alert>
        ) : (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizedIframeResult.html }}
            className="w-full min-h-[600px] h-[80vh]"
          />
        )}
      </div>
    </div>
  )
}

