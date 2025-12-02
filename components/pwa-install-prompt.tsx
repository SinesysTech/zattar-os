'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { isPWAInstalled } from '@/lib/pwa-utils';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt, installationStatus } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already installed via display-mode
    if (isPWAInstalled()) {
      setIsVisible(false);
      return;
    }

    // Show prompt only if installable and not dismissed
    if (isInstallable && installationStatus !== 'dismissed' && !isInstalled) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, installationStatus, isInstalled]);

  const handleInstall = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    dismissPrompt();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Alert className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 md:left-auto md:right-4 md:w-96">
      <Download className="h-4 w-4" />
      <AlertDescription>
        Instale o app para uma melhor experiencia.
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={handleInstall}>
            Instalar
          </Button>
          <Button size="sm" variant="outline" onClick={handleDismiss}>
            Agora nao
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
