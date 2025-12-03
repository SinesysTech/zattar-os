'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import FormSchemaBuilder from '@/components/formsign/schema-builder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DynamicFormSchema } from '@/types/formsign/form-schema.types';
import { FormsignFormulario } from '@/backend/types/formsign-admin/types';
import { useMinhasPermissoes } from '@/app/_lib/hooks/use-minhas-permissoes';

interface PageProps {
  params: { id: string };
}

/**
 * Creates a safe default schema when form_schema is null/undefined
 */
function createDefaultSchema(): DynamicFormSchema {
  return {
    id: `form-${Date.now()}`,
    version: '1.0.0',
    sections: [],
    globalValidations: [],
  };
}

/**
 * Normalizes form_schema to ensure a valid DynamicFormSchema
 */
function normalizeSchema(formSchema: unknown): DynamicFormSchema {
  if (!formSchema || typeof formSchema !== 'object') {
    return createDefaultSchema();
  }

  const schema = formSchema as Record<string, unknown>;

  // Validate required fields exist
  if (!schema.id || !schema.version || !Array.isArray(schema.sections)) {
    return createDefaultSchema();
  }

  return formSchema as DynamicFormSchema;
}

async function getFormulario(id: string): Promise<FormsignFormulario> {
  const response = await fetch(`/api/assinatura-digital/admin/formularios/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Formulário não encontrado.');
    if (response.status === 401) throw new Error('Sessão expirada. Redirecionando para login...');
    if (response.status === 403) throw new Error('Você não tem permissão para acessar este formulário.');
    throw new Error('Erro ao carregar formulário. Tente novamente.');
  }

  const result = await response.json();
  const formulario = result?.data ?? result;

  if (!formulario) {
    throw new Error('Resposta inválida do servidor.');
  }

  return formulario as FormsignFormulario;
}

export default function FormularioSchemaPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { temPermissao, isLoading: isLoadingPermissoes } = useMinhasPermissoes('formsign_admin');
  const canEdit = temPermissao('formsign_admin', 'editar');
  const [formulario, setFormulario] = useState<FormsignFormulario | null>(null);
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

    const fetchFormulario = async () => {
      try {
        if (!id || id === 'undefined' || id === 'null' || id === '') {
          throw new Error('ID de formulário inválido. Retorne à lista de formulários e tente novamente.');
        }

        setLoading(true);
        setError(null);
        const fetchedFormulario = await getFormulario(id);
        setFormulario(fetchedFormulario);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFormulario();
  }, [id, router, isLoadingPermissoes, canEdit]);

  const handleRetry = () => {
    setError(null);
    const fetchFormulario = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedFormulario = await getFormulario(id);
        setFormulario(fetchedFormulario);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          setTimeout(() => router.push('/auth/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFormulario();
  };

  if (loading || isLoadingPermissoes) {
    return (
      <div className="h-full flex flex-col gap-6">
        <div className="shrink-0 space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="flex-1 min-h-0 grid grid-cols-[250px_1fr_350px] gap-4">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-full w-full" />
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
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Acesso negado
            </h3>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para editar schemas de formulários.
            </p>
          </div>
          <Button onClick={() => router.push('/assinatura-digital/admin/formularios')} variant="outline">
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
              Erro ao carregar formulário
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

  if (!formulario) {
    return null;
  }

  // Normalize schema with defensive default
  const safeSchema = normalizeSchema(formulario.form_schema);

  return (
    <FormSchemaBuilder
      initialSchema={safeSchema}
      formularioNome={formulario.nome}
      onSave={async (schema) => {
        try {
          const response = await fetch(`/api/assinatura-digital/admin/formularios/${id}/schema`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(schema),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao salvar schema');
          }

          toast.success('Schema salvo com sucesso!');
          router.push('/assinatura-digital/admin/formularios');
        } catch (err: unknown) {
          const message = err instanceof Error
            ? err.message
            : 'Erro de rede ao salvar schema. Verifique sua conexão.';
          toast.error(message);
          throw new Error(message);
        }
      }}
      onCancel={() => router.push('/assinatura-digital/admin/formularios')}
    />
  );
}
