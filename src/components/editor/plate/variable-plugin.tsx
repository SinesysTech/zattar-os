'use client';

import * as React from 'react';

import type { TElement } from 'platejs';
import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';
import { createPlatePlugin } from 'platejs/react';

export const VARIABLE_ELEMENT = 'variable';

export interface VariableElementType extends TElement {
  type: typeof VARIABLE_ELEMENT;
  key: string;
  children: [{ text: string }];
}

function VariableElementComponent(props: PlateElementProps<VariableElementType>) {
  const variableKey = props.element.key ?? '';

  return (
    <PlateElement
      {...props}
      as="span"
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-variable-key': variableKey,
      }}
      className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 select-none"
    >
      {props.children}
      {`{{${variableKey}}}`}
    </PlateElement>
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

export function insertVariable(editor: PlateEditor, key: string) {
  const node: VariableElementType = {
    type: VARIABLE_ELEMENT,
    key,
    children: [{ text: '' }],
  };
  editor.tf.insertNodes(node);
}
