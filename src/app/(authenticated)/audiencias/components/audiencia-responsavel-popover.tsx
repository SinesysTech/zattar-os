'use client';

import * as React from 'react';
import { Check, Search, User, UserX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { actionAtualizarAudienciaPayload } from '../actions';

// ─── Types ──────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

interface AudienciaResponsavelPopoverProps {
  audienciaId: number;
  responsavelId: number | null | undefined;
  usuarios: Usuario[];
  onSuccess?: () => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

// ─── Component ──────────────────────────────────────────────────────────

export function AudienciaResponsavelPopover({
  audienciaId,
  responsavelId,
  usuarios,
  onSuccess,
  children,
  align = 'start',
}: AudienciaResponsavelPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const responsavel = React.useMemo(
    () => (responsavelId ? usuarios.find((u) => u.id === responsavelId) : null),
    [responsavelId, usuarios],
  );

  const handleSelect = React.useCallback(
    async (userId: number | null) => {
      if (userId === (responsavelId ?? null)) {
        setOpen(false);
        return;
      }

      setIsPending(true);
      setOpen(false);

      const result = await actionAtualizarAudienciaPayload(audienciaId, {
        responsavelId: userId,
      });

      if (result.success) {
        onSuccess?.();
      }
      setIsPending(false);
    },
    [audienciaId, responsavelId, onSuccess],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5',
            'transition-colors hover:bg-muted/50 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-0 rounded-2xl glass-dropdown overflow-hidden"
        align={align}
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
              Responsável
            </p>
            <CommandInput
              placeholder="Buscar..."
              className="h-8 text-xs rounded-lg"
            />
          </div>
          <CommandList className="max-h-52 px-1.5 pb-1.5">
            <CommandEmpty>
              <div className="flex flex-col items-center gap-1 py-3">
                <Search className="size-4 text-muted-foreground/30" />
                <span className="text-[11px] text-muted-foreground/40">Nenhum usuário encontrado</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-responsavel"
                onSelect={() => handleSelect(null)}
                className="gap-2 rounded-lg text-xs px-2 py-1.5"
              >
                <UserX className="size-3.5 text-muted-foreground/40" />
                <span>Sem responsável</span>
                {!responsavel && (
                  <Check className="size-3 ml-auto text-primary" />
                )}
              </CommandItem>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={getUsuarioNome(usuario)}
                  onSelect={() => handleSelect(usuario.id)}
                  className="gap-2 rounded-lg text-xs px-2 py-1.5"
                >
                  <Avatar size="xs" className="border size-5">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="text-[7px]">
                      {getInitials(getUsuarioNome(usuario))}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getUsuarioNome(usuario)}</span>
                  {responsavel?.id === usuario.id && (
                    <Check className="size-3 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Trigger helpers (para uso consistente nos cards/dialogs) ────────────

/** Renderiza avatar + nome ou placeholder "Sem resp." */
export function ResponsavelTriggerContent({
  responsavelId,
  usuarios,
  size = 'sm',
}: {
  responsavelId: number | null | undefined;
  usuarios: Usuario[];
  size?: 'sm' | 'md';
}) {
  const responsavel = responsavelId ? usuarios.find((u) => u.id === responsavelId) : null;
  const nome = responsavel ? getUsuarioNome(responsavel) : null;

  if (responsavel && nome) {
    return (
      <>
        <Avatar size="xs" className={cn('shrink-0', size === 'sm' ? 'size-4' : 'size-7')}>
          <AvatarImage src={responsavel.avatarUrl || undefined} alt={nome} />
          <AvatarFallback className={size === 'sm' ? 'text-[6px]' : 'text-[9px]'}>
            {getInitials(nome)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(
          'truncate',
          size === 'sm' ? 'text-[9px] text-muted-foreground/55' : 'text-[13.5px] font-medium text-foreground',
        )}>
          {nome}
        </span>
      </>
    );
  }

  return (
    <>
      <div className={cn(
        'rounded-full bg-muted/40 flex items-center justify-center shrink-0',
        size === 'sm' ? 'size-4' : 'size-7',
      )}>
        <User className={cn('text-muted-foreground/40', size === 'sm' ? 'size-2.5' : 'size-3.5')} />
      </div>
      <span className={cn(
        'italic',
        size === 'sm' ? 'text-[9px] text-warning/60' : 'text-caption text-muted-foreground/50',
      )}>
        {size === 'sm' ? 'Sem resp.' : 'Clique para atribuir'}
      </span>
    </>
  );
}
