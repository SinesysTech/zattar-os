"use client";

import * as React from "react";
import { Check, UserPlusIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { actionListarUsuariosKanban } from "../actions/kanban-actions";

type User = {
  id: number;
  name: string;
  email?: string;
  avatarUrl?: string;
};

function getAvatarPublicUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";
  return `${supabaseUrl}/storage/v1/object/public/avatar/${avatarPath}`;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AddAssigne() {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    if (!open) return;
    if (users.length > 0) return;

    setIsLoading(true);
    setError(null);

    actionListarUsuariosKanban({})
      .then((res) => {
        if (!res.success) {
          setError(res.message || res.error || "Erro ao carregar usuários.");
          return;
        }
        setUsers(res.data as User[]);
      })
      .catch(() => {
        setError("Erro ao carregar usuários.");
      })
      .finally(() => setIsLoading(false));
  }, [open, users.length]);

  const headerUsers = selectedUsers.length > 0 ? selectedUsers : users.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        {headerUsers.length > 0 && (
          <div className="flex -space-x-2 overflow-hidden">
            {headerUsers.map((u) => {
              const src = getAvatarPublicUrl(u.avatarUrl);
              return (
                <Avatar key={u.id} className="border-background border-2">
                  <AvatarImage src={src} alt={u.name} />
                  <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                </Avatar>
              );
            })}
            {users.length > 3 && selectedUsers.length === 0 && (
              <Avatar className="border-background border-2">
                <AvatarFallback className="text-xs">{`+${users.length - 3}`}</AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20"
          >
            <UserPlusIcon />
            <span className="hidden lg:inline">Atribuir</span>
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="gap-0 p-0 outline-hidden">
        <DialogHeader className="px-4 pt-5 pb-4">
          <DialogTitle>Atribuir usuários</DialogTitle>
        </DialogHeader>
        <Command className="overflow-hidden rounded-t-none border-t">
          <CommandInput placeholder="Buscar usuário..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Carregando usuários..." : "Nenhum usuário encontrado."}
            </CommandEmpty>
            <CommandGroup className="p-2">
              {error && (
                <div className="px-2 pb-2 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  className="flex items-center p-2"
                  onSelect={() => {
                    if (selectedUsers.includes(user)) {
                      return setSelectedUsers(
                        selectedUsers.filter((selectedUser) => selectedUser !== user)
                      );
                    }

                    return setSelectedUsers(
                      [...users].filter((u) => [...selectedUsers, user].includes(u))
                    );
                  }}>
                  <Avatar>
                    <AvatarImage src={getAvatarPublicUrl(user.avatarUrl)} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-sm leading-none font-medium">{user.name}</p>
                    {user.email ? (
                      <p className="text-muted-foreground text-sm">{user.email}</p>
                    ) : null}
                  </div>
                  {selectedUsers.includes(user) ? (
                    <Check className="text-primary ml-auto flex h-5 w-5" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter className="flex items-center border-t p-4 sm:justify-between">
          {selectedUsers.length > 0 ? (
            <div className="flex -space-x-2 overflow-hidden">
              {selectedUsers.map((user) => (
                <Avatar key={user.id} className="border-background inline-block border-2">
                  <AvatarImage src={getAvatarPublicUrl(user.avatarUrl)} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Selecione usuários para atribuir.
            </p>
          )}
          <Button
            disabled={selectedUsers.length < 1}
            onClick={() => {
              setOpen(false);
            }}>
            Atribuir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
