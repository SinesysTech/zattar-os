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

  const handleSalaCreated = (novaSala: SalaChat) => {
    setSalas((prev) => [novaSala, ...prev]);
    setSalaAtiva(novaSala);
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center px-6">
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="flex flex-1">
          <div className="w-80 border-r p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista de Salas */}
        <div className="w-80 border-r flex flex-col">
          {/* Busca e Botão Nova Conversa */}
          <div className="p-4 border-b space-y-3">
            <Button
              className="w-full"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Conversa
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar salas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
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
                            {sala.tipo === 'geral' ? 'ABED Geral' : sala.nome}
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
        <div className="flex-1 flex flex-col">
          {salaAtiva && currentUser ? (
            <ChatInterface
              salaId={salaAtiva.id}
              currentUserId={currentUser.id}
              currentUserName={currentUser.nomeCompleto || currentUser.nomeExibicao || 'Usuário'}
              showHeader={true}
              headerTitle={salaAtiva.tipo === 'geral' ? 'ABED Geral' : salaAtiva.nome}
              headerSubtitle={
                salaAtiva.tipo === 'geral'
                  ? 'Canal público do escritório'
                  : salaAtiva.tipo === 'documento'
                  ? 'Chat vinculado a documento'
                  : salaAtiva.tipo === 'grupo'
                  ? 'Grupo de conversa'
                  : undefined // Privado: sem subtitle, o nome já mostra com quem é a conversa
              }
            />
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
