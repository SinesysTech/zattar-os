'use client';

/**
 * Página de Chat Interno Global
 * /chat - Permite acessar a Sala Geral e salas de documentos
 */

import * as React from 'react';
import {
  MessageSquare,
  Users,
  FileText,
  Globe,
  Search,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChatInterface } from '@/components/chat/chat-interface';
import { CreateChatDialog } from '@/components/chat/create-chat-dialog';
import { createClient } from '@/app/_lib/supabase/client';

interface SalaChat {
  id: number;
  nome: string;
  tipo: 'geral' | 'documento' | 'privado' | 'grupo';
  documento_id: number | null;
  participante_id: number | null;
  criado_por: number;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const supabase = createClient();

  const [salas, setSalas] = React.useState<SalaChat[]>([]);
  const [salaAtiva, setSalaAtiva] = React.useState<SalaChat | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [busca, setBusca] = React.useState('');
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');

  // Carregar usuário atual
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const response = await fetch('/api/perfil');
          const data = await response.json();

          if (data.success && data.data) {
            setCurrentUser(data.data);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }

    fetchUser();
  }, [supabase]);

  // Carregar salas de chat
  React.useEffect(() => {
    async function fetchSalas() {
      try {
        // Buscar Sala Geral primeiro
        const geralRes = await fetch('/api/chat/salas?modo=geral');
        const geralData = await geralRes.json();

        // Buscar todas as salas
        const salasRes = await fetch('/api/chat/salas?limit=50');
        const salasData = await salasRes.json();

        if (salasData.success) {
          const todasSalas = salasData.data as SalaChat[];

          // Ordenar: Geral primeiro, depois por data de criação
          const ordenadas = todasSalas.sort((a, b) => {
            if (a.tipo === 'geral') return -1;
            if (b.tipo === 'geral') return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          });

          setSalas(ordenadas);

          // Selecionar Sala Geral por padrão
          if (geralData.success && geralData.data) {
            setSalaAtiva(geralData.data);
          } else if (ordenadas.length > 0) {
            setSalaAtiva(ordenadas[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar salas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalas();
  }, []);

  const salasFiltradas = React.useMemo(() => {
    if (!busca.trim()) return salas;
    const termo = busca.toLowerCase();
    return salas.filter((sala) => sala.nome.toLowerCase().includes(termo));
  }, [salas, busca]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Globe className="h-4 w-4" />;
      case 'documento':
        return <FileText className="h-4 w-4" />;
      case 'privado':
        return <Users className="h-4 w-4" />;
      case 'grupo':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return null;
      case 'documento':
        return <Badge variant="outline" className="text-xs">Documento</Badge>;
      case 'grupo':
        return <Badge variant="outline" className="text-xs">Grupo</Badge>;
      case 'privado':
        // Não mostrar badge para conversas privadas - o nome já indica com quem é a conversa
        return null;
      default:
        return null;
    }
  };

  const handleSalaCreated = async (novaSala: SalaChat) => {
    try {
      const salasRes = await fetch('/api/chat/salas?limit=50');
      const salasData = await salasRes.json();
      if (salasData.success) {
        const todasSalas = salasData.data as SalaChat[];
        const ordenadas = todasSalas.sort((a, b) => {
          if (a.tipo === 'geral') return -1;
          if (b.tipo === 'geral') return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        setSalas(ordenadas);
        const criada = ordenadas.find((s) => s.id === novaSala.id) ?? ordenadas[0] ?? null;
        if (criada) setSalaAtiva(criada);
      } else {
        setSalas((prev) => [novaSala, ...prev]);
        setSalaAtiva(novaSala);
      }
    } catch {
      setSalas((prev) => [novaSala, ...prev]);
      setSalaAtiva(novaSala);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center px-6">
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="w-80 border-r p-4 space-y-4 h-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="flex-1 p-8 min-h-0">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Content */}
      <div className={cn('flex flex-1 h-full overflow-hidden rounded-xl border border-border shadow-sm')}> 
        {/* Sidebar - Lista de Salas */}
        <div className="w-80 border-r flex flex-col h-full">
          {/* Busca e Botão Nova Conversa */}
          <div className="p-4 border-b">
            <div className="-mx-4 px-4 pb-3 border-b border-border">
              <Button
                className="w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conversa
              </Button>
            </div>
            <div className="relative pt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar salas..."
                value={busca}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de Salas */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {salasFiltradas.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {busca ? 'Nenhuma sala encontrada' : 'Nenhuma sala disponível'}
                  </p>
                </div>
              ) : (
                salasFiltradas.map((sala) => (
                  <button
                    type="button"
                    key={sala.id}
                    onClick={() => setSalaAtiva(sala)}
                    className={cn(
                      'w-full text-left px-3 py-3 rounded-lg transition-colors',
                      'hover:bg-muted/50',
                      salaAtiva?.id === sala.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getTipoIcon(sala.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {sala.tipo === 'geral' ? 'Sala Geral' : sala.nome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getTipoBadge(sala.tipo)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {salaAtiva && currentUser ? (
            <>
            <ChatInterface
              salaId={salaAtiva.id}
              currentUserId={currentUser.id}
              currentUserName={currentUser.nomeCompleto || currentUser.nomeExibicao || 'Usuário'}
              showHeader={true}
              headerTitle={salaAtiva.tipo === 'geral' ? 'Sala Geral' : salaAtiva.nome}
              headerSubtitle={
                salaAtiva.tipo === 'geral'
                  ? 'Canal público do escritório'
                  : salaAtiva.tipo === 'documento'
                  ? 'Chat vinculado a documento'
                  : salaAtiva.tipo === 'grupo'
                  ? 'Grupo de conversa'
                  : undefined // Privado: sem subtitle, o nome já mostra com quem é a conversa
              }
              headerActions={(
                <div className="flex items-center gap-2">
                  {/* Excluir conversa */}
                  {((salaAtiva.tipo === 'grupo' && (currentUser.isSuperAdmin || salaAtiva.criado_por === currentUser.id)) ||
                    (salaAtiva.tipo === 'privado' && salaAtiva.criado_por === currentUser.id)) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Excluir
                    </Button>
                  )}

                  {/* Editar nome do grupo */}
                  {(salaAtiva.tipo === 'grupo' && (currentUser.isSuperAdmin || salaAtiva.criado_por === currentUser.id)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditName(salaAtiva.nome); setEditDialogOpen(true); }}
                    >
                      Editar nome
                    </Button>
                  )}
                </div>
              )}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Deseja excluir esta conversa?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/chat/salas/${salaAtiva.id}`, { method: 'DELETE' })
                        const json = await res.json()
                        if (json.success) {
                          setDeleteDialogOpen(false)
                          setSalas((prev) => prev.filter((s) => s.id !== salaAtiva.id))
                          const geral = salas.find((s) => s.tipo === 'geral') || null
                          const restante = salas.filter((s) => s.id !== salaAtiva.id)
                          setSalaAtiva(geral ?? restante[0] ?? null)
                        } else {
                          alert(json.error || 'Falha ao excluir a conversa')
                        }
                      } catch (e) {
                        alert('Erro ao excluir a conversa')
                      }
                    }}
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Renomear grupo</DialogTitle>
                  <DialogDescription>Defina um novo nome para o grupo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Input value={editName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)} />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={async () => {
                      const nome = editName.trim()
                      if (!nome) return
                      try {
                        const res = await fetch(`/api/chat/salas/${salaAtiva.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ nome })
                        })
                        const json = await res.json()
                        if (json.success) {
                          setSalas((prev) => prev.map((s) => s.id === salaAtiva.id ? { ...s, nome } as SalaChat : s))
                          setSalaAtiva((prev) => (prev ? { ...prev, nome } : prev))
                          setEditDialogOpen(false)
                        } else {
                          alert(json.error || 'Falha ao renomear grupo')
                        }
                      } catch (e) {
                        alert('Erro ao renomear grupo')
                      }
                    }}
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg">Selecione uma sala</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha uma sala na lista para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Nova Conversa */}
      {currentUser && (
        <CreateChatDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSalaCreated={handleSalaCreated}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
