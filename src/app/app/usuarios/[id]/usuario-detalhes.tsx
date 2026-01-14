
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, User, Shield, Camera, Image as ImageIcon, Calendar, Clock, Key, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';
import { toast } from 'sonner';

// Feature Components & Hooks
import {
  useUsuario,
  useUsuarioPermissoes,
  AvatarEditDialog,
  CoverEditDialog,
  UsuarioEditDialog,
  PermissoesMatriz,
  AuthLogsTimeline,
  AtividadesCards,
  AtividadesRecentes,
  formatarCpf,
  formatarTelefone,
  formatarData,
  formatarGenero,
  formatarEnderecoCompleto,
  getAvatarUrl,
  getCoverUrl,
  type Usuario
} from '@/features/usuarios';
import { actionAtualizarUsuario } from '@/features/usuarios';
import { actionObterPerfil } from '@/features/perfil';

// Extended Usuario type with permission flag
interface UsuarioComPermissao extends Usuario {
  podeGerenciarPermissoes?: boolean;
}

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

function formatarDataCadastro(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioComPermissao | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSavingSuperAdmin, setIsSavingSuperAdmin] = useState(false);

  // Fetch logged user profile
  useEffect(() => {
    actionObterPerfil().then((res) => {
      if (res.success && res.data) {
        setUsuarioLogado(res.data as UsuarioComPermissao);
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
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/usuarios')}>
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
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/usuarios')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Typography.H1>Usuário</Typography.H1>
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
            <Button onClick={() => router.push('/app/usuarios')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Usuários
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-400">
      {/* Header com Banner/Capa */}
      <Card className="overflow-hidden p-0">
        {/* Banner/Capa */}
        <div className="relative h-48 bg-linear-to-r from-blue-500/20 to-purple-500/20">
          {usuario.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getCoverUrl(usuario.coverUrl) || undefined}
              alt="Capa do perfil"
              className="w-full h-full object-cover"
            />
          )}
          {/* Botões de ação */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              Editar Usuário
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={() => setCoverDialogOpen(true)}
            >
              <ImageIcon className="h-4 w-4" />
              Editar Capa
            </Button>
          </div>
          {/* Botão voltar */}
          <button
            type="button"
            onClick={() => router.push('/app/usuarios')}
            className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
            title="Voltar para Usuários"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Avatar e Info Principal */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-6 -mt-12">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
                <AvatarFallback className="text-2xl font-medium">
                  {getInitials(usuario.nomeExibicao)}
                </AvatarFallback>
              </Avatar>
              {/* Overlay de hover */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Nome e Badges */}
            <div className="flex-1 min-w-0 pt-4">
              <Typography.H1 className="truncate">{usuario.nomeCompleto}</Typography.H1>
              <p className="text-muted-foreground">{usuario.emailCorporativo}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {usuario.cargo && (
                  <Badge variant="outline">{usuario.cargo.nome}</Badge>
                )}
                {usuario.isSuperAdmin && (
                  <Badge variant="destructive" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Super Admin
                  </Badge>
                )}
                <Badge variant={usuario.ativo ? 'success' : 'outline'}>
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {/* Metadados do usuário */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Cadastro: {formatarDataCadastro(usuario.createdAt)}</span>
                </div>
                {usuario.updatedAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Atualizado: {formatarDataCadastro(usuario.updatedAt)}</span>
                  </div>
                )}
                {usuarioLogado?.isSuperAdmin && usuario.authUserId && (
                  <div className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    <span title="Auth User ID" className="font-mono text-[10px]">
                      {usuario.authUserId.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs com conteúdo organizado */}
      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          {/* Cards de Estatísticas */}
          <AtividadesCards usuarioId={usuario.id} />

          {/* Timeline de Atividades Recentes */}
          <AtividadesRecentes usuarioId={usuario.id} />
        </TabsContent>

        {/* Tab: Dados Cadastrais */}
        <TabsContent value="dados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  <p className="text-sm font-medium text-muted-foreground">E-mail Corporativo</p>
                  <p className="text-sm">{usuario.emailCorporativo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-mail Pessoal</p>
                  <p className="text-sm">{usuario.emailPessoal || '-'}</p>
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
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                  <p className="text-sm">{formatarEnderecoCompleto(usuario.endereco)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Atividades */}
        <TabsContent value="atividades" className="space-y-6">
          {/* Cards de estatísticas (resumo) */}
          <AtividadesCards usuarioId={usuario.id} />

          {/* Timeline de atividades */}
          <AtividadesRecentes usuarioId={usuario.id} />

          {/* Nota: Tabelas detalhadas de processos, audiências, pendentes e contratos
              serão implementadas quando o sistema de auditoria estiver disponível */}
        </TabsContent>

        {/* Tab: Permissões */}
        <TabsContent value="permissoes" className="space-y-6">
          <PermissoesMatriz
            matriz={matriz}
            isSuperAdmin={usuario.isSuperAdmin}
            hasChanges={hasChanges}
            isSaving={isSavingPermissoes}
            isLoading={isLoadingPermissoes}
            canEdit={!usuario.isSuperAdmin && (usuarioLogado?.isSuperAdmin || usuarioLogado?.podeGerenciarPermissoes || false)}
            onTogglePermissao={togglePermissao}
            onSalvar={handleSavePermissoes}
            onResetar={resetar}
          />
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          {/* Logs de Autenticação */}
          <AuthLogsTimeline usuarioId={usuario.id} />

          {/* Configurações de Segurança - Visível apenas para Super Admins */}
          {usuarioLogado?.isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
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
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AvatarEditDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        usuarioId={usuario.id}
        avatarUrl={getAvatarUrl(usuario.avatarUrl)}
        nomeExibicao={usuario.nomeExibicao}
        onSuccess={() => refetchUsuario()}
      />

      <CoverEditDialog
        open={coverDialogOpen}
        onOpenChange={setCoverDialogOpen}
        usuarioId={usuario.id}
        coverUrl={getCoverUrl(usuario.coverUrl)}
        onSuccess={() => refetchUsuario()}
      />

      <UsuarioEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        usuario={usuario}
        onSuccess={() => refetchUsuario()}
      />
    </div>
  );
}
