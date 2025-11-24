'use client';

// Componente Grid para exibir usuários em cards

import * as React from 'react';
import { Users } from 'lucide-react';
import { UsuarioCard } from './usuario-card';
import { UsuariosPagination } from './usuarios-pagination';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface UsuariosGridViewProps {
  usuarios: Usuario[];
  paginacao?: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  onView: (usuario: Usuario) => void;
  onEdit?: (usuario: Usuario) => void;
  onRedefinirSenha?: (usuario: Usuario) => void;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function UsuariosGridView({
  usuarios,
  paginacao,
  onView,
  onEdit,
  onRedefinirSenha,
  onPageChange,
  onPageSizeChange,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum usuário encontrado.</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {usuarios.map((usuario) => (
          <UsuarioCard
            key={usuario.id}
            usuario={usuario}
            onView={onView}
            onEdit={onEdit}
            onRedefinirSenha={onRedefinirSenha}
          />
        ))}
      </div>
      
      {paginacao && onPageChange && onPageSizeChange && (
        <UsuariosPagination
          pageIndex={paginacao.pagina - 1}
          pageSize={paginacao.limite}
          total={paginacao.total}
          totalPages={paginacao.totalPaginas}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

