'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Assistente } from '@/app/_lib/types/assistentes'
import { formatarDataCriacao, truncarDescricao, sanitizarIframeCode } from '@/app/_lib/utils/format-assistentes'
import { AssistenteEditDialog } from '../components/assistente-edit-dialog'

export default function AssistentePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const assistenteId = parseInt(id)

  const [assistente, setAssistente] = useState<Assistente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    // Verificar se usuário é super admin
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/perfil')
        if (response.ok) {
          const data = await response.json()
          setIsSuperAdmin(data.isSuperAdmin || false)
        } else {
          setIsSuperAdmin(false)
        }
      } catch (err) {
        setIsSuperAdmin(false)
      }
    }

    checkPermissions()
  }, [])

  useEffect(() => {
    if (isNaN(assistenteId)) {
      setError('ID do assistente inválido')
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
        } else {
          setError('Erro ao carregar assistente')
        }
      } catch (err) {
        setError('Erro de conexão')
      } finally {
        setIsLoading(false)
      }
    }

    if (isSuperAdmin) {
      fetchAssistente()
    } else {
      setIsLoading(false)
    }
  }, [assistenteId, isSuperAdmin])

  // Sanitizar o código do iframe antes de renderizar
  const sanitizedIframeResult = useMemo(() => {
    if (!assistente?.iframe_code) {
      return { html: '', error: null }
    }
    try {
      const sanitized = sanitizarIframeCode(assistente.iframe_code)
      return { html: sanitized, error: null }
    } catch (err) {
      return {
        html: '',
        error: err instanceof Error ? err.message : 'Erro ao processar código do iframe',
      }
    }
  }, [assistente?.iframe_code])

  // Função para recarregar dados após edição
  const handleEditSuccess = async () => {
    try {
      const response = await fetch(`/api/assistentes/${assistenteId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAssistente(data.data)
        }
      }
    } catch {
      // Silently handle error
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!assistente) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>Assistente não encontrado</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/assistentes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{assistente.nome}</h1>
          <Badge variant={assistente.ativo ? 'default' : 'secondary'}>
            {assistente.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Informações do Assistente */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Assistente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <p className="text-sm text-muted-foreground">{assistente.nome}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <p className="text-sm text-muted-foreground">
              {truncarDescricao(assistente.descricao, 500) || 'Sem descrição'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data de Criação</label>
              <p className="text-sm text-muted-foreground">
                {formatarDataCriacao(assistente.created_at)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Última Atualização</label>
              <p className="text-sm text-muted-foreground">
                {formatarDataCriacao(assistente.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Iframe */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full" style={{ minHeight: '600px', height: '80vh' }}>
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: assistente.iframe_code }}
                className="w-full h-full"
                style={{ minHeight: '600px', height: '80vh' }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}