'use client';

/**
 * Dialog para criar nova sala de chat ou iniciar conversa privada
 * Usa padrão combobox com lista visível que filtra à medida que o usuário digita
 */

import * as React from 'react';
import { Loader2, Search, MessageSquare, Users, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string | null;
  emailCorporativo: string | null;
}

interface Sala {
  id: number;
  nome: string;
  tipo: 'privado' | 'grupo';
}

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalaCreated: (sala: Sala) => void;
  currentUserId: number;
}

type ModoChat = 'grupo' | 'privado';

export function CreateChatDialog({
  open,
  onOpenChange,
  onSalaCreated,
  currentUserId,
}: CreateChatDialogProps) {
  const [modo, setModo] = React.useState<ModoChat>('privado');
  const [nome, setNome] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Para modo privado - combobox pattern
  const [searchQuery, setSearchQuery] = React.useState('');
  const [allUsers, setAllUsers] = React.useState<Usuario[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<Usuario | null>(null);

  // Carregar todos os usuários quando o dialog abre
  React.useEffect(() => {
    if (open && modo === 'privado' && allUsers.length === 0) {
      loadAllUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, modo, allUsers.length]);

  // Resetar ao fechar
  React.useEffect(() => {
    if (!open) {
      setModo('privado');
      setNome('');
      setSearchQuery('');
      setSelectedUser(null);
      // Não limpa allUsers para cache
    }
  }, [open]);

  // Carregar todos os usuários disponíveis
  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      // Buscar todos os usuários ativos
      const response = await fetch('/api/usuarios/buscar?q=&limit=100');
      const data = await response.json();

      if (data.success) {
        // Filtrar o usuário atual
        setAllUsers(data.data.filter((u: Usuario) => u.id !== currentUserId));
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Filtrar usuários baseado na busca (client-side filtering)
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery.trim()) return allUsers;

    const termo = searchQuery.toLowerCase();
    return allUsers.filter((u) =>
      u.nomeCompleto.toLowerCase().includes(termo) ||
      (u.nomeExibicao && u.nomeExibicao.toLowerCase().includes(termo)) ||
      (u.emailCorporativo && u.emailCorporativo.toLowerCase().includes(termo))
    );
  }, [allUsers, searchQuery]);

  const handleCreate = async () => {
    if (modo === 'privado' && !selectedUser) {
      toast.error('Selecione um usuário para iniciar a conversa');
      return;
    }

    if (modo === 'grupo' && !nome.trim()) {
      toast.error('Digite um nome para o grupo');
      return;
    }

    setLoading(true);
    try {
      const nomeSala = modo === 'privado'
        ? (selectedUser!.nomeExibicao || selectedUser!.nomeCompleto)
        : nome.trim();

      const response = await fetch('/api/chat/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeSala,
          tipo: modo === 'privado' ? 'privado' : 'grupo',
          participante_id: modo === 'privado' ? selectedUser!.id : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar sala');
      }

      toast.success(modo === 'privado' ? 'Conversa iniciada' : 'Grupo criado');
      onSalaCreated(data.data);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Inicie uma conversa privada ou crie um grupo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seletor de modo */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setModo('privado')}
              className={`flex flex-col items-center justify-between rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                modo === 'privado' ? 'border-primary' : 'border-muted'
              }`}
            >
              <Users className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">Conversa Privada</span>
            </button>
            <button
              type="button"
              onClick={() => setModo('grupo')}
              className={`flex flex-col items-center justify-between rounded-md border-2 bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                modo === 'grupo' ? 'border-primary' : 'border-muted'
              }`}
            >
              <MessageSquare className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">Grupo</span>
            </button>
          </div>

          {/* Conteúdo baseado no modo */}
          {modo === 'privado' ? (
            <div className="space-y-3">
              <Label>Selecionar usuário</Label>

              {/* Usuário selecionado */}
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(selectedUser.nomeCompleto)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedUser.nomeExibicao || selectedUser.nomeCompleto}
                      </p>
                      {selectedUser.emailCorporativo && (
                        <p className="text-xs text-muted-foreground">
                          {selectedUser.emailCorporativo}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchQuery('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {/* Combobox: Search + List */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {usersLoading && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Lista de usuários (sempre visível) */}
                  <ScrollArea className="h-48 rounded-md border">
                    {usersLoading ? (
                      <div className="flex items-center justify-center h-full py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredUsers.map((usuario) => (
                          <button
                            key={usuario.id}
                            type="button"
                            className="flex w-full items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                            onClick={() => setSelectedUser(usuario)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(usuario.nomeCompleto)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {usuario.nomeExibicao || usuario.nomeCompleto}
                              </p>
                              {usuario.emailCorporativo && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {usuario.emailCorporativo}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="nome-grupo">Nome do Grupo</Label>
              <Input
                id="nome-grupo"
                placeholder="Ex: Equipe de Audiências"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || (modo === 'privado' && !selectedUser) || (modo === 'grupo' && !nome.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : modo === 'privado' ? (
              'Iniciar Conversa'
            ) : (
              'Criar Grupo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
