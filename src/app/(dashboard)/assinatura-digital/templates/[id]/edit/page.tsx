'use client';

/**
 * Template Editor Page - Integrado com Admin Layout
 *
 * REFATORAÇÃO COMPLETA (2025-01-10):
 * - Removido layout próprio (h-screen) para integração com AdminShell
 * - Estados de loading/error usando componentes Skeleton e design system
 * - Ícones e espaçamentos consistentes com padrão admin
 * - Responsividade mobile-first com grid system
 * - Tratamento de erros TypeScript-safe (unknown)
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { FieldMappingEditor, type Template } from '@/features/assinatura-digital';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasPermissoes } from '@/features/usuarios';

async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`/api/assinatura-digital/templates/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Template não encontrado.');
    if (response.status === 401) throw new Error('Sessão expirada. Redirecionando para login...');
    if (response.status === 403) throw new Error('Você não tem permissão para acessar este template.');
    throw new Error('Erro ao carregar template. Tente novamente.');
  }

  const result = await response.json();

  // Support both {success, data} and direct object shapes
  const template = result?.data ?? result;

  if (!template) {
    throw new Error('Resposta inválida do servidor.');
  }

  // Log para debug do template carregado
  console.log('[EDIT PAGE] Template carregado:', {
    id,
    templateId: template.id,
    templateUuid: template.template_uuid,
    nome: template.nome,
    hasCampos: template.campos !== undefined && template.campos !== null,
    camposType: typeof template.campos,
    camposLength: Array.isArray(template.campos) ? template.campos.length : 'not_array',
    camposSample: Array.isArray(template.campos) ? template.campos.slice(0, 2) : template.campos,
  });

  // Normalize campos array
  template.campos = template.campos || [];
  return template as Template;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes('assinatura_digital');
  const canEdit = temPermissao('assinatura_digital', 'editar');

  // Shared auth error handler for DRY
  const handleAuthError = () => setTimeout(() => router.push('/login'), 2000);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch while permissions are loading
    if (isLoadingPermissoes) {
      return;
    }

    // Skip fetch if user doesn't have edit permission
    if (!canEdit) {
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      try {
        // Log para debug do ID recebido
        console.log('[EDIT PAGE] Carregando template com ID:', {
          id,
          idType: typeof id,
          isUndefined: id === undefined,
          isNull: id === null,
          isEmpty: id === '',
          isString: typeof id === 'string',
        });

        // Validar ID antes de fazer a requisição
        if (!id || id === 'undefined' || id === 'null' || id === '') {
          throw new Error('ID de template inválido. Retorne à lista de templates e tente novamente.');
        }

        setLoading(true);
        setError(null);
        const fetchedTemplate = await getTemplate(id);
        setTemplate(fetchedTemplate);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router, isLoadingPermissoes, canEdit]);

  const handleRetry = () => {
    setError(null);
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTemplate = await getTemplate(id);
        setTemplate(fetchedTemplate);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  };

  if (loading || isLoadingPermissoes) {
    return (
      <div className="h-full flex flex-col gap-6">
        <div className="shrink-0 space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>

          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!isLoadingPermissoes && !canEdit) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Acesso negado
            </h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para editar templates.
            </p>
          </div>
          <Button onClick={() => router.push('/assinatura-digital/templates')} variant="outline">
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Erro ao carregar template
            </h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <FieldMappingEditor
      template={template}
      onCancel={() => router.push('/assinatura-digital/templates')}
    />
  );
}
