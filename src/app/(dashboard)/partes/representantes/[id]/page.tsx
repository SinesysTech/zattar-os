'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ProfileShell } from '@/features/profiles';

export default function RepresentantePage() {
  const params = useParams();
  const id = params.id as string;
  const entityId = parseInt(id, 10);

  if (isNaN(entityId)) {
    return <div>ID inválido</div>;
  }

  return (
    <div className="h-full">
      <ProfileShell entityType="representante" entityId={entityId} />
    </div>
  );
}
