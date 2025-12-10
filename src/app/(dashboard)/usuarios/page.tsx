
'use client';

import { PageShell } from '@/components/shared/page-shell';
import { UsuariosPageContent } from '@/features/usuarios';

export default function UsuariosPage() {
  return (
    <PageShell title="Usuários" description="Gerenciamento de usuários do sistema">
      <UsuariosPageContent />
    </PageShell>
  );
}
