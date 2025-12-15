'use client';

import * as React from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import { ProcessosTableWrapper } from '@/features/processos';

export default function ProcessosPage() {
  return (
    <PageShell
      actions={<Button>Novo Processo</Button>}
    >
      <ProcessosTableWrapper />
    </PageShell>
  );
}
