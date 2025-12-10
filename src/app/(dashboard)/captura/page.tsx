'use client';

import { Suspense, useState } from 'react';
import { CapturaList } from '@/features/captura/components/captura-list';
import { CapturaDialog } from '@/features/captura/components/captura-dialog';
import { DataSurface } from '@/components/ui/data-surface';
import { Database } from 'lucide-react';

export default function CapturaPage() {
  const [capturaDialogOpen, setCapturaDialogOpen] = useState(false);
  // Key to force refresh list after capture
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setCapturaDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <DataSurface
      title="Captura de Processos"
      subtitle="Gerencie e acompanhe o histórico de capturas dos tribunais."
      icon={Database}
    >
      <div className="p-6">
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
      </div>
    </DataSurface>
  );
}
