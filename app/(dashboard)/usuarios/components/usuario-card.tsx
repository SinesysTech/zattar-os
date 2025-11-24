'use client';

// Componente Card para exibir usuário

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, KeyRound } from 'lucide-react';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import {
  formatarNomeExibicao,
  formatarOab,
  formatarTelefone,
  formatarCpf,
} from '@/app/_lib/utils/format-usuarios';

interface UsuarioCardProps {
  usuario: Usuario;
  onView: (usuario: Usuario) => void;
  onEdit?: (usuario: Usuario) => void;
  onRedefinirSenha?: (usuario: Usuario) => void;
}

export function UsuarioCard({ usuario, onView, onEdit, onRedefinirSenha }: UsuarioCardProps) {
  return (
    <Card className="relative flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight truncate">
              {formatarNomeExibicao(usuario.nomeExibicao)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {usuario.emailCorporativo}
            </p>
          </div>
          <Badge
            tone={usuario.ativo ? 'success' : 'neutral'}
            variant={usuario.ativo ? 'soft' : 'outline'}
            className="shrink-0"
          >
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-sm pb-12">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">CPF:</span>
          <span className="font-medium">
            {formatarCpf(usuario.cpf)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Telefone:</span>
          <span className="font-medium">
            {formatarTelefone(usuario.telefone)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Cargo:</span>
          <span className="font-medium truncate" title={usuario.cargo?.nome || '-'}>
            {usuario.cargo?.nome || '-'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">OAB:</span>
          <span className="font-medium">
            {formatarOab(usuario.oab, usuario.ufOab)}
          </span>
        </div>
      </CardContent>

      {/* Botões de ação no canto inferior direito */}
      <div className="absolute bottom-3 right-3 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(usuario)}
          title="Visualizar usuário"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar usuário</span>
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(usuario)}
            title="Editar usuário"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar usuário</span>
          </Button>
        )}
        {onRedefinirSenha && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRedefinirSenha(usuario)}
            title="Redefinir senha"
          >
            <KeyRound className="h-4 w-4" />
            <span className="sr-only">Redefinir senha</span>
          </Button>
        )}
      </div>
    </Card>
  );
}

