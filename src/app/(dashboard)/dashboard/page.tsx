import { PageShell } from '@/components/shared/page-shell';
import { DashboardContent } from '@/features/dashboard';

export default function DashboardPage() {
  return (
    <PageShell>
      <DashboardContent />
    </PageShell>
  );
}
