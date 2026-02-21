"use client";

/**
 * NovoDocumentoClient - Criação de novo documento de assinatura digital
 *
 * Usa o mesmo layout visual do editor (canvas + sidebar),
 * mostrando o dropzone na área do canvas.
 * Após upload, cria o documento e redireciona para /editar/[uuid].
 */

import { DocumentUploadDropzone } from "../../feature/components/upload";

export function NovoDocumentoClient() {
  return (
    <div className="-m-6 h-[calc(100vh-(--spacing(14))-(--spacing(12)))] flex overflow-hidden bg-background">
      {/* Área principal — dropzone no lugar do PDF canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-muted/30">
          <DocumentUploadDropzone />
        </div>
      </div>

      {/* Sidebar placeholder — consistência visual com o editor */}
      <div className="hidden lg:block w-85 shrink-0 border-l">
        <div className="h-full bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Envie um documento
          </p>
          <p className="text-xs text-muted-foreground max-w-50">
            Faça upload de um PDF para configurar os assinantes e posicionar os campos de assinatura.
          </p>
        </div>
      </div>
    </div>
  );
}
