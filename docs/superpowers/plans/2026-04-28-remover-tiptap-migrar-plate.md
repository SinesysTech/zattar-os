# Remover TipTap — Migrar para Plate.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover todos os 12 pacotes @tiptap/* do projeto, substituindo os 3 editores TipTap (Notas, Assinatura Digital × 2) por equivalentes Plate.js, eliminando o conflito de peer-deps que impede `npm update`.

**Architecture:**
- O `template-pdf.service.ts` não importa TipTap SDK — apenas processa JSON como dado. Portanto o formato de armazenamento TipTap-compatível no banco (campo `conteudo_composto.json`) é mantido sem migration de dados. Criamos conversores Plate ↔ TipTap-JSON no layer de editor.
- Notas migram de HTML para markdown string (já suportado por `@platejs/markdown` instalado), mantendo `content: z.string()` sem mudança de schema.
- A extensão Variable do TipTap vira um `VariablePlugin` Plate.js inline void element.

**Tech Stack:** Plate.js v52 (platejs, @platejs/basic-nodes, @platejs/basic-styles, @platejs/list, @platejs/link, @platejs/markdown), React 19, TypeScript 5, Next.js 16

---

## Mapa de Arquivos

**Criar:**
- `src/components/editor/plate/variable-plugin.tsx` — Plugin Plate.js para nó inline de variável `{{key}}`
- `src/components/editor/plate/note-editor.tsx` — Editor de notas com toolbar, saída markdown

