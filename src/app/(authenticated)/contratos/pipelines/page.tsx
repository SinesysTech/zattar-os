import { PageShell } from '@/components/shared/page-shell';
import { PipelinesPageClient } from './page-client';

export default function PipelinesPage() {
  return (
    <PageShell>
      <PipelinesPageClient />
    </PageShell>
  );
}
