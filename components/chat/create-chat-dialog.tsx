'use client';

/**
 * Dialog para criar nova sala de chat ou iniciar conversa privada
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Usuario {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string | null;
  emailCorporativo: string | null;
}

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalaCreated: (sala: any) => void;
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

  // Para modo privado
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<Usuario | null>(null);

  // Resetar ao abrir/fechar
  React.useEffect(() => {
    if (!open) {
      setModo('privado');
      setNome('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
    }
  }, [open]);

  // Buscar usuários
  const searchUsers = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        // Filtrar o usuário atual
        setSearchResults(data.data.filter((u: Usuario) => u.id !== currentUserId));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [currentUserId]);

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && modo === 'privado') {
        searchUsers(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, modo, searchUsers]);

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
        ? `Conversa com ${selectedUser!.nomeExibicao || selectedUser!.nomeCompleto}`
        : nome.trim();

      const response = await fetch('/api/chat/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeSala,
          tipo: 'privado',
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
          <RadioGroup
            value={modo}
            onValueChange={(value) => setModo(value as ModoChat)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="privado"
                id="privado"
                className="peer sr-only"
              />
              <Label
                htmlFor="privado"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Users className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Conversa Privada</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="grupo"
                id="grupo"
                className="peer sr-only"
              />
              <Label
                htmlFor="grupo"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <MessageSquare className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Grupo</span>
              </Label>
            </div>
          </RadioGroup>

          {/* Conteúdo baseado no modo */}
          {modo === 'privado' ? (
            <div className="space-y-3">
              <Label>Selecionar usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  className="pl-9"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Resultados da busca */}
              {searchResults.length > 0 && !selectedUser && (
                <ScrollArea className="max-h-40 rounded-md border">
                  {searchResults.map((usuario) => (
                    <button
                      key={usuario.id}
                      type="button"
                      className="flex w-full items-center gap-3 p-3 hover:bg-accent text-left"
                      onClick={() => {
                        setSelectedUser(usuario);
                        setSearchResults([]);
                      }}
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
                </ScrollArea>
              )}

              {/* Usuário selecionado */}
              {selectedUser && (
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
