import { ProfileShell } from '@/features/profiles';

interface PageProps {
    params: { id: string };
}

export default function RepresentantePage({ params }: PageProps) {
  const { id } = params;
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
