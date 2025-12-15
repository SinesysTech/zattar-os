"use client";

import dynamic from 'next/dynamic';

const TemplatesClient = dynamic(() => import('./client-page').then(m => m.TemplatesClient), { ssr: false });

export function ClientLoader() {
  return <TemplatesClient />;
}

