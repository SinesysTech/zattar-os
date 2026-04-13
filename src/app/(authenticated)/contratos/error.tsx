'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';

export default function ContratosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro ao carregar contratos:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <GlassPanel className="max-w-md w-full p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <Heading level="card" className="mb-4">Erro ao carregar contratos</Heading>
        </div>
        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Ocorreu um erro ao tentar carregar a lista de contratos.
            Por favor, tente novamente.
          </p>

          <div className="flex justify-center">
            <Button onClick={reset}>
              <RotateCcw className="size-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
