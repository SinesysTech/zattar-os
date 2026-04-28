'use client';

import * as React from 'react';

import type { Value } from 'platejs';
import { KEYS } from 'platejs';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { LinkPlugin } from '@platejs/link/react';
import { deserializeMd, MarkdownPlugin, serializeMd } from '@platejs/markdown';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { Plate, ParagraphPlugin, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { ToolbarGroup } from '@/components/editor/plate-ui/toolbar';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
} from '@/components/editor/plate-ui/list-toolbar-button';
import {
  UndoToolbarButton,
  RedoToolbarButton,
} from '@/components/editor/plate-ui/history-toolbar-button';
import { LinkToolbarButton } from '@/components/editor/plate-ui/link-toolbar-button';
import { LinkElement } from '@/components/editor/plate-ui/link-node';
import { LinkFloatingToolbar } from '@/components/editor/plate-ui/link-toolbar';
import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const NoteEditorKit = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
  MarkdownPlugin,
  ...IndentKit,
  ListPlugin.configure({
    inject: { targetPlugins: [KEYS.p] },
    render: { belowNodes: BlockList },
  }),
];

export interface NoteEditorProps {
  value?: string; // markdown string (ou HTML legado — exibido como plain text)
  onChange?: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  editorContentClassName?: string;
  toolbarRight?: React.ReactNode;
  autofocus?: boolean;
  editable?: boolean;
}

export function NoteEditor({
  value = '',
  onChange,
  placeholder = '',
  className,
  editorContentClassName,
  toolbarRight,
  autofocus = false,
  editable = true,
}: NoteEditorProps) {
  const isInternalUpdate = React.useRef(false);

  const editor = usePlateEditor({
    plugins: NoteEditorKit,
    value: (e) => {
      try {
        return deserializeMd(e, value);
      } catch {
        return [{ type: 'p', children: [{ text: value }] }];
      }
    },
  });

  // Sincroniza value externo (ex: reset do modal) quando não originou do próprio editor.
  // editor de usePlateEditor é referência estável — não precisa ser dep.
  React.useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    try {
      editor.tf.setValue(deserializeMd(editor, value));
    } catch {
      // ignorar
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = React.useCallback(
    ({ value: newValue }: { value: Value }) => {
      if (!onChange) return;
      isInternalUpdate.current = true;
      try {
        const markdown = serializeMd(editor, { value: newValue });
        onChange(markdown);
      } catch {
        // ignorar
      }
    },
    [editor, onChange]
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div
        className={cn(
          'flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-xs focus-within:border-primary',
          className
        )}
      >
        <div className="shrink-0 border-b border-border p-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex w-max items-center gap-px">
                <ToolbarGroup>
                  <MarkToolbarButton nodeType={KEYS.bold} tooltip="Negrito">
                    <Bold className="h-4 w-4" />
                  </MarkToolbarButton>
                  <MarkToolbarButton nodeType={KEYS.italic} tooltip="Itálico">
                    <Italic className="h-4 w-4" />
                  </MarkToolbarButton>
                  <MarkToolbarButton nodeType={KEYS.underline} tooltip="Sublinhado">
                    <Underline className="h-4 w-4" />
                  </MarkToolbarButton>
                  <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Tachado">
                    <Strikethrough className="h-4 w-4" />
                  </MarkToolbarButton>
                </ToolbarGroup>
                <Separator orientation="vertical" className="mx-2 h-7" />
                <ToolbarGroup>
                  <BulletedListToolbarButton />
                  <NumberedListToolbarButton />
                </ToolbarGroup>
                <Separator orientation="vertical" className="mx-2 h-7" />
                <LinkToolbarButton />
                <Separator orientation="vertical" className="mx-2 h-7" />
                <ToolbarGroup>
                  <UndoToolbarButton />
                  <RedoToolbarButton />
                </ToolbarGroup>
              </div>
            </div>
            {toolbarRight && (
              <div className="flex shrink-0 items-center gap-2">
                <Separator orientation="vertical" className="h-7" />
                <div className="flex items-center gap-1">{toolbarRight}</div>
              </div>
            )}
          </div>
        </div>
        <EditorContainer className={editorContentClassName}>
          <Editor
            placeholder={placeholder}
            autoFocus={autofocus}
            readOnly={!editable}
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}

export default NoteEditor;
