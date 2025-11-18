'use client';

/**
 * Página de detalhes do usuário com matriz de permissões
 */

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { UsuarioDadosBasicos } from '@/components/usuarios/usuario-dados-basicos';
import { PermissoesMatriz } from '@/components/usuarios/permissoes-matriz';
import { useUsuarioDetail, useUsuarioPermissoes } from '@/lib/hooks/use-usuario-detail';
import { usePermissoesMatriz } from '@/lib/hooks/use-permissoes-matriz';

interface UsuarioDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UsuarioDetailPage({ params }: UsuarioDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const usuarioId = parseInt(resolvedParams.id, 10);

  // Validar ID
  useEffect(() => {
    if (isNaN(usuarioId) || usuarioId <= 0) {
      router.push('/usuarios');
    }
  }, [usuarioId, router]);

  // Fetch dados do usuário
  const {
    usuario,
    isLoading: isLoadingUsuario,
    error: errorUsuario,
    mutate: mutateUsuario,
  } = useUsuarioDetail(usuarioId);

  // Fetch permissões
  const {
    permissoes,
    isSuperAdmin,
    isLoading: isLoadingPermissoes,
    error: errorPermissoes,
    mutate: mutatePermissoes,
  } = useUsuarioPermissoes(usuarioId);

  // Hook para gerenciar matriz
  const {
    matriz,
    togglePermissao,
    salvarPermissoes,
    resetarMudancas,
    hasChanges,
    isSaving,
  } = usePermissoesMatriz({
    usuarioId,
    permissoes,
    isSuperAdmin,
    onMutate: () => {
      mutatePermissoes();
      mutateUsuario();
    },
  });

  // TODO: Verificar permissão do usuário logado (usuarios.visualizar e usuarios.gerenciar_permissoes)
  // Por enquanto, permitindo edição sempre
  const canEdit = true;

  // Loading state
  if (isLoadingUsuario) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state - usuário não encontrado
  if (errorUsuario || !usuario) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Voltar para usuários
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorUsuario
              ? 'Erro ao carregar dados do usuário. Tente novamente.'
              : 'Usuário não encontrado.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/usuarios" className="hover:text-foreground transition-colors">
          Usuários
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{usuario.nomeExibicao}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{usuario.nomeExibicao}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/usuarios">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Dados básicos */}
      <UsuarioDadosBasicos usuario={usuario} />

      <Separator />

      {/* Matriz de permissões */}
      {errorPermissoes ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar permissões. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      ) : (
        <PermissoesMatriz
          matriz={matriz}
          isSuperAdmin={isSuperAdmin}
          hasChanges={hasChanges}
          isSaving={isSaving}
          isLoading={isLoadingPermissoes}
          canEdit={canEdit}
          onTogglePermissao={togglePermissao}
          onSalvar={salvarPermissoes}
          onResetar={resetarMudancas}
        />
      )}
    </div>
  );
}
