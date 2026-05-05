'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from '../shared/usuario-card';
import { DepartmentGroupHeader } from './department-group-header';
import { EmptyState } from '@/components/shared/empty-state';
import type { Usuario } from '../../domain';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  grouped?: boolean;
  onView: (usuario: Usuario) => void;
}

interface CardGridProps {
  usuarios: Usuario[];
  lastLoginMap?: Map<number, string | null>;
  onView: (usuario: Usuario) => void;
}

function CardGrid({ usuarios, lastLoginMap, onView }: CardGridProps) {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3")}>
      {usuarios.map((usuario) => (
        <UsuarioCard
          key={usuario.id}
          usuario={usuario}
          lastLoginAt={lastLoginMap?.get(usuario.id) ?? null}
          onView={onView}
        />
      ))}
    </div>
  );
}

export function UsuariosGridView({
  usuarios,
  lastLoginMap,
  grouped = false,
  onView,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum usuário encontrado"
        description="Tente ajustar os filtros ou a busca."
      />
    );
  }

  if (!grouped) {
    return (
      <CardGrid
        usuarios={usuarios}
        lastLoginMap={lastLoginMap}
        onView={onView}
      />
    );
  }

  // Group by cargo.nome
  const groups = new Map<string, Usuario[]>();

  for (const usuario of usuarios) {
    const key = usuario.cargo?.nome ?? 'Sem cargo';
    const existing = groups.get(key) ?? [];
    existing.push(usuario);
    groups.set(key, existing);
  }

  // Sort: "Sem cargo" goes last, everything else alphabetically
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'Sem cargo') return 1;
    if (b === 'Sem cargo') return -1;
    return a.localeCompare(b, 'pt-BR');
  });

  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      {sortedKeys.map((cargoNome) => {
        const members = groups.get(cargoNome)!;
        return (
          <DepartmentGroupHeader
            key={cargoNome}
            cargoNome={cargoNome}
            members={members}
            defaultOpen
          >
            <CardGrid
              usuarios={members}
              lastLoginMap={lastLoginMap}
              onView={onView}
            />
          </DepartmentGroupHeader>
        );
      })}
    </div>
  );
}
