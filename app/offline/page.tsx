'use client';

import { useRouter } from 'next/navigation';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center animate-in fade-in duration-500">
        <WifiOff className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Você está offline</h1>
        <p className="text-muted-foreground mb-6">
          Verifique sua conexão com a internet
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
