import { PageShell } from '@/components/shared/page-shell';
import { RepassesPageContent } from '@/features/repasses';

export default function RepassesPage() {
  return (
    <PageShell
      title="Repasses Pendentes"
      description="Gerencie repasses aos clientes que precisam ser processados"
    >
      <RepassesPageContent />
    </PageShell>
  );
}
