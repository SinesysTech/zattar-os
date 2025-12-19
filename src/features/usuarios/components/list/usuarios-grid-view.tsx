
'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from '../shared/usuario-card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { Usuario } from '../../types/types';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  onView: (usuario: Usuario) => void;
  onRedefinirSenha?: (usuario: Usuario) => void;
}

export function UsuariosGridView({
  usuarios,
  onView,
  onRedefinirSenha,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum membro da equipe encontrado.</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          onView={onView}
          onRedefinirSenha={onRedefinirSenha}
        />
      ))}
    </div>
  );
}
