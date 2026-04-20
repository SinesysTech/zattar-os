'use client';

import dynamic from 'next/dynamic';
import type { PdfPreviewProps } from '../../types/pdf-preview.types';
import { LoadingSpinner } from "@/components/ui/loading-state"
// O componente PdfPreview é carregado dinamicamente para evitar que react-pdf/pdfjs-dist
// sejam avaliados no servidor (causaria erro DOMMatrix is not defined).
// A configuração do worker está dentro do PdfPreview.tsx com guard typeof window !== 'undefined'.
const PdfPreview = dynamic(() => import('./PdfPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner className="size-8 text-muted-foreground" />
    </div>
  ),
});

export default function PdfPreviewDynamic(props: PdfPreviewProps) {
  return <PdfPreview {...props} />;
}