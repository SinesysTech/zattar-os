'use client';

import * as React from 'react';
import { type Descendant, type Value, normalizeNodeId } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { MentionPlugin, MentionInputPlugin } from '@platejs/mention/react';

import { cn } from '@/lib/utils';
import { Editor, EditorContainer } from '@/components/editor/plate-ui/editor';
import { FixedToolbar } from '@/components/editor/plate-ui/fixed-toolbar';
import {
  MentionElement,
  MentionInputElement,
} from '@/components/editor/plate-ui/mention-node';

// Import basic kits for a document editor
import { BasicBlocksKit } from '@/components/editor/plate/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plate/basic-marks-kit';
import { AlignKit } from '@/components/editor/plate/align-kit';
import { IndentKit } from '@/components/editor/plate/indent-kit';
import { ListKit } from '@/components/editor/plate/list-kit';
import { LinkKit } from '@/components/editor/plate/link-kit';
import { AutoformatKit } from '@/components/editor/plate/autoformat-kit';
import { ExitBreakKit } from '@/components/editor/plate/exit-break-kit';

import { TEMPLATE_VARIABLES, CATEGORY_LABELS } from './types';
import type { VariableCategory } from './types';
import { Heading, Text } from '@/components/ui/typography';

interface TemplateTextoEditorProps {
  value?: Descendant[];
  onChange?: (value: Descendant[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Default empty document
const defaultValue = normalizeNodeId([
  {
    type: 'p',
    children: [{ text: '' }],
  },
]);

// Variable mention kit configured for template variables
const VariableMentionKit = [
  MentionPlugin.configure({
    options: {
      triggerPreviousCharPattern: /^$|^[\s"']$/,
      trigger: '@',
    },
  }).withComponent(MentionElement),
  MentionInputPlugin.withComponent(MentionInputElement),
];

// Combined editor plugins for template editing
const TemplateEditorKit = [
  ...BasicBlocksKit,
  ...BasicMarksKit,
  ...AlignKit,
  ...IndentKit,
  ...ListKit,
  ...LinkKit,
  ...AutoformatKit,
  ...ExitBreakKit,
  ...VariableMentionKit,
];

/**
 * Template text editor using Plate
 * Provides rich text editing with variable insertion support
 */
export function TemplateTextoEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo do template...',
  disabled = false,
  className,
}: TemplateTextoEditorProps) {
  const editor = usePlateEditor({
    plugins: TemplateEditorKit,
    value: (value && value.length > 0 ? value : defaultValue) as Value,
  });

  // Handle content changes
  const handleChange = React.useCallback(
    ({ value: newValue }: { value: Descendant[] }) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Group variables by category for the mention combobox
  const variablesByCategory = React.useMemo(() => {
    const grouped = new Map<VariableCategory, typeof TEMPLATE_VARIABLES>();

    for (const variable of TEMPLATE_VARIABLES) {
      if (!grouped.has(variable.category)) {
        grouped.set(variable.category, []);
      }
      grouped.get(variable.category)!.push(variable);
    }

    return grouped;
  }, []);

  return (
    <div className={cn('flex flex-col', className)}>
      <Plate editor={editor} onChange={handleChange}>
        {/* Fixed toolbar at top */}
        <FixedToolbar className="rounded-t-lg border-b" />

        {/* Editor content area */}
        <EditorContainer
          variant="default"
          className={cn(
            'min-h-100 rounded-b-lg border border-t-0',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <Editor
            variant="default"
            placeholder={placeholder}
            className={cn("min-h-100 px-6 py-4")}
          />
        </EditorContainer>
      </Plate>

      {/* Variable insertion helper */}
      <div className={cn("mt-4 rounded-lg border bg-muted/30 inset-card-compact")}>
        <Heading level="subsection" className={cn("mb-2 text-body-sm")}>Inserir Variáveis</Heading>
        <Text variant="caption" className="mb-3">
          Digite <kbd className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-caption")}>@</kbd> no editor para inserir variáveis dinâmicas.
        </Text>

        <div className={cn("flex flex-col stack-tight")}>
          {Array.from(variablesByCategory.entries()).map(([category, variables]) => (
            <div key={category}>
              <Text variant="caption" className="font-medium">
                {CATEGORY_LABELS[category]}:
              </Text>
              <div className={cn("ml-2 flex flex-wrap inline-micro")}>
                {variables.slice(0, 3).map((v) => (
                  <span
                    key={v.key}
                    className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-caption")}
                  >
                    @{v.key}
                  </span>
                ))}
                {variables.length > 3 && (
                  <Text variant="caption">
                    +{variables.length - 3} mais
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TemplateTextoEditor;