**Modificar:**
- `src/app/(authenticated)/assinatura-digital/components/editor/editor-helpers.ts` — Adicionar conversores `tiptapJsonToPlateValue` / `plateValueToTiptapJson`; renomear tipos para evitar confusão com SDK TipTap
- `src/app/(authenticated)/assinatura-digital/components/editor/RichTextEditor.tsx` — Reescrever usando Plate.js + VariablePlugin
- `src/app/(authenticated)/assinatura-digital/components/editor/MarkdownRichTextEditor.tsx` — Reescrever usando Plate.js + MarkdownKit + VariablePlugin
- `src/app/(authenticated)/notas/components/add-note-modal.tsx` — Substituir `MinimalTiptapEditor` por `NoteEditor`
- `src/shared/assinatura-digital/services/template-pdf.service.ts` — Renomear função `tiptapJsonToRichParagraphs` → `richTextJsonToParagraphs`
- `package.json` — Remover 12 dependências @tiptap/*

**Deletar:**
- `src/components/ui/custom/minimal-tiptap/` (diretório inteiro — 29 arquivos)
- `src/app/(authenticated)/assinatura-digital/components/editor/extensions/Variable.ts`

---

## Task 1: Criar VariablePlugin para Plate.js

**Files:**
- Create: `src/components/editor/plate/variable-plugin.tsx`

- [ ] **Step 1: Criar o plugin**

```tsx
'use client';

import React from 'react';
import { createPlatePlugin } from 'platejs/react';
import type { PlateRenderElementProps } from 'platejs/react';

export const VARIABLE_ELEMENT = 'variable';

export type VariableElementType = {
  type: typeof VARIABLE_ELEMENT;
  key: string;
  children: [{ text: '' }];
};

function VariableElementComponent({
  element,
  attributes,
  children,
}: PlateRenderElementProps) {
  const variableKey = (element as unknown as VariableElementType).key ?? '';

  return (
    <span
      {...attributes}
      contentEditable={false}
      data-variable-key={variableKey}
      className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 select-none"
    >
      {`{{${variableKey}}}`}
      {children}
    </span>
  );
}

export const VariablePlugin = createPlatePlugin({
  key: VARIABLE_ELEMENT,
  node: {
    isElement: true,
    isInline: true,
    isVoid: true,
    component: VariableElementComponent,
  },
});

export function insertVariable(editor: ReturnType<typeof import('platejs/react').useEditorRef>, key: string) {
  editor.tf.insertNodes({
    type: VARIABLE_ELEMENT,
    key,
    children: [{ text: '' }],
  } as unknown as Parameters<typeof editor.tf.insertNodes>[0]);
}
```

- [ ] **Step 2: Verificar type-check do arquivo**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "variable-plugin"
```

Esperado: sem erros relacionados a `variable-plugin`.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/plate/variable-plugin.tsx
git commit -m "feat: adiciona VariablePlugin Plate.js para substituir extensão TipTap Variable"
```

---

## Task 2: Adicionar conversores Plate ↔ TipTap JSON em editor-helpers.ts

**Files:**
- Modify: `src/app/(authenticated)/assinatura-digital/components/editor/editor-helpers.ts`

Contexto: Os campos `conteudo_composto.json` no banco guardam TipTap JSON. O PDF service processa esse JSON sem importar TipTap SDK. Precisamos de conversores bidirecionais para que o editor Plate.js possa carregar e salvar nesse formato.

TipTap JSON: `{ type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: 'left' }, content: [{ type: 'text', text: 'oi', marks: [{ type: 'bold' }] }] }] }`

Plate.js Value: `[{ type: 'p', align: 'left', children: [{ text: 'oi', bold: true }] }]`

- [ ] **Step 1: Adicionar os conversores ao final do editor-helpers.ts**

Adicionar após a última função existente:

```ts
import type { Value, TDescendant } from 'platejs';

// ─── Storage format types (TipTap-compatible JSON, stored in DB) ───────────────

export type StorageNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: StorageNode[];
  text?: string;
  marks?: { type: string }[];
};

export type StorageDocument = {
  type: 'doc';
  content: StorageNode[];
};

// ─── Converters: TipTap Storage JSON ↔ Plate.js Value ──────────────────────────

function storageNodeToPlate(node: StorageNode): TDescendant | null {
  if (node.type === 'text') {
    const marks: Record<string, boolean> = {};
    for (const m of node.marks ?? []) {
      if (m.type === 'bold') marks.bold = true;
      if (m.type === 'italic') marks.italic = true;
      if (m.type === 'underline') marks.underline = true;
      if (m.type === 'strike') marks.strikethrough = true;
    }
    return { text: node.text ?? '', ...marks };
  }

  if (node.type === 'variable') {
    return {
      type: 'variable',
      key: (node.attrs?.key as string) ?? '',
      children: [{ text: '' }],
    } as unknown as TDescendant;
  }

  if (node.type === 'hardBreak') {
    return { text: '\n' };
  }

  const TYPE_MAP: Record<string, string> = {
    paragraph: 'p',
    heading: 'h_placeholder', // ajustado abaixo por level
    blockquote: 'blockquote',
    bulletList: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    horizontalRule: 'hr',
  };

  let plateType = TYPE_MAP[node.type] ?? node.type;

  if (node.type === 'heading' && node.attrs?.level) {
    plateType = `h${node.attrs.level}`;
  }

  const children = (node.content ?? [])
    .map(storageNodeToPlate)
    .filter(Boolean) as TDescendant[];

  const element: Record<string, unknown> = {
    type: plateType,
    children: children.length > 0 ? children : [{ text: '' }],
  };

  if (node.attrs?.textAlign) {
    element.align = node.attrs.textAlign;
  }

  return element as TDescendant;
}

function plateNodeToStorage(node: TDescendant): StorageNode | null {
  // Leaf node (texto)
  if ('text' in node) {
    const marks: { type: string }[] = [];
    if ((node as Record<string, unknown>).bold) marks.push({ type: 'bold' });
    if ((node as Record<string, unknown>).italic) marks.push({ type: 'italic' });
    if ((node as Record<string, unknown>).underline) marks.push({ type: 'underline' });
    if ((node as Record<string, unknown>).strikethrough) marks.push({ type: 'strike' });
    return {
      type: 'text',
      text: node.text as string,
      ...(marks.length > 0 && { marks }),
    };
  }

  const plateType = (node as Record<string, unknown>).type as string;

  if (plateType === 'variable') {
    return {
      type: 'variable',
      attrs: { key: (node as Record<string, unknown>).key as string ?? '' },
    };
  }

  const TYPE_MAP: Record<string, string> = {
    p: 'paragraph',
    blockquote: 'blockquote',
    hr: 'horizontalRule',
    ul: 'bulletList',
    ol: 'orderedList',
    li: 'listItem',
  };

  let storageType = TYPE_MAP[plateType] ?? plateType;
  const attrs: Record<string, unknown> = {};

  if (plateType.match(/^h[1-6]$/)) {
    storageType = 'heading';
    attrs.level = parseInt(plateType[1]);
  }

  const align = (node as Record<string, unknown>).align;
  if (align) attrs.textAlign = align;

  const rawChildren = (node as Record<string, unknown>).children as TDescendant[] | undefined;
  const content = (rawChildren ?? [])
    .map(plateNodeToStorage)
    .filter(Boolean) as StorageNode[];

  return {
    type: storageType,
    ...(Object.keys(attrs).length > 0 && { attrs }),
    content,
  };
}

export function tiptapJsonToPlateValue(doc: StorageDocument): Value {
  return (doc.content ?? [])
    .map(storageNodeToPlate)
    .filter(Boolean) as Value;
}

export function plateValueToTiptapJson(value: Value): StorageDocument {
  return {
    type: 'doc',
    content: value
      .map(plateNodeToStorage)
      .filter(Boolean) as StorageNode[],
  };
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "editor-helpers"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/assinatura-digital/components/editor/editor-helpers.ts
git commit -m "feat: adiciona conversores Plate.js ↔ TipTap storage JSON em editor-helpers"
```

---

## Task 3: Migrar RichTextEditor.tsx (Assinatura Digital)

**Files:**
- Modify: `src/app/(authenticated)/assinatura-digital/components/editor/RichTextEditor.tsx`

Contexto: O `RichTextEditor` é o editor principal de campos `texto_composto` nos templates. Recebe `value?: ConteudoComposto` (`{ json, template }`) e chama `onChange({ json, template })`. O campo `template` é a string com `{{variavel}}` interpolados.

- [ ] **Step 1: Reescrever RichTextEditor.tsx**

```tsx
'use client';

import React, { useCallback, useRef } from 'react';
import { Plate, usePlateEditor, useEditorRef } from 'platejs/react';
import { ParagraphPlugin } from 'platejs/react';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin } from '@platejs/basic-nodes/react';
import { BlockquotePlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { KEYS } from 'platejs';
import type { Value } from 'platejs';

import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { Toolbar, ToolbarGroup } from '@/components/editor/plate-ui/toolbar';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { AlignToolbarButton } from '@/components/editor/plate-ui/align-toolbar-button';
import { BulletedListToolbarButton, NumberedListToolbarButton } from '@/components/editor/plate-ui/list-toolbar-button';
import { UndoToolbarButton, RedoToolbarButton } from '@/components/editor/plate-ui/history-toolbar-button';
import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { VariablePlugin, insertVariable, VARIABLE_ELEMENT } from '@/components/editor/plate/variable-plugin';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo, Redo, Variable as VariableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConteudoComposto } from '@/shared/assinatura-digital/types/template.types';
import {
  getAvailableVariables, type VariableOption,
  tiptapJsonToPlateValue, plateValueToTiptapJson,
  type StorageDocument,
} from './editor-helpers';

// Plugin kit compacto para assinatura digital
const AssinaturaEditorKit = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  BlockquotePlugin,
  VariablePlugin,
  ...IndentKit,
  ListPlugin.configure({
    inject: { targetPlugins: [KEYS.p, KEYS.blockquote] },
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
      targetPlugins: [KEYS.p, KEYS.blockquote],
    },
  }),
];

// Gera template string a partir do Plate.js Value
function plateValueToTemplate(value: Value): string {
  const parts: string[] = [];

  function walk(nodes: Value | unknown[]) {
    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      if (typeof n.text === 'string') {
        parts.push(n.text);
      } else if (n.type === VARIABLE_ELEMENT && n.key) {
        parts.push(`{{${n.key}}}`);
      } else if (n.type === 'break') {
        parts.push('\n');
      } else if (Array.isArray(n.children)) {
        walk(n.children as unknown[]);
        if (n.type === 'p' || n.type === 'blockquote' || (typeof n.type === 'string' && n.type.match(/^h[1-6]$/))) {
          parts.push('\n');
        }
      }
    }
  }

  walk(value);
  return parts.join('').trim();
}

interface RichTextEditorProps {
  value?: ConteudoComposto;
  onChange: (value: ConteudoComposto) => void;
  formularios: string[];
  toolbarExtra?: React.ReactNode;
  className?: string;
}

export function RichTextEditor({ value, onChange, formularios, toolbarExtra, className }: RichTextEditorProps) {
  const [isVariableOpen, setIsVariableOpen] = React.useState(false);
  const variables = getAvailableVariables(formularios);

  const initialValue = React.useMemo<Value>(() => {
    if (value?.json && typeof value.json === 'object') {
      try {
        return tiptapJsonToPlateValue(value.json as StorageDocument);
      } catch {
        // fallback
      }
    }
    return [{ type: 'p', children: [{ text: '' }] }];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const editor = usePlateEditor({
    plugins: AssinaturaEditorKit,
    value: initialValue,
  });

  const handleChange = useCallback(({ value: newValue }: { value: Value }) => {
    const json = plateValueToTiptapJson(newValue);
    const template = plateValueToTemplate(newValue);
    onChange({ json, template });
  }, [onChange]);

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div className={cn('border rounded-lg flex flex-col', className)}>
        <div className="border-b p-2 flex flex-wrap items-center gap-1 shrink-0">
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Negrito"><Bold className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Itálico"><Italic className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.underline} tooltip="Sublinhado"><Underline className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.strikethrough} tooltip="Tachado"><Strikethrough className="h-4 w-4" /></MarkToolbarButton>
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <AlignToolbarButton value="left" tooltip="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="center" tooltip="Centralizar"><AlignCenter className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="right" tooltip="Alinhar à direita"><AlignRight className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="justify" tooltip="Justificar"><AlignJustify className="h-4 w-4" /></AlignToolbarButton>
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <BulletedListToolbarButton />
            <NumberedListToolbarButton />
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <VariableInserter variables={variables} />
          {toolbarExtra && (
            <>
              <Separator orientation="vertical" className="h-6" />
              {toolbarExtra}
            </>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <EditorContainer>
            <Editor placeholder="Digite o conteúdo aqui..." />
          </EditorContainer>
        </div>
      </div>
    </Plate>
  );
}

function VariableInserter({ variables }: { variables: VariableOption[] }) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const grouped = React.useMemo(() => {
    return variables.reduce<Record<string, VariableOption[]>>((acc, v) => {
      const group = v.label.split(':')[0]?.trim() || 'Outros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(v);
      return acc;
    }, {});
  }, [variables]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" tooltip="Inserir variável">
          <VariableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar variável..." />
          <CommandList>
            <CommandEmpty>Nenhuma variável encontrada.</CommandEmpty>
            {Object.entries(grouped).map(([group, vars]) => (
              <CommandGroup key={group} heading={group}>
                {vars.map((v) => (
                  <CommandItem
                    key={v.value}
                    onSelect={() => {
                      editor.tf.focus();
                      insertVariable(editor, v.value);
                      setOpen(false);
                    }}
                  >
                    {v.label}
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
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "RichTextEditor"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/assinatura-digital/components/editor/RichTextEditor.tsx
git commit -m "feat: migra RichTextEditor assinatura-digital de TipTap para Plate.js"
```

---

## Task 4: Migrar MarkdownRichTextEditor.tsx

**Files:**
- Modify: `src/app/(authenticated)/assinatura-digital/components/editor/MarkdownRichTextEditor.tsx`

Contexto: Usado em campos de formulário que armazenam markdown com variáveis `{{key}}`. Recebe `value: string` (markdown) e chama `onChange(markdown: string)`. O MarkdownPlugin já está instalado via `@platejs/markdown`.

- [ ] **Step 1: Reescrever MarkdownRichTextEditor.tsx**

```tsx
'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { Plate, usePlateEditor, useEditorRef } from 'platejs/react';
import { ParagraphPlugin } from 'platejs/react';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { LinkPlugin } from '@platejs/link/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { MarkdownPlugin } from '@platejs/markdown/react';
import { KEYS } from 'platejs';
import type { Value } from 'platejs';

import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { Toolbar, ToolbarGroup } from '@/components/editor/plate-ui/toolbar';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { AlignToolbarButton } from '@/components/editor/plate-ui/align-toolbar-button';
import { BulletedListToolbarButton, NumberedListToolbarButton } from '@/components/editor/plate-ui/list-toolbar-button';
import { UndoToolbarButton, RedoToolbarButton } from '@/components/editor/plate-ui/history-toolbar-button';
import { LinkToolbarButton } from '@/components/editor/plate-ui/link-toolbar-button';
import { LinkElement } from '@/components/editor/plate-ui/link-node';
import { LinkFloatingToolbar } from '@/components/editor/plate-ui/link-toolbar';
import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { VariablePlugin, insertVariable } from '@/components/editor/plate/variable-plugin';
import { Combobox } from '@/components/ui/combobox';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableVariables, type VariableOption } from './editor-helpers';

const MarkdownEditorKit = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  LinkPlugin.configure({
    render: { node: LinkElement, afterEditable: () => <LinkFloatingToolbar /> },
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

interface MarkdownRichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  formularios: string[];
}

export function MarkdownRichTextEditor({ value, onChange, formularios }: MarkdownRichTextEditorProps) {
  const variables = getAvailableVariables(formularios);
  const [selectedVariable, setSelectedVariable] = React.useState<string[]>([]);
  const isInternalUpdate = useRef(false);

  const editor = usePlateEditor({
    plugins: MarkdownEditorKit,
    value: (e) => {
      try {
        return e.api.markdown.deserialize(value || '');
      } catch {
        return [{ type: 'p', children: [{ text: value || '' }] }];
      }
    },
  });

  // Sync external value changes when not focused
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    try {
      const newValue = editor.api.markdown.deserialize(value || '');
      editor.tf.setValue(newValue);
    } catch {
      // ignore parse errors
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Insert selected variable
  useEffect(() => {
    if (selectedVariable.length === 0) return;
    const variableKey = selectedVariable[0];
    const variable = variables.find((v: VariableOption) => v.value === variableKey);
    if (!variable) return;
    const insert = () => {
      try {
        editor.tf.focus();
        insertVariable(editor, variable.value);
        setSelectedVariable([]);
      } catch {
        setSelectedVariable([]);
      }
    };
    setTimeout(insert, 150);
  }, [selectedVariable]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(({ value: newValue }: { value: Value }) => {
    isInternalUpdate.current = true;
    try {
      const markdown = editor.api.markdown.serialize({ value: newValue });
      onChange(markdown);
    } catch {
      // ignore
    }
  }, [editor, onChange]);

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div className="border rounded-md">
        <div className="border-b p-2 flex flex-wrap gap-1">
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold}><Bold className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.italic}><Italic className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.underline}><Underline className="h-4 w-4" /></MarkToolbarButton>
            <MarkToolbarButton nodeType={KEYS.strikethrough}><Strikethrough className="h-4 w-4" /></MarkToolbarButton>
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <BulletedListToolbarButton />
            <NumberedListToolbarButton />
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <ToolbarGroup>
            <AlignToolbarButton value="left"><AlignLeft className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="center"><AlignCenter className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="right"><AlignRight className="h-4 w-4" /></AlignToolbarButton>
            <AlignToolbarButton value="justify"><AlignJustify className="h-4 w-4" /></AlignToolbarButton>
          </ToolbarGroup>
          <Separator orientation="vertical" className="h-6" />
          <LinkToolbarButton />
          <Separator orientation="vertical" className="h-6" />
          <Combobox
            options={variables.map((v: VariableOption) => ({ value: v.value, label: v.label }))}
            value={selectedVariable}
            onValueChange={setSelectedVariable}
            placeholder="Inserir variável..."
            searchPlaceholder="Buscar variável..."
            emptyText="Nenhuma variável encontrada"
            className="w-48"
          />
        </div>
        <div className="p-4 max-h-[calc(85vh-250px)] overflow-y-auto">
          <EditorContainer>
            <Editor placeholder="Digite seu texto aqui..." />
          </EditorContainer>
        </div>
      </div>
    </Plate>
  );
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "MarkdownRichTextEditor"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/assinatura-digital/components/editor/MarkdownRichTextEditor.tsx
git commit -m "feat: migra MarkdownRichTextEditor de TipTap para Plate.js + MarkdownPlugin"
```

---

## Task 5: Criar NoteEditor (substituir MinimalTiptapEditor nas Notas)

**Files:**
- Create: `src/components/editor/plate/note-editor.tsx`

Contexto: O `add-note-modal.tsx` usa `MinimalTiptapEditor` com `output="html"`. O `NoteEditor` substitui esse componente e armazena o conteúdo como **markdown** (em vez de HTML). Notas existentes com HTML no banco serão exibidas como plain-text ao editar — aceitável num sistema interno. O campo `content: z.string()` do schema não muda.

A prop API espelha `MinimalTiptapEditor`: `value`, `onChange`, `placeholder`, `className`, `editorContentClassName`, `toolbarRight`, `autofocus`, `editable`.

- [ ] **Step 1: Criar note-editor.tsx**

```tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { ParagraphPlugin } from 'platejs/react';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { LinkPlugin } from '@platejs/link/react';
import { MediaPlugin } from '@platejs/media/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { MarkdownPlugin } from '@platejs/markdown/react';
import { KEYS } from 'platejs';
import type { Value } from 'platejs';

import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { Toolbar, ToolbarGroup } from '@/components/editor/plate-ui/toolbar';
import { MarkToolbarButton } from '@/components/editor/plate-ui/mark-toolbar-button';
import { BulletedListToolbarButton, NumberedListToolbarButton } from '@/components/editor/plate-ui/list-toolbar-button';
import { UndoToolbarButton, RedoToolbarButton } from '@/components/editor/plate-ui/history-toolbar-button';
import { LinkToolbarButton } from '@/components/editor/plate-ui/link-toolbar-button';
import { LinkElement } from '@/components/editor/plate-ui/link-node';
import { LinkFloatingToolbar } from '@/components/editor/plate-ui/link-toolbar';
import { ParagraphElement } from '@/components/editor/plate-ui/paragraph-node';
import { BlockList } from '@/components/editor/plate-ui/block-list';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';

const NoteEditorKit = [
  ParagraphPlugin.withComponent(ParagraphElement),
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  LinkPlugin.configure({
    render: { node: LinkElement, afterEditable: () => <LinkFloatingToolbar /> },
  }),
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
        validNodeValues: ['start', 'left', 'center', 'right'],
      },
      targetPlugins: [KEYS.p],
    },
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
  const editor = usePlateEditor({
    plugins: NoteEditorKit,
    value: (e) => {
      try {
        return e.api.markdown.deserialize(value);
      } catch {
        return [{ type: 'p', children: [{ text: value }] }];
      }
    },
  });

  const handleChange = React.useCallback(({ value: newValue }: { value: Value }) => {
    if (!onChange) return;
    try {
      const markdown = editor.api.markdown.serialize({ value: newValue });
      onChange(markdown);
    } catch {
      // ignore
    }
  }, [editor, onChange]);

  return (
    <Plate editor={editor} onChange={handleChange}>
      <div
        className={cn(
          'flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-xs focus-within:border-primary',
          className
        )}
      >
        {/* Toolbar */}
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
        {/* Editor area */}
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
```

- [ ] **Step 2: Verificar type-check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "note-editor"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/plate/note-editor.tsx
git commit -m "feat: cria NoteEditor Plate.js com serialização markdown para substituir MinimalTiptapEditor"
```

