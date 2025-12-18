'use client';

import { Suspense, useState } from 'react';
import { CapturaList, CapturaDialog } from '@/features/captura';
import { PageShell } from '@/components/shared/page-shell';

export default function CapturaPage() {
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  // Key to force refresh list after capture
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setCapturaDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <PageShell>
      <Suspense fallback={<div>Carregando...</div>}>
        <CapturaList
          key={refreshKey}
          onNewClick={() => setCapturaDialogOpen(true)}
        />
      </Suspense>

      <CapturaDialog
        open={capturaDialogOpen}
        onOpenChange={setCapturaDialogOpen}
        onSuccess={handleSuccess}
      />
    </PageShell>
  );
}
