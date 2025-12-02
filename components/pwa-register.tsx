'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== 'development' &&
      typeof window !== 'undefined' && 
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return null;
}
