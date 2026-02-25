
'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from '../shared/usuario-card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { Usuario } from '../../domain';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  onView: (usuario: Usuario) => void;
}

export function UsuariosGridView({
  usuarios,
  onView,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          onView={onView}
        />
      ))}
    </div>
  );
}
