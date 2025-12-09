/**
 * Mocks para componentes Plate.js
 * Usado em testes para evitar problemas com ESM modules
 */

import * as React from 'react';

interface PlateProps {
    children?: React.ReactNode;
    editor?: { id?: string };
    onChange?: () => void;
}

interface PlateContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

interface PlateContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
}

interface PlateEditorConfig {
    id?: string;
    [key: string]: unknown;
}

// Mock do Plate
export const Plate = ({ children, editor }: PlateProps) => (
    <div data-testid="plate-mock" data-editor-id={editor?.id}>
        {children}
    </div>
);

// Mock do usePlateEditor
export const usePlateEditor = (config: PlateEditorConfig) => ({
    id: 'test-editor',
    children: [],
    ...config,
});

// Mock do PlateContainer
export const PlateContainer = ({ children, className, ...props }: PlateContainerProps) => (
    <div className={className} {...props}>
        {children}
    </div>
);

// Mock do PlateContent
export const PlateContent = React.forwardRef<HTMLDivElement, PlateContentProps>(({ children, className, ...props }, ref) => (
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
export const normalizeNodeId = <T,>(value: T): T => value;

// Mock de tipos
export type Descendant = Record<string, unknown>;
