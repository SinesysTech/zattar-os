'use client';

/**
 * Client Component para página de edição de modelo
 * Extrai o ID dos params e passa para o editor
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Typography } from '@/components/ui/typography';
import { PecaModeloEditor } from '@/app/(authenticated)/pecas-juridicas/components';

export function EditarPecaModeloClient() {
  const params = useParams<{ id: string }>();
  const modeloId = React.useMemo(() => parseInt(params.id, 10), [params.id]);

  if (isNaN(modeloId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Typography.H2>ID inválido</Typography.H2>
          <Typography.Muted className="mt-2">
            O ID do modelo fornecido não é válido.
          </Typography.Muted>
        </div>
      </div>
    );
  }

  return <PecaModeloEditor modeloId={modeloId} />;
}
