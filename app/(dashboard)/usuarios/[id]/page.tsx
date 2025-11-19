'use client';

/**
 * Página de detalhes do usuário com matriz de permissões
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Pencil } from 'lucide-react';
import { UsuarioDadosBasicos } from '@/components/usuarios/usuario-dados-basicos';
import { PermissoesMatriz } from '@/components/usuarios/permissoes-matriz';
import { UsuarioEditDialog } from '@/components/usuarios/usuario-edit-dialog';
import { useUsuarioDetail, useUsuarioPermissoes } from '@/lib/hooks/use-usuario-detail';
import { usePermissoesMatriz } from '@/lib/hooks/use-permissoes-matriz';
import { useBreadcrumbOverride } from '@/components/breadcrumb-context';

interface UsuarioDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UsuarioDetailPage({ params }: UsuarioDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const usuarioId = parseInt(resolvedParams.id, 10);

  // Validar ID (apenas uma vez)
  useEffect(() => {
    if (isNaN(usuarioId) || usuarioId <= 0) {
      router.push('/usuarios');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Atualizar breadcrumb e título da página
  const displayName = usuario?.nomeExibicao || usuario?.nomeCompleto;
  useBreadcrumbOverride(`/usuarios/${usuarioId}`, displayName);

  useEffect(() => {
    if (displayName) {
      document.title = `${displayName} - Usuários - Sinesys`;
    } else {
      document.title = `Usuário #${usuarioId} - Usuários - Sinesys`;
    }
  }, [displayName, usuarioId]);

  // Estado para controlar o dialog de edição
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
    <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Botão de editar no canto superior direito */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar Usuário
          </Button>
        </div>

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

      {/* Dialog de edição */}
      <UsuarioEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        usuario={usuario}
        onSuccess={mutateUsuario}
      />
    </>
  );
}
