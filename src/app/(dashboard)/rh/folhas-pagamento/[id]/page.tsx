
import { FolhaDetalhes } from '@/features/rh/components/folhas-pagamento/folha-detalhes';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FolhaDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  return <FolhaDetalhes folhaId={Number(id)} />;
}
