
import * as React from 'react';
import { ProfileShell } from '@/features/profiles';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ParteContrariaPage({ params }: PageProps) {
  const { id } = await params;
  const entityId = parseInt(id, 10);

  if (isNaN(entityId)) {
    return <div>ID inválido</div>;
  }

  return (
    <div className="h-full">
      <ProfileShell entityType="parte_contraria" entityId={entityId} />
    </div>
  );
}
