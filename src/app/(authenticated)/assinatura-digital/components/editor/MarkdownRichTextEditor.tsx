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
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { deserializeMd, MarkdownPlugin, serializeMd } from '@platejs/markdown';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Variable as VariableIcon,
} from 'lucide-react';
import { Plate, ParagraphPlugin, usePlateEditor, useEditorRef } from 'platejs/react';

import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { Toolbar, ToolbarGroup, ToolbarButton } from '@/components/editor/plate-ui/toolbar';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { AlignToolbarButton } from '@/components/editor/plate-ui/align-toolbar-button';
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
import { VariablePlugin, insertVariable } from '@/components/editor/plate/variable-plugin';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { getAvailableVariables, type VariableOption } from './editor-helpers';

const MarkdownEditorKit = [
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
  VariablePlugin,
  MarkdownPlugin,
  ...IndentKit,
  ListPlugin.configure({
    inject: { targetPlugins: [KEYS.p] },
    render: { belowNodes: BlockList },
  }),
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'start',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'justify'],
      },
      targetPlugins: [KEYS.p],
    },
  }),
];

function VariableInserter({ formularios }: { formularios: string[] }) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const variables = getAvailableVariables(formularios);

  const grouped = variables.reduce<Record<string, VariableOption[]>>((acc, v) => {
    const group = v.label.split(':')[0]?.trim() ?? 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(v);
    return acc;
  }, {});

  const handleSelect = (variable: VariableOption) => {
    insertVariable(editor, variable.value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton tooltip="Inserir variável" pressed={open}>
          <VariableIcon />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent className={cn(/* design-system-escape: p-0 */ 'w-80 p-0')} align="start">
        <Command>
          <CommandInput placeholder="Buscar variável..." />
          <CommandList>
            <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
            {Object.entries(grouped).map(([group, groupVars]) => (
              <CommandGroup key={group} heading={group}>
                {groupVars.map((variable) => (
                  <CommandItem
                    key={variable.value}
                    onSelect={() => handleSelect(variable)}
                  >
                    {variable.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MarkdownRichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  formularios: string[];
}

export function MarkdownRichTextEditor({
  value,
  onChange,
  formularios,
}: MarkdownRichTextEditorProps) {
  const isInternalUpdate = React.useRef(false);

  const editor = usePlateEditor({
    plugins: MarkdownEditorKit,
    value: (e) => {
      try {
        return deserializeMd(e, value || '');
      } catch {
        return [{ type: 'p', children: [{ text: value || '' }] }];
      }
    },
  });

  // Sincroniza value externo quando não está com foco.
  // editor de usePlateEditor é referência estável — não precisa ser dep.
  React.useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    try {
      const newValue = deserializeMd(editor, value || '');
      editor.tf.setValue(newValue);
    } catch {
      // ignorar erros de parse
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = React.useCallback(
    ({ value: newValue }: { value: Value }) => {
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
      <div className="rounded-md border">
        <Toolbar
          className={cn(
            /* design-system-escape: p-1 */ 'scrollbar-hide flex-wrap justify-start border-b border-border bg-muted/30 p-1'
          )}
        >
          <div className={cn(/* design-system-escape: gap-0.5 */ 'flex flex-1 flex-wrap items-center gap-0.5')}>
            <ToolbarGroup>
              <UndoToolbarButton />
              <RedoToolbarButton />
            </ToolbarGroup>
            <ToolbarGroup>
              <MarkToolbarButton nodeType={KEYS.bold} tooltip="Negrito (⌘+B)">
                <BoldIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.italic} tooltip="Itálico (⌘+I)">
                <ItalicIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.underline} tooltip="Sublinhado (⌘+U)">
                <UnderlineIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Tachado">
                <StrikethroughIcon />
              </MarkToolbarButton>
            </ToolbarGroup>
            <ToolbarGroup>
              <BulletedListToolbarButton />
              <NumberedListToolbarButton />
            </ToolbarGroup>
            <ToolbarGroup>
              <AlignToolbarButton />
            </ToolbarGroup>
            <ToolbarGroup>
              <LinkToolbarButton />
            </ToolbarGroup>
            <ToolbarGroup>
              <VariableInserter formularios={formularios} />
            </ToolbarGroup>
          </div>
        </Toolbar>
        <EditorContainer
          variant="default"
          className="[&_.slate-selection-area]:bg-transparent"
        >
          <Editor
            variant="none"
            className={cn(
              /* design-system-escape: p-4 */ 'min-h-40 flex-1 overflow-y-auto p-4 max-h-[calc(85vh-250px)]'
            )}
            placeholder="Digite seu texto aqui..."
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}
