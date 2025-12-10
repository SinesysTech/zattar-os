
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, User, Shield, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Feature Components & Hooks
import {
  useUsuario,
  useUsuarioPermissoes,
  AvatarEditDialog,
  PermissoesMatriz,
  formatarCpf,
  formatarTelefone,
  formatarData,
  formatarGenero,
  getAvatarUrl,
  type Usuario
} from '@/features/usuarios';
import { actionAtualizarUsuario } from '@/features/usuarios/actions/usuarios-actions';
import { actionObterPerfil } from '@/features/perfil/actions/perfil-actions';

interface UsuarioDetalhesProps {
  id: number;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UsuarioDetalhes({ id }: UsuarioDetalhesProps) {
  const router = useRouter();
  
  // Usuario Data Hook
  const { usuario, isLoading: isLoadingUsuario, error: errorUsuario, refetch: refetchUsuario } = useUsuario(id);
  
  // Permissoes Hook
  const { 
    matriz, 
    isLoading: isLoadingPermissoes, 
    isSaving: isSavingPermissoes, 
    togglePermissao, 
    save: savePermissoes, 
    resetar,
    hasChanges 
  } = useUsuarioPermissoes(id);

  // States for UI
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [isSavingSuperAdmin, setIsSavingSuperAdmin] = useState(false);

  // Fetch logged user profile
  useEffect(() => {
    actionObterPerfil().then((res) => {
      if (res.success) {
        setUsuarioLogado(res.data);
      }
    });
  }, []);

  // Is Super Admin check local (for toggle)
  // We can trust `usuario.isSuperAdmin` from hook, but instant feedback needs local state or optimistic update?
  // `useUsuario` returns `usuario` which is state. We can update it via `refetchUsuario`.
  
  const salvarSuperAdmin = async (novoValor: boolean) => {
    if (!usuario || !usuarioLogado) return;

    if (usuario.id === usuarioLogado.id && !novoValor) {
      toast.error('Você não pode remover seu próprio status de Super Admin');
      return;
    }

    try {
      setIsSavingSuperAdmin(true);

      const result = await actionAtualizarUsuario(id, { isSuperAdmin: novoValor });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao alterar status de Super Admin');
      }

      toast.success(`Status de Super Admin ${novoValor ? 'ativado' : 'desativado'}`);
      
      // Refetch
      refetchUsuario();
      // Permissions might change implicitly? If super admin, permissions are all true conceptually but backend handles it.
      // But the permissions matrix might need reload if we show effective permissions. 
      // Our implementation shows saved permissions + alert if super admin.
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSavingSuperAdmin(false);
    }
  };

  const handleSavePermissoes = async () => {
    const success = await savePermissoes();
    if (success) {
      toast.success('Permissões atualizadas com sucesso');
    } else {
       toast.error('Erro ao salvar permissões');
    }
    return success;
  };

  const isLoading = isLoadingUsuario || isLoadingPermissoes;
  const error = errorUsuario;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        </div>
        <Card className="p-12">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-base font-medium">Carregando dados do usuário...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Usuário</h1>
        </div>
        <Card className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar usuário</AlertTitle>
            <AlertDescription>
              {error || 'Usuário não encontrado ou você não tem permissão para acessá-lo.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => router.push('/usuarios')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/usuarios')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          title="Voltar para Usuários"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {usuario.isSuperAdmin && (
          <Badge tone="danger" variant="solid" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin
          </Badge>
        )}
      </div>

      {/* Dados do Usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Dados do Usuário
            </CardTitle>
            <Badge tone={usuario.ativo ? 'success' : 'neutral'} variant="soft">
              {usuario.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Avatar e informações principais */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar clicável */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <Avatar className="h-20 w-20 border-2 border-muted">
                <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
                <AvatarFallback className="text-xl font-medium">
                  {getInitials(usuario.nomeExibicao)}
                </AvatarFallback>
              </Avatar>
              {/* Overlay de hover */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Nome e cargo */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold truncate">{usuario.nomeCompleto}</h2>
              <p className="text-sm text-muted-foreground">{usuario.nomeExibicao}</p>
              {usuario.cargo && (
                <Badge tone="neutral" variant="soft" className="mt-2">
                  {usuario.cargo.nome}
                </Badge>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
              <p className="text-sm">{usuario.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome de Exibição</p>
              <p className="text-sm">{usuario.nomeExibicao}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail Corporativo</p>
              <p className="text-sm">{usuario.emailCorporativo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">E-mail Pessoal</p>
              <p className="text-sm">{usuario.emailPessoal || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">CPF</p>
              <p className="text-sm">{formatarCpf(usuario.cpf)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">RG</p>
              <p className="text-sm">{usuario.rg || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
              <p className="text-sm">{formatarData(usuario.dataNascimento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gênero</p>
              <p className="text-sm">{formatarGenero(usuario.genero)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Telefone</p>
              <p className="text-sm">{formatarTelefone(usuario.telefone)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ramal</p>
              <p className="text-sm">{usuario.ramal || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OAB</p>
              <p className="text-sm">
                {usuario.oab && usuario.ufOab ? `${usuario.oab} / ${usuario.ufOab}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cargo</p>
              <p className="text-sm">{usuario.cargo ? usuario.cargo.nome : '-'}</p>
              {usuario.cargo?.descricao && (
                <p className="text-xs text-muted-foreground mt-0.5">{usuario.cargo.descricao}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança - Visível apenas para Super Admins */}
      {usuarioLogado?.isSuperAdmin && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Super Administrador</div>
                  <div className="text-sm text-muted-foreground">
                    Super Admins possuem acesso total ao sistema e bypassam todas as permissões.
                  </div>
                  {usuario.id === usuarioLogado.id && (
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                       Você não pode remover seu próprio status de Super Admin
                    </div>
                  )}
                </div>
                <Switch
                  checked={usuario.isSuperAdmin}
                  onCheckedChange={salvarSuperAdmin}
                  disabled={isSavingSuperAdmin || usuario.id === usuarioLogado.id}
                  aria-label="Marcar como Super Administrador"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Separator />

      {/* Matriz de Permissões */}
      <PermissoesMatriz
         matriz={matriz}
         isSuperAdmin={usuario.isSuperAdmin}
         hasChanges={hasChanges}
         isSaving={isSavingPermissoes}
         isLoading={isLoadingPermissoes}
         canEdit={!usuario.isSuperAdmin && (usuarioLogado?.podeGerenciarPermissoes || usuarioLogado?.isSuperAdmin || false)}
         onTogglePermissao={togglePermissao}
         onSalvar={handleSavePermissoes}
         onResetar={resetar}
      />

      {/* Dialog de Avatar */}
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        usuarioId={usuario.id}
        avatarUrl={getAvatarUrl(usuario.avatarUrl)}
        nomeExibicao={usuario.nomeExibicao}
        onSuccess={() => refetchUsuario()}
      />
    </div>
  );
}
