'use client';

// Componente Card para exibir usuário

import * as React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';
import {
  formatarNomeExibicao,
  formatarOab,
  formatarTelefone,
} from '@/lib/utils/format-usuarios';

interface UsuarioCardProps {
  usuario: Usuario;
  onView: (usuario: Usuario) => void;
  onEdit: (usuario: Usuario) => void;
}

export function UsuarioCard({ usuario, onView, onEdit }: UsuarioCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
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
          <Badge variant={usuario.ativo ? 'default' : 'secondary'} className="shrink-0">
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-2 text-sm">
        {usuario.oab && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">OAB:</span>
            <span className="font-medium">
              {formatarOab(usuario.oab, usuario.ufOab)}
            </span>
          </div>
        )}
        
        {usuario.telefone && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Telefone:</span>
            <span className="font-medium">
              {formatarTelefone(usuario.telefone)}
            </span>
          </div>
        )}
        
        {usuario.nomeCompleto !== usuario.nomeExibicao && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Nome completo:</span>
            <span className="font-medium truncate" title={usuario.nomeCompleto}>
              {usuario.nomeCompleto}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onView(usuario)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(usuario)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}

