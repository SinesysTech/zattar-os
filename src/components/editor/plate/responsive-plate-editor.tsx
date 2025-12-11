'use client';

import * as React from 'react';
import { normalizeNodeId, type Descendant } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';
import { ResponsiveEditorKit } from '@/components/editor/plate/responsive-editor-kit';
import { ResponsiveEditor, ResponsiveEditorContainer } from '@/components/editor/plate-ui/responsive-editor';
import { cn } from '@/lib/utils';

interface ResponsivePlateEditorProps {
    initialValue?: Descendant[];
    onChange?: (value: Descendant[]) => void;
    className?: string;
}

/**
 * Editor Plate responsivo
 * 
 * Adapta a interface do editor para diferentes tamanhos de tela:
 * - Mobile (< 768px): Toolbar colapsada, padding reduzido
 * - Tablet (768px-1024px): Toolbar condensada
 * - Desktop (>= 1024px): Toolbar completa
 */
export function ResponsivePlateEditor({
    initialValue,
    onChange,
    className
}: ResponsivePlateEditorProps) {
    const editor = usePlateEditor({
        plugins: ResponsiveEditorKit,
        value: (initialValue && initialValue.length > 0 ? initialValue : defaultValue) as Descendant[],
    });

    // Handler para mudanças no editor
    const handleChange = React.useCallback(
        ({ value: newValue }: { value: Descendant[] }) => {
            if (onChange) {
                onChange(newValue);
            }
        },
        [onChange]
    );

    return (
        <Plate editor={editor} onChange={handleChange}>
            <ResponsiveEditorContainer
                variant="default"
                className={cn('h-full', className)}
            >
                <ResponsiveEditor variant="demo" />
            </ResponsiveEditorContainer>
        </Plate>
    );
}

const defaultValue = normalizeNodeId([
    {
        children: [{ text: 'Welcome to the Plate Playground!' }],
        type: 'h1',
    },
    {
        children: [
            { text: 'Experience a modern rich-text editor built with ' },
            { children: [{ text: 'Slate' }], type: 'a', url: 'https://slatejs.org' },
            { text: ' and ' },
            { children: [{ text: 'React' }], type: 'a', url: 'https://reactjs.org' },
            {
                text: ". This playground showcases just a part of Plate's capabilities. ",
            },
            {
                children: [{ text: 'Explore the documentation' }],
                type: 'a',
                url: '/docs',
            },
            { text: ' to discover more.' },
        ],
        type: 'p',
    },
]);
