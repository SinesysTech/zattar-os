'use client';

import { PageShell } from '@/components/shared/page-shell';
import { PerfilView } from '@/features/perfil';

export default function PerfilPage() {
  return (
    <PageShell>
      <PerfilView />
    </PageShell>
  );
}
