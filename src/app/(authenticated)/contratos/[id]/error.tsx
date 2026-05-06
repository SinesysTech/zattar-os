'use client';

import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading } from '@/components/ui/typography';

export default function ContratoDetalhesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro ao carregar contrato:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <GlassPanel className={cn("max-w-md w-full inset-dialog")}>
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <Heading level="card" className="mb-4">Erro ao carregar contrato</Heading>
        </div>
        <div className={cn("flex flex-col stack-default")}>
          <p className="text-center text-muted-foreground">
            Ocorreu um erro ao tentar carregar os detalhes do contrato.
            Por favor, tente novamente.
          </p>

          {error.message && (
            <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "inset-medium rounded-md bg-muted text-body-sm text-muted-foreground")}>
              {error.message}
            </div>
          )}

          <div className={cn("flex inline-tight justify-center")}>
            <Button variant="outline" asChild>
              <Link href="/app/contratos">
                <ArrowLeft className="size-4 mr-2" />
                Voltar
              </Link>
            </Button>
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
