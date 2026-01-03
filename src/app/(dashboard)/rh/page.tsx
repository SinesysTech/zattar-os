import { PageShell } from '@/components/shared/page-shell';
import { RHTabsContent } from '@/features/rh';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RHPage() {
  return (
    <PageShell>
      <RHTabsContent />
    </PageShell>
  );
}
