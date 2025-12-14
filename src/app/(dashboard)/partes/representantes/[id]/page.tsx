
import { ProfileShell } from '@/features/profiles';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function RepresentantePage({ params }: PageProps) {
  const { id } = await params;
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
