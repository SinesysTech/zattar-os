'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { pdfjs } from 'react-pdf';
import { PdfPreviewProps } from '@/types/formsign/pdf-preview.types';
import { Loader2 } from 'lucide-react';

// A importação dinâmica continua a mesma
const PdfPreview = dynamic(() => import('./PdfPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  ),
});

export default function PdfPreviewDynamic(props: PdfPreviewProps) {
  // useEffect garante que a configuração do worker só rode no cliente
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  return <PdfPreview {...props} />;
}