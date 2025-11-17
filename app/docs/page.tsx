'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import do SwaggerUI para evitar problemas com SSR e CSS no Turbopack
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando interface Swagger...</p>
      </div>
    </div>
  ),
});

/**
 * Página de documentação Swagger UI
 *
 * Acesse em: http://localhost:3000/docs
 */
export default function SwaggerDocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NOTA: CSS do Swagger UI removido temporariamente devido a problemas com Turbopack
  // TODO: Adicionar CSS customizado ou aguardar fix do Turbopack
  // useEffect(() => {
  //   import('swagger-ui-react/swagger-ui.css');
  // }, []);

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch('/api/docs/openapi.json');
        if (!response.ok) {
          throw new Error('Falha ao carregar especificação OpenAPI');
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando documentação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar documentação</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="swagger-container">
      <SwaggerUI spec={spec} />
    </div>
  );
}

