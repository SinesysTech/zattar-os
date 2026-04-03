'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <CardTitle>Erro ao carregar contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Ocorreu um erro ao tentar carregar os detalhes do contrato.
            Por favor, tente novamente.
          </p>

          {error.message && (
            <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
              {error.message}
            </div>
          )}

          <div className="flex gap-2 justify-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
