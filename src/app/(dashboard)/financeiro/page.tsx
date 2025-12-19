import { PageShell } from '@/components/shared/page-shell';
import { FinanceiroTabsContent, UsuarioIdProvider } from '@/features/financeiro';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FinanceiroPage() {
  return (
    <PageShell>
      <UsuarioIdProvider>
        <FinanceiroTabsContent />
      </UsuarioIdProvider>
    </PageShell>
  );
}
