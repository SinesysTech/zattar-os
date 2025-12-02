import { useState, useEffect } from 'react';

type InstallationStatus = 'idle' | 'prompted' | 'accepted' | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installationStatus, setInstallationStatus] = useState<InstallationStatus>('idle');
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
      setIsInstalled(isStandalone);
      if (isStandalone) {
        setInstallationStatus('accepted');
      }
    };

    checkInstalled();

    const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    if (dismissed) {
      setInstallationStatus('dismissed');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setInstallationStatus('prompted');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallationStatus('accepted');
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallationStatus('accepted');
    } else {
      setInstallationStatus('dismissed');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismissPrompt = () => {
    setInstallationStatus('dismissed');
    localStorage.setItem('pwa-install-dismissed', 'true');
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    installationStatus,
  };
}