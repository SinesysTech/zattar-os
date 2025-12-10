import { PageShell } from '@/components/shared/page-shell';
import { DashboardContent } from './components/dashboard-content';

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard">
      <DashboardContent />
    </PageShell>
  );
}
