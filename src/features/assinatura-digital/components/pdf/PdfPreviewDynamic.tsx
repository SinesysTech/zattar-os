'use client';

import dynamic from 'next/dynamic';
import type { PdfPreviewProps } from '@/types/assinatura-digital/pdf-preview.types';
import { Loader2 } from 'lucide-react';

// O componente PdfPreview é carregado dinamicamente para evitar que react-pdf/pdfjs-dist
// sejam avaliados no servidor (causaria erro DOMMatrix is not defined).
// A configuração do worker está dentro do PdfPreview.tsx com guard typeof window !== 'undefined'.
const PdfPreview = dynamic(() => import('./PdfPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

export default function PdfPreviewDynamic(props: PdfPreviewProps) {
  return <PdfPreview {...props} />;
}