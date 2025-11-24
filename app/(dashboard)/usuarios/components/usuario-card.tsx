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
  // Verifica se deve exibir OAB (apenas para Advogado e Diretor)
  const cargoNome = usuario.cargo?.nome?.toLowerCase();
  const deveExibirOab = cargoNome === 'advogado' || cargoNome === 'diretor';

  return (
    <Card className="relative flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="p-2.5 pb-1.5">
        <CardTitle className="text-sm leading-tight truncate">
          {formatarNomeExibicao(usuario.nomeExibicao)}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {usuario.emailCorporativo}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-0.5 text-xs p-2.5 pt-0 pb-7">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">CPF:</span>
          <span className="font-medium">
            {formatarCpf(usuario.cpf)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Telefone:</span>
          <span className="font-medium">
            {formatarTelefone(usuario.telefone)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Cargo:</span>
          <span className="font-medium truncate" title={usuario.cargo?.nome || '-'}>
            {usuario.cargo?.nome || '-'}
          </span>
        </div>

        {deveExibirOab && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">OAB:</span>
            <span className="font-medium">
              {formatarOab(usuario.oab, usuario.ufOab)}
            </span>
          </div>
        )}
      </CardContent>

      {/* Badge de status no canto inferior esquerdo */}
      <div className="absolute bottom-2 left-2">
        <Badge
          tone={usuario.ativo ? 'success' : 'neutral'}
          variant={usuario.ativo ? 'soft' : 'outline'}
          className="text-xs h-5 px-1.5"
        >
          {usuario.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Botões de ação no canto inferior direito */}
      <div className="absolute bottom-2 right-2 flex gap-0.5">
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

