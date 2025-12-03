"use client";

import dynamic from 'next/dynamic';

const FormulariosClient = dynamic(() => import('./client-page').then(m => m.FormulariosClient), { ssr: false });

export function ClientLoader() {
  return <FormulariosClient />;
}
