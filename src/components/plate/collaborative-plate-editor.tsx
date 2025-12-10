/**
 * Editor Plate.js com suporte a colaboração CRDT via Yjs
 *
 * Este componente integra:
 * - Plate.js para edição de texto rico
 * - Yjs para sincronização CRDT (conflict-free)
 * - Supabase Realtime como transporte
 * - Cursors remotos de outros usuários
 */

'use client';

import * as React from 'react';
import { type Descendant, type Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { YjsPlugin } from '@platejs/yjs/react';

import { EditorKit } from '@/components/plate/editor-kit';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { createClient } from '@/core/app/_lib/supabase/client';
import {
  SupabaseYjsProvider,
  type SupabaseYjsProviderOptions,
} from '@/lib/yjs/supabase-yjs-provider';

// Cores para cursores de usuários
const CURSOR_COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

function getUserColor(userId: number): string {
  return CURSOR_COLORS[userId % CURSOR_COLORS.length];
}

interface CollaborativePlateEditorProps {
  /**
   * ID do documento para sincronização
   */
  documentoId: number;
  /**
   * Dados do usuário atual
   */
  currentUser: {
    id: number;
    name: string;
  };
  /**
   * Valor inicial do documento
   */
  initialValue?: Descendant[];
  /**
   * Callback quando o conteúdo muda
   */
  onChange?: (value: Descendant[]) => void;
  /**
   * Callback quando status de conexão muda
   */
  onConnectionChange?: (isConnected: boolean) => void;
  /**
   * Callback quando status de sync muda
   */
  onSyncChange?: (isSynced: boolean) => void;
}

export function CollaborativePlateEditor({
  documentoId,
  currentUser,
  initialValue,
  onChange,
  onConnectionChange,
  onSyncChange,
}: CollaborativePlateEditorProps) {
  const supabase = createClient();

  // Refs para cleanup
  const providerRef = React.useRef<SupabaseYjsProvider | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [editorPlugins, setEditorPlugins] = React.useState<typeof EditorKit | null>(null);

  // Configurar Yjs provider
  React.useEffect(() => {
    const setupYjs = async () => {
      try {
        // Dados do usuário para cursors
        const userData: SupabaseYjsProviderOptions['userData'] = {
          id: currentUser.id,
          name: currentUser.name,
          color: getUserColor(currentUser.id),
        };

        // Criar provider Supabase
        const provider = new SupabaseYjsProvider(
          {
            supabase,
            documentId: documentoId,
            userData,
          },
          {
            onConnectionChange,
            onSyncChange,
          }
        );

        providerRef.current = provider;

        // Criar plugins com Yjs
        const plugins = [
          ...EditorKit,
          YjsPlugin.configure({
            options: {
              ydoc: provider.document,
              providers: [provider], // Provider já instanciado que implementa UnifiedProvider
              cursors: {
                data: {
                  name: currentUser.name,
                  color: userData.color,
                },
              },
            },
          }),
        ];

        setEditorPlugins(plugins as typeof EditorKit);
        setIsReady(true);

        // Conectar após setup
        provider.connect();
      } catch (error) {
        console.error('[CollaborativeEditor] Erro ao configurar Yjs:', error);
      }
    };

    setupYjs();

    // Cleanup
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      setIsReady(false);
      setEditorPlugins(null);
    };
  }, [documentoId, currentUser, supabase, onConnectionChange, onSyncChange]);

  // Criar editor Plate
  const editor = usePlateEditor({
    plugins: editorPlugins || EditorKit,
    value: (initialValue || []) as Value,
  });

  // Handler para mudanças
  const handleChange = React.useCallback(
    ({ value }: { value: Descendant[] }) => {
      onChange?.(value);
    },
    [onChange]
  );

  if (!isReady || !editorPlugins) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Conectando colaboração em tempo real...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Plate editor={editor} onChange={handleChange}>
      <EditorContainer variant="default" className="h-full">
        <Editor variant="demo" />
      </EditorContainer>
    </Plate>
  );
}

/**
 * Versão não-colaborativa do editor (sem Yjs)
 * Útil para edição offline ou quando não há necessidade de colaboração
 */
export function SimplePlateEditor({
  initialValue,
  onChange,
}: {
  initialValue?: Descendant[];
  onChange?: (value: Descendant[]) => void;
}) {
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: (initialValue || []) as Value,
  });

  const handleChange = React.useCallback(
    ({ value }: { value: Descendant[] }) => {
      onChange?.(value);
    },
    [onChange]
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <EditorContainer variant="default" className="h-full">
        <Editor variant="demo" />
      </EditorContainer>
    </Plate>
  );
}
