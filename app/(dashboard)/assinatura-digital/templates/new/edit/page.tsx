'use client';

import { Suspense } from 'react';
import FieldMappingEditor from '@/components/assinatura-digital/editor/FieldMappingEditor';
import { Template } from '@/types/assinatura-digital/template.types';

/**
 * Página de criação de novo template
 * Renderiza o FieldMappingEditor em modo 'create'
 */
export default function NewTemplatePage() {
  /**
   * Template vazio para modo criação
   *
   * Configurações padrão de captura de dados:
   * - foto_necessaria: true - Manter comportamento atual (foto obrigatória)
   * - geolocation_necessaria: false - Nova feature desabilitada por padrão
   * - metadados_seguranca: ['ip', 'user_agent'] - Metadados básicos já capturados
   *
   * Estes valores garantem que novos templates tenham configurações sensatas por padrão,
   * mantendo compatibilidade com o comportamento atual do sistema.
   */
  const emptyTemplate: Template = {
    id: 'new',
    nome: '',
    arquivo_original: '',
    arquivo_nome: '',
    arquivo_tamanho: 0,
    status: 'rascunho',
    versao: 1,
    campos: [],
    ativo: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="font-medium text-muted-foreground">Carregando editor...</p>
          </div>
        </div>
      }
    >
      <FieldMappingEditor template={emptyTemplate} mode="create" />
    </Suspense>
  );
}