---

## Task 6: Atualizar add-note-modal.tsx

**Files:**
- Modify: `src/app/(authenticated)/notas/components/add-note-modal.tsx`

- [ ] **Step 1: Substituir import e tipo de valor**

Remover:
```tsx
import { MinimalTiptapEditor } from "@/components/ui/custom/minimal-tiptap";
import { Content } from "@tiptap/react";
```

Adicionar:
```tsx
import { NoteEditor } from "@/components/editor/plate/note-editor";
```

- [ ] **Step 2: Atualizar tipo do state de value**

Alterar:
```tsx
const [value, setValue] = React.useState<Content>("");
```
para:
```tsx
const [value, setValue] = React.useState<string>("");
```

- [ ] **Step 3: Substituir o componente MinimalTiptapEditor pelo NoteEditor**

Remover o bloco `<MinimalTiptapEditor ... />` (linhas 188-277 aprox.) e substituir por:

```tsx
<NoteEditor
  value={value}
  onChange={setValue}
  className="w-full"
  editorContentClassName="p-4 min-h-48"
  toolbarRight={
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Input
                id={fileInputId}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Imagem" asChild>
                <label htmlFor={fileInputId} className="cursor-pointer" aria-label="Adicionar imagem">
                  <ImageIcon className="size-4" />
                </label>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>Adicionar imagem</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Adicionar etiqueta">
                    <Tag className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-55>
                  <Command>
                    <CommandInput placeholder="Buscar etiquetas..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
                      <CommandGroup className="p-2">
                        {noteLabels &&
                          noteLabels.length &&
                          noteLabels.map((label, key: number) => (
                            <CommandItem
                              key={key}
                              className="flex items-center py-2"
                              onSelect={() => {
                                if (selectedTags.includes(label)) {
                                  return setSelectedTags(selectedTags.filter((item) => item.id !== label.id));
                                }
                                return setSelectedTags([...noteLabels].filter((u) => [...selectedTags, label].includes(u)));
                              }}
                            >
                              <div className="flex grow items-center gap-2">
                                <span className={cn("block size-3 rounded-full", label.color)} />
                                <span className="text-sm leading-none">{label.title}</span>
                                {selectedTags.includes(label) ? <Check className="text-primary ms-auto size-3" /> : null}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </TooltipTrigger>
          <TooltipContent>Adicionar etiqueta</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  }
  placeholder="Digite o conteúdo da nota..."
  autofocus={true}
  editable={true}
/>
```

