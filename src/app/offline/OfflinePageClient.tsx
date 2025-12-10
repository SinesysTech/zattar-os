'use client';

import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePageClient() {
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <WifiOff className="h-16 w-16 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Sem conexao com a internet
          </h1>
          <p className="text-muted-foreground">
            Verifique sua conexao e tente novamente.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
          <Button variant="outline" onClick={handleGoHome} className="gap-2">
            <Home className="h-4 w-4" />
            Pagina inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
