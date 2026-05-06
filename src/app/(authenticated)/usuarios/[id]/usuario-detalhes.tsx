'use client';

import { FORMAT } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import { LoadingSpinner } from "@/components/ui/loading-state"
// Design System
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { TabPills } from '@/components/dashboard/tab-pills';

// Feature Components & Hooks
import {
  useUsuario,
  useUsuarioPermissoes,
  AvatarEditDialog,
  CoverEditDialog,
  UsuarioEditDialog,
  RedefinirSenhaDialog,
  PermissoesMatriz,
  AuthLogsTimeline,
  AtividadesCards,
  AtividadesRecentes,
  formatarCpf,

  formatarData,
  formatarGenero,
  formatarEnderecoCompleto,
  getAvatarUrl,
  getCoverUrl,
  type Usuario,
  actionAtualizarUsuario,
  actionDesativarUsuario,
  actionBuscarUltimoLogin,
} from '@/app/(authenticated)/usuarios';

import { actionObterPerfil } from '@/app/(authenticated)/perfil';

// Detail components
import { ProfileSidebar } from '../components/detail/profile-sidebar';
import { ActivityHeatmap } from '../components/activities/activity-heatmap';

// ─── Types ───────────────────────────────────────────────────────────────────

// Extended Usuario type with permission flag
interface UsuarioComPermissao extends Usuario {
  podeGerenciarPermissoes?: boolean;
}

interface UsuarioDetalhesProps {
  id: number;
}

