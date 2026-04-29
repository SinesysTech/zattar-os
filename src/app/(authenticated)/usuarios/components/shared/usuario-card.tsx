'use client';

import * as React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import { AppBadge } from '@/components/ui/app-badge';
import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab } from '../../utils';
import { RoleBanner } from './role-banner';
import { UserStatusDot, getStatusFromLastLogin } from './user-status-dot';
import { UserCompletenessRing } from './user-completeness-ring';
import {
  calcularCompleteness,
  getCompletenessColor,
} from './completeness-utils';
import type { Usuario } from '../../domain';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UsuarioCardProps {
  usuario: Usuario;
  lastLoginAt?: string | null;
  stats?: { processos: number; audiencias: number; pendentes: number };
  onView: (usuario: Usuario) => void;
}

export function UsuarioCard({
  usuario,
  lastLoginAt,
  stats,
  onView,
}: UsuarioCardProps) {
  const cargoNome = usuario.cargo?.nome;
  const cargoNomeLower = cargoNome?.toLowerCase().trim() ?? '';
  const isAtivo = usuario.ativo !== false;

  const { score } = calcularCompleteness(usuario);
  const completenessColor = getCompletenessColor(score);

  const completenessTextColor =
    completenessColor === 'success'
      ? 'text-success'
      : completenessColor === 'warning'
        ? 'text-warning'
        : 'text-destructive';

  const status = getStatusFromLastLogin(lastLoginAt ?? null);

  const temOab = Boolean(usuario.oab?.trim());
  const isCargoComOab =
    cargoNomeLower === 'advogado' ||
    cargoNomeLower === 'advogada' ||
    cargoNomeLower === 'diretor';
  const deveExibirOab = isCargoComOab && temOab;

  const avatarSize = 52;
  const ringSize = 60;

  return (
    <GlassPanel
      depth={1}
      className={cn(
        'relative overflow-hidden cursor-pointer flex flex-col transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-lg hover:border-border/30',
        !isAtivo && 'opacity-55',
      )}
      role="button"
      tabIndex={0}
      onClick={() => onView(usuario)}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(usuario);
        }
      }}
    >
      {/* Role Banner */}
      <RoleBanner cargoNome={cargoNome} inactive={!isAtivo} height="h-14" />

      {/* Inactive badge */}
      {!isAtivo && (
        <AppBadge
          variant="destructive"
          tone="soft"
          size="sm"
          className="absolute top-2 right-2 backdrop-blur-sm"
        >
          Inativo
        </AppBadge>
      )}

      {/* Completeness % badge — only when active */}
      {isAtivo && (
        <span className={cn('absolute top-1 right-3 text-[9px] font-semibold', completenessTextColor)}>
          {score}%
        </span>
      )}

      {/* Avatar area — overlaps banner */}
      <div className="px-4 -mt-7 relative">
        {/* Completeness ring + avatar wrapper */}
        <div className="relative inline-block" style={{ width: ringSize, height: ringSize }}>
          <UserCompletenessRing score={score} size={ringSize} strokeWidth={2} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar
              style={{
                width: avatarSize,
                height: avatarSize,
                borderWidth: 3,
                margin: 4,
              }}
              className="border-background shrink-0"
            >
              <AvatarImage
                src={getAvatarUrl(usuario.avatarUrl) || undefined}
                alt={usuario.nomeExibicao ?? usuario.nomeCompleto}
              />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(usuario.nomeExibicao ?? usuario.nomeCompleto ?? '')}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Status dot */}
          <UserStatusDot
            status={status}
            size="sm"
            className="absolute bottom-0.5 right-0.5"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-3 pt-2 flex flex-col gap-1 flex-1">
        {/* Name + SuperAdmin icon */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold truncate leading-tight">
            {usuario.nomeCompleto}
          </span>
          {usuario.isSuperAdmin && (
            <ShieldAlert className="size-3.5 text-destructive shrink-0" />
          )}
        </div>

        {/* Email */}
        <Text variant="caption" as="span" className="text-muted-foreground/40 truncate leading-tight">
          {usuario.emailCorporativo}
        </Text>

        {/* Role + OAB badges */}
        <div className="flex flex-row gap-1.5 mt-2 flex-wrap">
          {cargoNome && (
            <AppBadge variant="secondary" tone="soft" size="sm">{cargoNome}</AppBadge>
          )}
          {deveExibirOab && (
            <AppBadge variant="info" tone="soft" size="sm">
              {formatarOab(usuario.oab, usuario.ufOab)}
            </AppBadge>
          )}
        </div>

        {/* Stats row */}
        {stats && (
          <div className="flex gap-1.5 border-t border-border/10 pt-2.5 mt-2.5">
            {(
              [
                { label: 'Processos', value: stats.processos },
                { label: 'Audiências', value: stats.audiencias },
                { label: 'Pendentes', value: stats.pendentes },
              ] as const
            ).map(({ label, value }) => (
              <div key={label} className="flex-1 text-center">
                <div className="text-sm font-bold tabular-nums leading-tight">
                  {isAtivo ? value : '—'}
                </div>
                <div className="text-[8px] uppercase tracking-wider text-muted-foreground/35 leading-tight">
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
