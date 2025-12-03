"use client";

import dynamic from 'next/dynamic';

const DocumentoEditorClient = dynamic(() => import('./client-page').then(m => m.DocumentoEditorClient), { ssr: false });

export function ClientLoader() {
  return <DocumentoEditorClient />;
}
