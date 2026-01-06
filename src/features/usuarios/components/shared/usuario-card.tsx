
'use client';

import * as React from 'react';
import type { Usuario } from '../../domain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, KeyRound, MoreHorizontal, ShieldAlert } from 'lucide-react';
import {
  formatarOab,
  formatarTelefone,
  formatarCpf,
  getAvatarUrl,
} from '../../utils';

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
  onView: (usuario: Usuario) => void;
  onRedefinirSenha?: (usuario: Usuario) => void;
}

export function UsuarioCard({ usuario, onView, onRedefinirSenha }: UsuarioCardProps) {
  // Verifica se deve exibir OAB (apenas para Advogado e Diretor)
  const cargoNome = usuario.cargo?.nome?.toLowerCase();
  const deveExibirOab = cargoNome === 'advogado' || cargoNome === 'diretor';

  return (
    <Card className="relative flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="px-4 py-3 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={getAvatarUrl(usuario.avatarUrl) || undefined} alt={usuario.nomeExibicao} />
            <AvatarFallback className="text-sm font-medium">
              {getInitials(usuario.nomeExibicao || usuario.nomeCompleto)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold leading-tight truncate">
                {usuario.nomeCompleto}
              </CardTitle>
              {usuario.isSuperAdmin && (
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {usuario.emailCorporativo}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-1.5 text-sm px-4 py-3 pt-0 pb-12">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">CPF:</span>
          <span className="font-medium">
            {formatarCpf(usuario.cpf)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Telefone:</span>
          <span className="font-medium">
            {formatarTelefone(usuario.telefone)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Cargo:</span>
          <span className="font-medium truncate" title={usuario.cargo?.nome || '-'}>
            {usuario.cargo?.nome || '-'}
          </span>
        </div>

        {deveExibirOab && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">OAB:</span>
            <span className="font-medium">
              {formatarOab(usuario.oab, usuario.ufOab)}
            </span>
          </div>
        )}
      </CardContent>

      <div className="absolute bottom-3 right-4">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Ações do usuário</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Ações</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onView(usuario)}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            {onRedefinirSenha && (
              <DropdownMenuItem onClick={() => onRedefinirSenha(usuario)}>
                <KeyRound className="h-4 w-4 mr-2" />
                Redefinir Senha
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
