'use client';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  SparklesIcon,
  Square,
  Table,
  TableOfContentsIcon,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import {
  insertBlock,
  insertInlineElement,
} from '@/components/calendar/transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'AI',
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: 'AI',
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: 'Blocos básicos',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph'],
        label: 'Texto',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1'],
        label: 'Título 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2'],
        label: 'Título 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3'],
        label: 'Título 3',
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-'],
        label: 'Lista com marcadores',
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1'],
        label: 'Lista numerada',
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]'],
        label: 'Lista de tarefas',
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable'],
        label: 'Recolhível',
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```'],
        label: 'Bloco de código',
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        label: 'Tabela',
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>'],
        label: 'Citação',
        value: KEYS.blockquote,
      },
      {
        description: 'Insere um bloco em destaque.',
        icon: <LightbulbIcon />,
        keywords: ['note'],
        label: 'Destaque',
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Blocos avançados',
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc'],
        label: 'Sumário',
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: '3 colunas',
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Equação',
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        keywords: ['excalidraw'],
        label: 'Excalidraw',
        value: KEYS.excalidraw,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Em linha',
    items: [
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ['time'],
        label: 'Data',
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: 'Equação em linha',
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>Nenhum resultado</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