- [ ] **Step 4: Atualizar o campo content no submit**

A linha `const content = typeof value === "string" ? value : "";` já funcionará corretamente (value agora é sempre string/markdown).

- [ ] **Step 5: Verificar type-check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "add-note-modal"
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/app/(authenticated)/notas/components/add-note-modal.tsx
git commit -m "feat: migra add-note-modal de MinimalTiptapEditor para NoteEditor (Plate.js)"
```

---

## Task 7: Renomear função no template-pdf.service.ts

**Files:**
- Modify: `src/shared/assinatura-digital/services/template-pdf.service.ts`

Contexto: Esta função não tem imports do TipTap SDK — apenas processa JSON. A renomeação é só para clareza semântica (o nome não será mais "TipTap" hardcoded).

- [ ] **Step 1: Renomear função e atualizar chamada interna**

Alterar todas as ocorrências de `tiptapJsonToRichParagraphs` para `richTextJsonToParagraphs`:

```bash
# Verificar ocorrências
grep -n "tiptapJsonToRichParagraphs" src/shared/assinatura-digital/services/template-pdf.service.ts
```

Esperado: 2 ocorrências (definição na linha ~69 e chamada na linha ~338).

Fazer os dois replaces manualmente usando Edit tool.

- [ ] **Step 2: Atualizar comentário da função**

Alterar o comentário de:
```ts
/**
 * Percorre a árvore JSON do TipTap e produz parágrafos com segmentos ricos.
```
para:
```ts
/**
 * Percorre a árvore JSON do editor (formato de storage TipTap-compatível) e produz parágrafos com segmentos ricos.
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/assinatura-digital/services/template-pdf.service.ts
git commit -m "refactor: renomeia tiptapJsonToRichParagraphs para richTextJsonToParagraphs"
```

---

## Task 8: Remover extensão Variable.ts do TipTap

**Files:**
- Delete: `src/app/(authenticated)/assinatura-digital/components/editor/extensions/Variable.ts`

- [ ] **Step 1: Verificar que nenhum outro arquivo importa Variable.ts**

```bash
grep -rn "extensions/Variable" src/ --include="*.ts" --include="*.tsx"
```

Esperado: Após as Tasks 3 e 4, nenhum arquivo deve importar este arquivo (RichTextEditor.tsx e MarkdownRichTextEditor.tsx já foram migrados).

- [ ] **Step 2: Deletar o arquivo**

```bash
rm src/app/(authenticated)/assinatura-digital/components/editor/extensions/Variable.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A src/app/(authenticated)/assinatura-digital/components/editor/extensions/
git commit -m "chore: remove extensão Variable.ts do TipTap (substituída por VariablePlugin Plate.js)"
```

---

## Task 9: Remover diretório minimal-tiptap

**Files:**
- Delete: `src/components/ui/custom/minimal-tiptap/` (diretório inteiro)

- [ ] **Step 1: Verificar que nenhum arquivo importa minimal-tiptap**

```bash
grep -rn "minimal-tiptap\|MinimalTiptapEditor" src/ --include="*.ts" --include="*.tsx"
```

Esperado: zero resultados (add-note-modal.tsx já foi atualizado na Task 6).

- [ ] **Step 2: Deletar o diretório**

```bash
rm -rf src/components/ui/custom/minimal-tiptap
```

- [ ] **Step 3: Verificar se existe barrel em custom/index.ts exportando minimal-tiptap**

```bash
grep -n "minimal-tiptap" src/components/ui/custom/index.ts 2>/dev/null || echo "sem barrel"
```

Se houver export, removê-lo.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/ui/custom/
git commit -m "chore: remove diretório minimal-tiptap (migrado para Plate.js)"
```

---

## Task 10: Remover pacotes TipTap do package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remover as 12 dependências TipTap**

No `package.json`, remover as seguintes linhas da seção `dependencies`:

```json
"@tiptap/core": "^3.6.6",
"@tiptap/extension-bubble-menu": "3.14.0",
"@tiptap/extension-code-block-lowlight": "3.14.0",
"@tiptap/extension-color": "3.14.0",
"@tiptap/extension-image": "3.14.0",
"@tiptap/extension-link": "^3.7.2",
"@tiptap/extension-placeholder": "^3.6.6",
"@tiptap/extension-text-align": "^3.6.6",
"@tiptap/extension-text-style": "3.14.0",
"@tiptap/extension-typography": "3.14.0",
"@tiptap/react": "^3.6.6",
"@tiptap/starter-kit": "^3.6.6",
```

- [ ] **Step 2: Confirmar que não há mais imports @tiptap no código**

```bash
grep -rn "@tiptap" src/ --include="*.ts" --include="*.tsx"
```

Esperado: zero resultados.

- [ ] **Step 3: Rodar npm install para remover os pacotes**

```bash
npm install
```

Esperado: resolução sem erros ERESOLVE, sem mensagens sobre @tiptap/extension-text-style.

- [ ] **Step 4: Verificar que o lock file foi atualizado**

```bash
grep "@tiptap" package-lock.json | wc -l
```

Esperado: 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove 12 dependências @tiptap/* (migração completa para Plate.js)"
```

---

## Task 11: Validação Final

- [ ] **Step 1: Type check completo**

```bash
npm run type-check 2>&1 | tail -20
```

Esperado: `Found 0 errors.`

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | tail -10
```

Esperado: `0 warnings, 0 errors.`

- [ ] **Step 3: Check architecture**

```bash
npm run check:architecture
```

Esperado: sem violações.

- [ ] **Step 4: Build de desenvolvimento**

```bash
npm run dev &
sleep 15
kill %1
```

Observar se não há erros de importação faltando.

- [ ] **Step 5: Commit final de validação se necessário**

```bash
git log --oneline -10
```

Confirmar que todos os commits da migração estão presentes.

---

## Notas Importantes para o Implementador

### Dependências de Ordem
As tasks **devem** ser executadas na ordem: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11. As tasks 3-6 dependem dos artefatos das tasks 1-2.

### Compatibilidade de Dados Existentes
- **Assinatura Digital**: O formato de storage TipTap JSON no banco é mantido. Os conversores da Task 2 garantem que dados existentes sejam carregados corretamente no Plate.js.
- **Notas**: Notas existentes com conteúdo HTML serão carregadas como texto bruto (com tags visíveis) quando editadas. Como é um sistema interno, é aceitável. Novas notas/edições salvam como markdown.

### API Plate.js v52 para MarkdownPlugin
O `MarkdownPlugin` expõe `editor.api.markdown.serialize({ value })` e `editor.api.markdown.deserialize(str)`. Se a API diferir, verificar `src/components/editor/plate/markdown-kit.tsx` para ver como está configurado no projeto.

### editor.tf.setValue vs editor.children
Para atualizar o conteúdo programaticamente no Plate.js v52, usar `editor.tf.setValue(newValue)` em vez de atribuir `editor.children` diretamente.

### Verificar IndentKit
O `IndentKit` é usado em `mail-editor.tsx` — confirmar que está em `src/components/editor/plate/indent-kit.tsx` antes de importar.
