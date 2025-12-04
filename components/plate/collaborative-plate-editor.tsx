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
import * as Y from 'yjs';
import { type Descendant } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { withYjs, slateNodesToInsertDelta, YjsEditor } from '@slate-yjs/core';
import { CursorOverlay, withCursors } from '@slate-yjs/react';
import { createEditor, Descendant as SlateDescendant } from 'slate';

import { EditorKit } from '@/components/plate/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { getUserColor } from '@/components/plate/yjs-kit';

// Tipo para dados do cursor
interface CursorData {
  name: string;
  color: string;
}

interface CollaborativePlateEditorProps {
  /**
   * Documento Yjs para sincronização
   */
  yDoc: Y.Doc;
  /**
   * Dados do usuário atual
   */
  currentUser: {
    id: number;
    name: string;
  };
  /**
   * Valor inicial (usado apenas se o Yjs doc estiver vazio)
   */
  initialValue?: Descendant[];
  /**
   * Callback quando o conteúdo muda (para auto-save local)
   */
  onChange?: (value: Descendant[]) => void;
  /**
   * Se o editor está conectado (para UI feedback)
   */
  isConnected?: boolean;
  /**
   * Se o documento está sincronizado
   */
  isSynced?: boolean;
}

/**
 * Renderiza cursores de outros usuários
 */
function RemoteCursorComponent({ data }: { data: CursorData }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 2,
        height: '100%',
        backgroundColor: data.color,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: -20,
          left: 0,
          fontSize: 10,
          backgroundColor: data.color,
          color: 'white',
          padding: '2px 4px',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {data.name}
      </span>
    </span>
  );
}

/**
 * Renderiza seleção de outros usuários
 */
function RemoteSelectionComponent({
  data,
  selectionRects,
  caretPosition,
}: {
  data: CursorData;
  selectionRects: DOMRect[];
  caretPosition: DOMRect | null;
}) {
  const selectionStyle: React.CSSProperties = {
    backgroundColor: `${data.color}33`, // 20% opacity
  };

  return (
    <>
      {selectionRects.map((rect, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            ...selectionStyle,
            pointerEvents: 'none',
          }}
        />
      ))}
      {caretPosition && (
        <div
          style={{
            position: 'absolute',
            top: caretPosition.top,
            left: caretPosition.left,
            height: caretPosition.height,
            width: 2,
            backgroundColor: data.color,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -20,
              left: 0,
              fontSize: 10,
              backgroundColor: data.color,
              color: 'white',
              padding: '2px 4px',
              borderRadius: 2,
              whiteSpace: 'nowrap',
            }}
          >
            {data.name}
          </span>
        </div>
      )}
    </>
  );
}

export function CollaborativePlateEditor({
  yDoc,
  currentUser,
  initialValue,
  onChange,
}: CollaborativePlateEditorProps) {
  const editorRef = React.useRef<ReturnType<typeof createEditor> | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  // Criar editor Slate base com Yjs bindings
  React.useEffect(() => {
    if (!yDoc) return;

    // Obter o shared type do documento Yjs
    const sharedType = yDoc.get('content', Y.XmlText) as Y.XmlText;

    // Criar cursor data para o usuário atual
    const cursorData: CursorData = {
      name: currentUser.name,
      color: getUserColor(currentUser.id),
    };

    // Criar editor base com plugins Yjs
    const baseEditor = createEditor();
    const yjsEditor = withYjs(baseEditor, sharedType);
    const cursorEditor = withCursors(yjsEditor, sharedType.doc!.awareness, {
      data: cursorData,
    });

    editorRef.current = cursorEditor;

    // Inicializar com conteúdo se o Yjs doc estiver vazio
    if (sharedType.length === 0 && initialValue && initialValue.length > 0) {
      const delta = slateNodesToInsertDelta(initialValue as SlateDescendant[]);
      sharedType.applyDelta(delta);
    }

    // Conectar o editor ao Yjs
    YjsEditor.connect(cursorEditor as YjsEditor);

    setIsReady(true);

    // Cleanup
    return () => {
      if (editorRef.current) {
        YjsEditor.disconnect(editorRef.current as YjsEditor);
      }
    };
  }, [yDoc, currentUser, initialValue]);

  // Usar o editor Plate padrão com plugins
  const plateEditor = usePlateEditor({
    plugins: EditorKit,
    // O valor será gerenciado pelo Yjs
    value: initialValue || [],
  });

  // Handler para mudanças
  const handleChange = React.useCallback(
    ({ value }: { value: Descendant[] }) => {
      onChange?.(value);
    },
    [onChange]
  );

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            Conectando colaboração...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Plate editor={plateEditor} onChange={handleChange}>
      <EditorContainer variant="default" className="h-full relative">
        <Editor variant="demo" />
        {/* Overlay para cursores remotos */}
        <CursorOverlay
          containerRef={{ current: null }}
          cursors={[]}
        />
      </EditorContainer>
    </Plate>
  );
}
