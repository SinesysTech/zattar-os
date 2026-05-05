'use client';

import * as React from 'react';
import { Mail, Phone, MapPin, Scale, Clock, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassPanel } from '@/components/shared/glass-panel';
import { InfoLine, InlineCopy, timeAgo } from '@/components/dashboard/entity-card';
import { cn } from '@/lib/utils';
import { getAvatarUrl, formatarOab } from '../../utils';
import { getCargoColors } from './role-banner';
import { UserStatusDot, getStatusFromLastLogin } from './user-status-dot';
import { calcularCompleteness } from './completeness-utils';
import type { Usuario } from '../../domain';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CARGOS_COM_OAB = ['advogado', 'advogada', 'diretor'];

interface UsuarioCardProps {
  usuario: Usuario;
  lastLoginAt?: string | null;
  onView: (usuario: Usuario) => void;
}

export function UsuarioCard({
  usuario,
  lastLoginAt,
  onView,
}: UsuarioCardProps) {
  const isAtivo = usuario.ativo !== false;
  const cargoNome = usuario.cargo?.nome ?? null;
  const cargoColors = getCargoColors(cargoNome);

  const { score } = calcularCompleteness(usuario);
  const isIncompleto = isAtivo && score < 70;

  const status = getStatusFromLastLogin(lastLoginAt ?? null);

  const cargoNomeLower = cargoNome?.toLowerCase().trim() ?? '';
  const isCargoComOab = CARGOS_COM_OAB.includes(cargoNomeLower);
  const deveExibirOab = isCargoComOab && Boolean(usuario.oab?.trim());

  const cidade = usuario.endereco?.cidade?.trim();
  const estado = usuario.endereco?.estado?.trim();
  const localizacao =
    cidade && estado ? `${cidade}, ${estado}` : (cidade ?? estado ?? null);

  const nomeExibicao =
    usuario.nomeExibicao && usuario.nomeExibicao !== usuario.nomeCompleto
      ? usuario.nomeExibicao
      : null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onView(usuario);
    }
  };

  return (
    <GlassPanel
      className={cn(
        'p-4 cursor-pointer group hover:border-border/40 transition-colors flex flex-col h-full',
        !isAtivo && 'opacity-55',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(usuario)}
        onKeyDown={handleKeyDown}
        className="flex flex-col flex-1"
      >
        {/* Header: Avatar + Nome + Cargo Badge */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className={cn('size-10 rounded-xl', cargoColors.bg)}>
              <AvatarImage
                src={getAvatarUrl(usuario.avatarUrl) || undefined}
                alt={usuario.nomeExibicao ?? usuario.nomeCompleto}
                className="rounded-xl"
              />
              <AvatarFallback
                className={cn(
                  'rounded-xl text-xs font-bold',
                  cargoColors.bg,
                  cargoColors.color,
                )}
              >
                {getInitials(usuario.nomeExibicao ?? usuario.nomeCompleto ?? '')}
              </AvatarFallback>
            </Avatar>
            <UserStatusDot
              status={status}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold truncate flex-1">
                {usuario.nomeCompleto}
              </h3>
              <InlineCopy text={usuario.nomeCompleto} label="Copiar nome" />
              {usuario.isSuperAdmin && (
                <ShieldAlert
                  className="size-3.5 text-destructive shrink-0"
                  aria-label="Super admin"
                />
              )}
              {!isAtivo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50 shrink-0">
                  Inativo
                </span>
              )}
            </div>
            {nomeExibicao && (
              <p className="text-[10px] text-muted-foreground/55 truncate mt-0.5">
                {nomeExibicao}
              </p>
            )}
            {cargoNome && (
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'text-[9px] font-medium px-1.5 py-0.5 rounded',
                    cargoColors.bg,
                    cargoColors.color,
                  )}
                >
                  {cargoNome}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dados de contato */}
        <div className="mt-3 space-y-1">
          <InfoLine
            icon={Mail}
            text={usuario.emailCorporativo}
            copyLabel="Copiar e-mail"
          />
          {usuario.telefone && (
            <InfoLine
              icon={Phone}
              text={usuario.telefone}
              copyLabel="Copiar telefone"
            />
          )}
          {deveExibirOab && (
            <InfoLine
              icon={Scale}
              text={formatarOab(usuario.oab, usuario.ufOab)}
              copyLabel="Copiar OAB"
            />
          )}
          {localizacao && (
            <InfoLine
              icon={MapPin}
              text={localizacao}
              copyLabel="Copiar localidade"
            />
          )}
        </div>

        {/* Rodapé fixo: lastLogin à esquerda, tag de incompleto à direita */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/10 min-h-7">
          <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
            <Clock className="size-2.5" />
            {lastLoginAt ? `Visto ${timeAgo(lastLoginAt)}` : 'Nunca acessou'}
          </span>

          {isIncompleto && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/8 text-warning/70 font-medium">
              Perfil {score}%
            </span>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
