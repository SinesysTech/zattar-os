/**
 * Página do editor de documentos
 * /documentos/[id]
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentos | Sinesys',
  description: 'Gerencie seus documentos',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function DocumentoEditorPage({ params }: PageProps) {
  const documentoId = parseInt(params.id);

  if (isNaN(documentoId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">ID inválido</h2>
          <p className="text-muted-foreground mt-2">
            O ID do documento fornecido não é válido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 h-full items-center justify-center overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="text-center px-6">
          <h2 className="text-lg font-semibold">Editor desativado</h2>
          <p className="mt-2 text-sm text-muted-foreground">Selecione ações na lista de Documentos.</p>
        </div>
      </div>
    </div>
  );
}
