'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No futuro, podemos logar o erro para um serviço como Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex animate-in flex-col items-center gap-4 text-center zoom-in-95 fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Oops! Algo deu errado.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar para o início.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Button asChild>
            <a href="/dashboard">Ir para o Início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
