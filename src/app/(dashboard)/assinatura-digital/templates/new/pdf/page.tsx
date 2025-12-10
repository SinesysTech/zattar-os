'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de redirecionamento para criação de template PDF.
 * Redireciona para a página unificada de criação com tipo PDF pré-selecionado.
 */
export default function CreatePdfTemplatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página unificada com tipo PDF
    router.replace('/assinatura-digital/templates/new/markdown?tipo=pdf');
  }, [router]);

  return null;
}
