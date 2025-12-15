import { PageShell } from '@/components/shared/page-shell';
import { ClientLoader } from './client-loader';

export default function Page() {
  return (
    <PageShell>
      <ClientLoader />
    </PageShell>
  );
}
