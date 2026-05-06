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
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { actionAtualizarAudienciaPayload } from '../actions';
import type { Audiencia } from '../domain';

// ─── Types ──────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
  ativo?: boolean;
}

interface AudienciaResponsavelPopoverProps {
  audienciaId: number;
  responsavelId: number | null | undefined;
  usuarios: Usuario[];
  onSuccess?: (audiencia?: Audiencia) => void;
  disabled?: boolean;
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
  disabled,
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
        onSuccess?.(result.data);
      }
      setIsPending(false);
    },
    [audienciaId, responsavelId, onSuccess],
  );

  return (
    <Popover open={open && !disabled} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          disabled={disabled}
          className={cn(
            'flex items-center inline-snug rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5',
            'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            !disabled && 'hover:bg-muted/50 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-70',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-60 p-0 rounded-2xl glass-dropdown overflow-hidden")}
        align={align}
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <Text variant="overline" as="p" className="text-muted-foreground/65 mb-2">
              Responsável
            </Text>
            <CommandInput
              placeholder="Buscar..."
              className={cn("h-8 text-caption rounded-lg")}
            />
          </div>
          <CommandList className={cn("max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <div className={cn("flex flex-col items-center inline-micro py-3")}>
                <Search className="size-4 text-muted-foreground/55" />
                <Text variant="caption" as="span" className="text-muted-foreground/65">Nenhum usuário encontrado</Text>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-responsavel"
                onSelect={() => handleSelect(null)}
                className={cn("inline-tight rounded-lg text-caption px-2 py-1.5")}
              >
                <UserX className="size-3.5 text-muted-foreground/65" />
                <span>Sem responsável</span>
                {!responsavel && (
                  <Check className="size-3 ml-auto text-primary" />
                )}
              </CommandItem>
              {usuarios.filter((u) => u.ativo !== false).map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={getUsuarioNome(usuario)}
                  onSelect={() => handleSelect(usuario.id)}
                  className={cn("inline-tight rounded-lg text-caption px-2 py-1.5")}
                >
                  <Avatar size="xs" className="border size-5">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="text-micro-badge">
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
  size?: 'xs' | 'sm' | 'md';
}) {
  const responsavel = responsavelId ? usuarios.find((u) => u.id === responsavelId) : null;
  const nome = responsavel ? getUsuarioNome(responsavel) : null;

  if (responsavel && nome) {
    return (
      <>
        <Avatar
          size="xs"
          className={cn(
            'shrink-0',
            size === 'xs' ? 'size-3' : size === 'sm' ? 'size-4' : 'size-7'
          )}
        >
          <AvatarImage src={responsavel.avatarUrl || undefined} alt={nome} />
          <AvatarFallback className="text-micro-badge">
            {getInitials(nome)}
          </AvatarFallback>
        </Avatar>
        <span className={cn(
          'truncate',
          size === 'xs'
            ? 'text-[9px] text-muted-foreground/75'
            : size === 'sm'
              ? 'text-micro-caption text-muted-foreground/75'
              :  'text-label font-medium text-foreground',
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
        size === 'xs' ? 'size-3' : size === 'sm' ? 'size-4' : 'size-7',
      )}>
        <User
          className={cn(
            'text-muted-foreground/65',
            size === 'xs' ? 'size-2' : size === 'sm' ? 'size-2.5' : 'size-3.5'
          )}
        />
      </div>
      <span className={cn(
        'italic',
        size === 'xs'
          ? 'text-micro-badge text-warning/60'
          : size === 'sm'
            ? 'text-micro-caption text-warning/60'
            : 'text-caption text-muted-foreground/75',
      )}>
        {size === 'xs' || size === 'sm' ? 'Sem resp.' : 'Clique para atribuir'}
      </span>
    </>
  );
}
