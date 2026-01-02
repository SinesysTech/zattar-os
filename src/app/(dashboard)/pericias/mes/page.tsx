import type { Metadata } from 'next';
import { PericiasContent } from '@/features/pericias';
import { PageShell } from '@/components/shared';

export const metadata: Metadata = {
  title: 'Perícias | Mês',
  description: 'Visualização mensal de perícias',
};

export const dynamic = 'force-dynamic';

export default function PericiasMesPage() {
  return (
    <PageShell>
      <PericiasContent visualizacao="mes" />
    </PageShell>
  );
}


