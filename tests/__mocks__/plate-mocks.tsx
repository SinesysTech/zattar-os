/**
 * Mocks para componentes Plate.js
 * Usado em testes para evitar problemas com ESM modules
 */

import * as React from 'react';

// Mock do Plate
export const Plate = ({ children, editor, onChange }: any) => (
    <div data-testid="plate-mock" data-editor-id={editor?.id}>
        {children}
    </div>
);

// Mock do usePlateEditor
export const usePlateEditor = (config: any) => ({
    id: 'test-editor',
    children: [],
    ...config,
});

// Mock do PlateContainer
export const PlateContainer = ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
        {children}
    </div>
);

// Mock do PlateContent
export const PlateContent = React.forwardRef(({ children, className, ...props }: any, ref: any) => (
    <div
        ref={ref}
        className={className}
        data-slate-editor="true"
        contentEditable
        {...props}
    >
        {children}
    </div>
));

PlateContent.displayName = 'PlateContent';

// Mock do normalizeNodeId
export const normalizeNodeId = (value: any) => value;

// Mock de tipos
export type Descendant = any;
