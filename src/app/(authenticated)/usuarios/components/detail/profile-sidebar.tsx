'use client';

import * as React from 'react';
import { Mail, Phone, Building, Calendar, RefreshCw, Pencil, KeyRound, Power, Camera, Check, Circle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAvatarUrl, getCoverUrl, formatarOab, formatarData } from '../../utils';
import { RoleBanner } from '../shared/role-banner';
import { UserStatusDot, getStatusFromLastLogin } from '../shared/user-status-dot';
import { UserCompletenessRing } from '../shared/user-completeness-ring';
import { calcularCompleteness, getCompletenessColor } from '../shared/completeness-utils';
import type { Usuario } from '../../domain';

interface ProfileSidebarProps {
  usuario: Usuario;
  lastLoginAt?: string | null;
  onEditAvatar: () => void;
  onEditCover: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onDeactivate: () => void;
}

function getInitials(nomeCompleto: string): string {
  const parts = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const COMPLETENESS_CSS = {
  success: { text: 'text-success', fill: 'bg-success', check: 'text-success line-through' },
  warning: { text: 'text-warning', fill: 'bg-warning', check: 'text-warning line-through' },
  destructive: { text: 'text-destructive', fill: 'bg-destructive', check: 'text-destructive line-through' },
} as const;

export function ProfileSidebar({
  usuario,
  lastLoginAt,
  onEditAvatar,
  onEditCover,
  onEdit,
  onResetPassword,
  onDeactivate,
}: ProfileSidebarProps) {
  const status = getStatusFromLastLogin(lastLoginAt ?? null);
  const completeness = calcularCompleteness(usuario);
  const colorKey = getCompletenessColor(completeness.score);
  const colorCss = COMPLETENESS_CSS[colorKey];

  const avatarUrl = getAvatarUrl(usuario.avatarUrl);
  const initials = getInitials(usuario.nomeCompleto);

  const contactItems = [
    { icon: Mail, value: usuario.emailCorporativo },
    { icon: Phone, value: usuario.telefone },
    { icon: Building, value: usuario.ramal },
    { icon: Calendar, value: formatarData(usuario.createdAt), label: 'Criado em' },
    { icon: RefreshCw, value: formatarData(usuario.updatedAt), label: 'Atualizado em' },
  ].filter((item) => item.value && item.value !== '-');

  return (
    <GlassPanel
      depth={1}
      className={cn(/* design-system-escape: p-0 → usar <Inset> */ "overflow-hidden sticky top-6 self-start inset-none")}
    >
      {/* 1. Cover area */}
      <div className="relative">
        <RoleBanner
          cargoNome={usuario.cargo?.nome}
          coverUrl={getCoverUrl(usuario.coverUrl)}
          inactive={!usuario.ativo}
          height="h-[100px]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={onEditCover}
          className={cn("flex absolute top-2 right-2 h-7 px-2 inline-micro text-[11px] bg-black/30 backdrop-blur-sm border-foreground/10 text-white/70 hover:bg-black/50 hover:text-white/90")}
        >
          <Camera className="size-3" />
          Editar
        </Button>
      </div>

      {/* 2. Avatar section */}
      <div className={cn("flex flex-col items-center -mt-11 px-5 relative z-2")}>
        <div
          className="group relative cursor-pointer"
          onClick={onEditAvatar}
          style={{ width: 100, height: 100 }}
        >
          {/* Completeness ring wraps the avatar */}
          <UserCompletenessRing
            score={completeness.score}
            size={100}
            strokeWidth={2.5}
          />
          <Avatar
            className={cn("border-4 border-background m-1.5")}
            style={{ width: 88, height: 88 }}
          >
            {avatarUrl && <AvatarImage src={avatarUrl} alt={usuario.nomeCompleto} />}
            <AvatarFallback className={cn( "text-body-lg font-semibold")}>{initials}</AvatarFallback>
          </Avatar>
          {/* Hover overlay */}
          <span className="absolute inset-1.5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <Camera className="size-4 text-white" />
          </span>
          {/* Status dot */}
          <UserStatusDot
            status={status}
            size="lg"
            className="absolute bottom-1 right-1 border-background"
          />
        </div>

        {/* 3. Name + Role */}
        <Heading level="section" className="text-lg font-bold mt-3 text-center">{usuario.nomeCompleto}</Heading>
        {usuario.cargo?.nome && (
          <Text variant="caption" className="text-muted-foreground/40 mt-0.5 text-center">{usuario.cargo.nome}</Text>
        )}

        {/* 4. Badges row */}
        <div className={cn("flex inline-snug mt-2.5 flex-wrap justify-center")}>
          <Badge variant={usuario.ativo ? 'success' : 'outline'} tone="soft">
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
          {usuario.isSuperAdmin && (
            <Badge variant="destructive" tone="soft">
              Super Admin
            </Badge>
          )}
          {usuario.oab && usuario.ufOab && (
            <Badge variant="info" tone="soft">
              OAB {formatarOab(usuario.oab, usuario.ufOab)}
            </Badge>
          )}
        </div>
      </div>

      {/* 5. Contacts section */}
      {contactItems.length > 0 && (
        <div className={cn(/* design-system-escape: px-5 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "flex flex-col px-5 py-4 mt-4 border-t border-border/10 stack-tight-plus")}>
          {contactItems.map(({ icon: Icon, value, label }, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <Icon className="size-3.5 text-muted-foreground/35 shrink-0" />
              <Text
                variant="caption"
                as="span"
                className="text-muted-foreground/55 truncate"
                title={label ? `${label}: ${value}` : String(value)}
              >
                {label ? `${label}: ${value}` : value}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* 6. Completeness section */}
      <div className={cn("px-5 py-3 border-t border-border/10")}>
        <div className="flex justify-between items-center mb-1.5">
          <Text variant="meta-label" className="text-muted-foreground/40 uppercase">Perfil</Text>
          <Text variant="meta-label" className={cn('font-semibold', colorCss.text)}>
            {completeness.score}%
          </Text>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-muted/30 mb-2.5 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colorCss.fill)}
            style={{ width: `${completeness.score}%` }}
          />
        </div>
        {/* Checklist */}
        <ul className="space-y-1">
          {completeness.items.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              {item.done
                ? <Check className="size-3 text-success shrink-0" />
                : <Circle className="size-3 text-warning shrink-0" />
              }
              <Text
                variant="meta-label"
                as="span"
                className={cn(
                  'text-muted-foreground/55',
                  item.done && 'line-through text-muted-foreground/30',
                )}
              >
                {item.label}
              </Text>
            </li>
          ))}
        </ul>
      </div>

      {/* 7. Quick Actions */}
      <div className={cn("px-5 py-4 border-t border-border/10 flex flex-col inline-snug")}>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className={cn("flex w-full justify-start inline-tight bg-primary/8 border-primary/20 text-primary hover:bg-primary/12")}
        >
          <Pencil className="size-3.5" />
          Editar Perfil
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetPassword}
          className={cn("flex w-full justify-start inline-tight")}
        >
          <KeyRound className="size-3.5" />
          Redefinir Senha
        </Button>
        {usuario.ativo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeactivate}
            className={cn("flex w-full justify-start inline-tight border-destructive/15 text-destructive hover:bg-destructive/5 hover:border-destructive/30")}
          >
            <Power className="size-3.5" />
            Desativar Usuário
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}
