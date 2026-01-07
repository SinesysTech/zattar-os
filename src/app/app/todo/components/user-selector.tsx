"use client";

import * as React from "react";
import { Check, UserPlusIcon, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { actionListarUsuariosParaAtribuicao } from "../actions/todo-actions";
import type { TodoAssignee } from "../types";

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

interface UserSelectorProps {
  selectedUserIds: number[];
  onSelectionChange: (userIds: number[]) => void;
  error?: string;
}

export function UserSelector({
  selectedUserIds,
  onSelectionChange,
  error,
}: UserSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState<TodoAssignee[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorState, setErrorState] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (users.length > 0) return;

    setIsLoading(true);
    setErrorState(null);

    actionListarUsuariosParaAtribuicao({})
      .then((res) => {
        if (!res.success) {
          setErrorState(res.message || res.error || "Erro ao carregar usuários.");
          return;
        }
        setUsers(res.data as TodoAssignee[]);
      })
      .catch(() => {
        setErrorState("Erro ao carregar usuários.");
      })
      .finally(() => setIsLoading(false));
  }, [open, users.length]);

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));

  const handleToggleUser = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {selectedUsers.map((user) => {
          const src = getAvatarPublicUrl(user.avatarUrl);
          return (
            <Badge
              key={user.id}
              variant="outline"
              className="cursor-pointer gap-1 px-2 py-1"
              onClick={() => handleToggleUser(user.id)}
            >
              <Avatar className="size-4">
                <AvatarImage src={src} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {user.name}
              <X className="size-3" />
            </Badge>
          );
        })}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" type="button" className="w-full justify-start">
            <UserPlusIcon className="mr-2 size-4" />
            {selectedUsers.length > 0
              ? `${selectedUsers.length} usuário(s) selecionado(s)`
              : "Selecionar usuários"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar usuário..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Carregando usuários..." : "Nenhum usuário encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {errorState && (
                  <div className="px-2 pb-2 text-sm text-destructive" role="alert">
                    {errorState}
                  </div>
                )}
                {users.map((user) => {
                  const src = getAvatarPublicUrl(user.avatarUrl);
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      className="flex items-center p-2"
                      onSelect={() => handleToggleUser(user.id)}
                    >
                      <Avatar className="mr-2 size-8">
                        <AvatarImage src={src} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        {user.email ? (
                          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                        ) : null}
                      </div>
                      {isSelected ? (
                        <Check className="ml-auto flex size-5 text-primary" />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

