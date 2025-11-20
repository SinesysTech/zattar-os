'use client';

import { useEffect, useState } from 'react';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

/**
 * Página de documentação API com Scalar
 *
 * Acesse em: http://localhost:3000/docs
 */
export default function ApiDocsPage() {
  const [spec, setSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch('/api/docs/openapi.json');
        if (!response.ok) {
          throw new Error('Falha ao carregar especificação OpenAPI');
        }
        const data = await response.json();
        setSpec(JSON.stringify(data));
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
    <ApiReferenceReact
      configuration={{
        content: spec,
        theme: 'default',
        layout: 'modern',
        hideModels: false,
        hideDownloadButton: false,
      }}
    />
  );
}

