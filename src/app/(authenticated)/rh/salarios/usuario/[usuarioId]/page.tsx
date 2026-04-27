'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { HistoricoSalarios } from '@/app/(authenticated)/rh';

interface PageProps {
  params: Promise<{ usuarioId: string }>;
}

export default function HistoricoSalarioPage({ params }: PageProps) {
  const [usuarioId, setUsuarioId] = React.useState<number | null>(null);

  React.useEffect(() => {
    params.then((p) => setUsuarioId(Number(p.usuarioId)));
  }, [params]);

  if (usuarioId === null) {
    return (
      <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "rounded-lg border bg-card p-6 text-center text-muted-foreground")}>
        Carregando...
      </div>
    );
  }

  return <HistoricoSalarios usuarioId={usuarioId} />;
}
