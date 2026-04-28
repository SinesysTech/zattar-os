'use client';

import * as React from 'react';

import type { Value } from 'platejs';
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
} from '@platejs/basic-nodes/react';
import { BlockquotePlugin } from '@platejs/basic-nodes/react';
import { ParagraphPlugin } from 'platejs/react';
import { ListPlugin } from '@platejs/list/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';
import { Plate, usePlateEditor, useEditorRef } from 'platejs/react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  Variable as VariableIcon,
} from 'lucide-react';

import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockquoteElement } from '@/components/editor/plate-ui/blockquote-node';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { ToolbarGroup, Toolbar } from '@/components/editor/plate-ui/toolbar';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
} from '@/components/editor/plate-ui/list-toolbar-button';
import { AlignToolbarButton } from '@/components/editor/plate-ui/align-toolbar-button';
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from '@/components/editor/plate-ui/history-toolbar-button';
import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
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
import { ToolbarButton } from '@/components/editor/plate-ui/toolbar';
import { VariablePlugin, insertVariable } from '@/components/editor/plate/variable-plugin';
import type { ConteudoComposto } from '@/shared/assinatura-digital/types/template.types';
import {
  getAvailableVariables,
  tiptapJsonToPlateValue,
  plateValueToTiptapJson,
  type VariableOption,
  type StorageDocument,
} from './editor-helpers';
import { cn } from '@/lib/utils';

const SignatureEditorKit = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BlockquotePlugin.configure({
    node: { component: BlockquoteElement },
  }),

  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,

  VariablePlugin,

  ...IndentKit,
  ListPlugin.configure({
    inject: {
      targetPlugins: [KEYS.p, KEYS.blockquote],
    },
    render: {
      belowNodes: BlockList,
    },
  }),

  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: 'start',
        nodeKey: 'align',
        styleKey: 'textAlign',
        validNodeValues: ['start', 'left', 'center', 'right', 'justify'],
      },
      targetPlugins: [KEYS.p, KEYS.blockquote],
    },
  }),
];

function generateTemplateString(value: Value): string {
  let result = '';

  const traverse = (node: Record<string, unknown>) => {
    if ('text' in node) {
      result += (node.text as string) ?? '';
      return;
    }

    const type = node.type as string;

    if (type === 'variable') {
      const key = node.key as string;
      if (key) result += `{{${key}}}`;
      return;
    }

    const children = node.children as Record<string, unknown>[] | undefined;
    if (children) {
      children.forEach(traverse);
    }

    if (type === 'p' || type === 'blockquote') {
      result += '\n';
    }
  };

  for (const node of value) {
    traverse(node as Record<string, unknown>);
  }

  return result.trim();
}

function VariableInserter({
  formularios,
}: {
  formularios: string[];
}) {
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
      <PopoverContent className={cn(/* design-system-escape: p-0 */ "w-80 p-0")} align="start">
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

function SignatureToolbarButtons({
  formularios,
  toolbarExtra,
}: {
  formularios: string[];
  toolbarExtra?: React.ReactNode;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-0.5 */ "flex flex-1 flex-wrap items-center gap-0.5")}>
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
        <AlignToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <BulletedListToolbarButton />
        <NumberedListToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <VariableInserter formularios={formularios} />
      </ToolbarGroup>

      {toolbarExtra && (
        <div className="ml-auto flex items-center">
          {toolbarExtra}
        </div>
      )}
    </div>
  );
}

interface RichTextEditorProps {
  value?: ConteudoComposto;
  onChange: (value: ConteudoComposto) => void;
  formularios: string[];
  toolbarExtra?: React.ReactNode;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  formularios,
  toolbarExtra,
  className,
}: RichTextEditorProps): JSX.Element {
  const initialValue = React.useMemo<Value>(() => {
    if (value?.json) {
      try {
        return tiptapJsonToPlateValue(value.json as StorageDocument);
      } catch {
        // fall through to default
      }
    }
    return [{ type: 'p', children: [{ text: '' }] }];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = usePlateEditor({
    plugins: SignatureEditorKit,
    value: initialValue,
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value: plateValue }) => {
        const json = plateValueToTiptapJson(plateValue);
        const template = generateTemplateString(plateValue);
        onChange({ json: json as Record<string, unknown>, template });
      }}
    >
      <div className={cn('flex flex-col rounded-lg border', className)}>
        <Toolbar
          className={cn(
            /* design-system-escape: p-1 */ "scrollbar-hide flex-wrap justify-start border-b border-border bg-muted/30 p-1"
          )}
        >
          <SignatureToolbarButtons formularios={formularios} toolbarExtra={toolbarExtra} />
        </Toolbar>

        <EditorContainer
          variant="default"
          className="[&_.slate-selection-area]:bg-transparent"
        >
          <Editor
            variant="none"
            className={cn(
              /* design-system-escape: p-4 */ "min-h-40 flex-1 overflow-y-auto p-4"
            )}
            placeholder="Digite o conteúdo aqui..."
          />
        </EditorContainer>
      </div>
    </Plate>
  );
}
