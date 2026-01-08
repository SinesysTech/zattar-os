'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { isPWAInstalled, isSecureContext } from '@/lib/pwa-utils';
import { useEffect, useState } from 'react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt, installationStatus } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- usado para debug futuro
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('[PWA] Install status:', {
      isInstallable,
      isInstalled,
      installationStatus,
      isSecureContext: isSecureContext(),
      isPWAInstalled: isPWAInstalled()
    });
    // Check if already installed via display-mode
    const checkAndSetVisibility = () => {
      // Check HTTPS requirement
      if (!isSecureContext()) {
        setErrorMessage('PWA requer HTTPS ou localhost para funcionar');
        setIsVisible(false);
        return;
      }

      if (isPWAInstalled()) {
        setIsVisible(false);
        return;
      }

      // Show prompt only if installable and not dismissed
      if (isInstallable && installationStatus !== 'dismissed' && !isInstalled) {
        setErrorMessage(null);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkAndSetVisibility();
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
    <Alert className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-2 md:left-auto md:right-4 md:w-90 border-primary/20 bg-background shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <AlertTitle className="text-sm font-semibold">Instalar aplicativo</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Acesse mais rápido e tenha uma experiência completa.
          </AlertDescription>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-xs">
              Instalar agora
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Agora não
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="h-6 w-6 shrink-0 rounded-full opacity-70 hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>
    </Alert>
  );
}
