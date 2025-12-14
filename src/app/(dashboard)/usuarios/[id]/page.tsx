'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ProfileShell } from '@/features/profiles';

export default function UsuarioPage() {
  const params = useParams();
  const id = params.id as string;
  const entityId = parseInt(id, 10);

  if (isNaN(entityId)) {
      // Handle the case where ID isn't a number if necessary, or let ProfileShell handle/error
      return <div>ID inválido</div>;
  }

  return (
    <div className="h-full">
      <ProfileShell entityType="usuario" entityId={entityId} />
    </div>
  );
}
