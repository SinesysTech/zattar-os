'use client';

// Componente Grid para exibir usuários em cards

import * as React from 'react';
import { UsuarioCard } from './usuario-card';
import { UsuariosPagination } from './usuarios-pagination';
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
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function UsuariosGridView({
  usuarios,
  paginacao,
  onView,
  onEdit,
  onPageChange,
  onPageSizeChange,
}: UsuariosGridViewProps) {
  if (usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>Nenhum usuário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {usuarios.map((usuario) => (
          <UsuarioCard key={usuario.id} usuario={usuario} onView={onView} onEdit={onEdit} />
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