// ─── DataField ───────────────────────────────────────────────────────────────

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <Text variant="meta-label" className="uppercase tracking-wide text-muted-foreground">{label}</Text>
      <Text variant="body-sm">{value || '-'}</Text>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function UsuarioDetalhes({ id }: UsuarioDetalhesProps) {
  const router = useRouter();

  // Usuario Data Hook
  const { usuario, isLoading: isLoadingUsuario, error: errorUsuario, refetch: refetchUsuario } = useUsuario(id);

  // Permissoes Hook
  const {
    matriz,
    isLoading: isLoadingPermissoes,
    isSaving: isSavingPermissoes,
    error: erroPermissoes,
    togglePermissao,
    save: savePermissoes,
    resetar,
    hasChanges
  } = useUsuarioPermissoes(id);

  // UI States
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioComPermissao | null>(null);
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [redefinirSenhaOpen, setRedefinirSenhaOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [isSavingSuperAdmin, setIsSavingSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Fetch logged user profile
  useEffect(() => {
    actionObterPerfil().then((res) => {
      if (res.success && res.data) {
        setUsuarioLogado(res.data as UsuarioComPermissao);
      }
    });
  }, []);

  // Fetch last sign-in (alimenta status dot do sidebar)
  useEffect(() => {
    if (!usuario?.id) return;
    let cancelled = false;
    actionBuscarUltimoLogin(usuario.id).then((res) => {
      if (cancelled) return;
      if (res.success) setLastLoginAt(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [usuario?.id]);

  // Count active permissions for tab badge
  const totalPermissoesAtivas = useMemo(() => {
    if (!matriz) return undefined;
    let count = 0;
    for (const entry of matriz) {
      for (const val of Object.values(entry.operacoes)) {
        if (val) count++;
      }
    }
    return count > 0 ? count : undefined;
  }, [matriz]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

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
      refetchUsuario();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSavingSuperAdmin(false);
    }
  };


  const handleDeactivateUsuario = async () => {
    setIsDeactivating(true);
    try {
      if (!usuario) return;
      const result = await actionDesativarUsuario(usuario.id);
      if (result.sucesso) {
        toast.success('Usuário desativado com sucesso');
        setDeactivateDialogOpen(false);
        await refetchUsuario();
      } else {
        toast.error(result.erro || 'Erro ao desativar usuário');
      }
    } catch (_error) {
      toast.error('Erro ao desativar usuário');
    } finally {
      setIsDeactivating(false);
    }
  };


  const handleSavePermissoes = async () => {
    const success = await savePermissoes();
    if (success) {
      toast.success('Permissões atualizadas com sucesso');
    } else {
      toast.error(erroPermissoes || 'Erro ao salvar permissões');
    }
    return success;
  };

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoadingUsuario) {
    return (
      <div className={cn("flex flex-col py-8 stack-default")}>
        <div className={cn("flex items-center inline-tight-plus")}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Voltar"
            onClick={() => router.push('/app/usuarios')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="h-5 w-48 bg-muted/40 animate-pulse rounded" />
        </div>
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "inset-mega")}>
          <div className={cn("flex items-center justify-center inline-medium")}>
            <LoadingSpinner size="lg" className="text-primary" />
            <p className={cn("text-body-sm text-muted-foreground")}>Carregando dados do usuário...</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────

  if (errorUsuario || !usuario) {
    return (
      <div className={cn("flex flex-col py-8 stack-default")}>
        <div className={cn("flex items-center inline-tight-plus")}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Voltar"
            onClick={() => router.push('/app/usuarios')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Heading level="section">Usuário</Heading>
        </div>
        <GlassPanel depth={1} className={cn("flex flex-col inset-dialog stack-default")}>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Erro ao carregar usuário</AlertTitle>
            <AlertDescription>
              {errorUsuario || 'Usuário não encontrado ou você não tem permissão para acessá-lo.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/app/usuarios')} className={cn("flex inline-tight")}>
            <ArrowLeft className="size-4" />
            Voltar para Usuários
          </Button>
        </GlassPanel>
      </div>
    );
  }

  // ─── Main Layout ────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col py-8 stack-loose")}>
      {/* Two-column grid: sidebar (sticky) + content */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-[300px_1fr] inline-default items-start")}>

        {/* ── Left: ProfileSidebar ─────────────────────────────────────────── */}
        <ProfileSidebar
          usuario={usuario}
          lastLoginAt={lastLoginAt}
          onEditAvatar={() => setAvatarDialogOpen(true)}
          onEditCover={() => setCoverDialogOpen(true)}
          onEdit={() => setEditDialogOpen(true)}
          onResetPassword={() => setRedefinirSenhaOpen(true)}
          onDeactivate={() => setDeactivateDialogOpen(true)}
        />

        {/* ── Right: Breadcrumb + Tabs + Content ───────────────────────────── */}
        <div className={cn("flex flex-col stack-default min-w-0")}>

          {/* Breadcrumb */}
          <div className={cn("flex items-center inline-tight-plus")}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Voltar"
              onClick={() => router.push('/app/usuarios')}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className={cn("text-body-sm text-muted-foreground/50")}>
              <span
                className="hover:text-foreground cursor-pointer transition-colors"
                onClick={() => router.push('/app/usuarios')}
              >
                Usuários
              </span>
              <span className={cn("mx-1.5")}>/</span>
              <span className={cn( "text-foreground font-medium")}>{usuario.nomeCompleto}</span>
            </div>
          </div>

          {/* Tab navigation */}
          <TabPills
            tabs={[
              { id: 'visao-geral', label: 'Visão Geral' },
              { id: 'dados', label: 'Dados Cadastrais' },
              { id: 'atividades', label: 'Atividades' },
              { id: 'permissoes', label: 'Permissões', count: totalPermissoesAtivas },
              { id: 'seguranca', label: 'Segurança' },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          {/* ── Tab: Visão Geral ─────────────────────────────────────────── */}
          {activeTab === 'visao-geral' && (
            <div className={cn("flex flex-col stack-default")}>
              <AtividadesCards usuarioId={usuario.id} />
              <ActivityHeatmap data={[]} />
            </div>
          )}

          {/* ── Tab: Dados Cadastrais ────────────────────────────────────── */}
          {activeTab === 'dados' && (
            <GlassPanel depth={1} className={cn("inset-dialog")}>
              <div className={cn("flex items-center inline-tight mb-5")}>
                <User className="size-4 text-muted-foreground/50" />
                <Heading level="card">Informações Pessoais</Heading>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <DataField label="Nome Completo" value={usuario.nomeCompleto} />
                <DataField label="Nome de Exibição" value={usuario.nomeExibicao} />
                <DataField label="CPF" value={formatarCpf(usuario.cpf)} />
                <DataField label="RG" value={usuario.rg} />
                <DataField label="Data de Nascimento" value={formatarData(usuario.dataNascimento)} />
                <DataField label="Gênero" value={formatarGenero(usuario.genero)} />
                <DataField label="E-mail Corporativo" value={usuario.emailCorporativo} />
                <DataField label="E-mail Pessoal" value={usuario.emailPessoal} />
                <DataField label="Telefone" value={FORMAT.phone(usuario.telefone)} />
                <DataField label="Ramal" value={usuario.ramal} />
                <DataField
                  label="OAB"
                  value={usuario.oab && usuario.ufOab ? `${usuario.oab} / ${usuario.ufOab}` : null}
                />
                <div className="space-y-1">
                  <Text variant="meta-label" className="uppercase tracking-wide text-muted-foreground">Cargo</Text>
                  <Text variant="body-sm">{usuario.cargo ? usuario.cargo.nome : '-'}</Text>
                  {usuario.cargo?.descricao && (
                    <Text variant="caption" className="text-muted-foreground">{usuario.cargo.descricao}</Text>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <DataField label="Endereço" value={formatarEnderecoCompleto(usuario.endereco)} />
                </div>
              </div>
            </GlassPanel>
          )}

          {/* ── Tab: Atividades ──────────────────────────────────────────── */}
          {activeTab === 'atividades' && (
            <div className={cn("flex flex-col stack-default")}>
              <AtividadesCards usuarioId={usuario.id} />
              <AtividadesRecentes usuarioId={usuario.id} />
            </div>
          )}

          {/* ── Tab: Permissões ──────────────────────────────────────────── */}
          {activeTab === 'permissoes' && (
            <PermissoesMatriz
              matriz={matriz}
              isSuperAdmin={usuario.isSuperAdmin}
              hasChanges={hasChanges}
              isSaving={isSavingPermissoes}
              isLoading={isLoadingPermissoes}
              canEdit={
                !usuario.isSuperAdmin &&
                (usuarioLogado?.isSuperAdmin || usuarioLogado?.podeGerenciarPermissoes || false)
              }
              onTogglePermissao={togglePermissao}
              onSalvar={handleSavePermissoes}
              onResetar={resetar}
            />
          )}

          {/* ── Tab: Segurança ───────────────────────────────────────────── */}
          {activeTab === 'seguranca' && (
            <div className={cn("flex flex-col stack-default")}>
              {/* Credentials */}
              <GlassPanel depth={1} className={cn("inset-dialog")}>
                <Heading level="card" className="mb-4">Credenciais de Acesso</Heading>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <Text variant="label" className="font-medium">Redefinir Senha</Text>
                    <Text variant="body-sm" className="text-muted-foreground">
                      Define uma nova senha para o usuário selecionado.
                    </Text>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRedefinirSenhaOpen(true)}
                  >
                    Redefinir Senha
                  </Button>
                </div>
              </GlassPanel>

              {/* Auth Logs */}
              <AuthLogsTimeline usuarioId={usuario.id} />

              {/* Super Admin toggle — only for super admins */}
              {usuarioLogado?.isSuperAdmin && (
                <GlassPanel depth={1} className={cn("inset-dialog")}>
                  <div className={cn("flex items-center inline-tight mb-4")}>
                    <Shield className="size-4 text-muted-foreground/50" />
                    <Heading level="card">Configurações de Segurança</Heading>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border/20 rounded-xl">
                    <div className="space-y-0.5">
                      <Text variant="label" className="font-medium">Super Administrador</Text>
                      <Text variant="body-sm" className="text-muted-foreground">
                        Super Admins possuem acesso total ao sistema e bypassam todas as permissões.
                      </Text>
                      {usuario.id === usuarioLogado.id && (
                        <Text variant="caption" className="text-warning mt-2 block">
                          Você não pode remover seu próprio status de Super Admin
                        </Text>
                      )}
                    </div>
                    <Switch
                      checked={usuario.isSuperAdmin}
                      onCheckedChange={salvarSuperAdmin}
                      disabled={isSavingSuperAdmin || usuario.id === usuarioLogado.id}
                      aria-label="Marcar como Super Administrador"
                    />
                  </div>
                </GlassPanel>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}
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


      <RedefinirSenhaDialog
        open={redefinirSenhaOpen}
        onOpenChange={setRedefinirSenhaOpen}
        usuario={usuario}
        onSuccess={() => undefined}
      />

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o usuário <strong>{usuario.nomeCompleto}</strong>?
              Isso irá desatribuí-lo automaticamente de todos os processos, audiências, pendentes,
              expedientes e contratos atribuídos a ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeactivateUsuario();
              }}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? "Desativando..." : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
