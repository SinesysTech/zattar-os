
import * as React from 'react';
import { UsuarioDetalhes } from './usuario-detalhes';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function UsuarioPage({ params }: PageProps) {
  const { id } = await params;
  const entityId = parseInt(id, 10);

  if (isNaN(entityId)) {
      return <div>ID inválido</div>;
  }

  return (
    <div className="h-full">
      <UsuarioDetalhes id={entityId} />
    </div>
  );
}
