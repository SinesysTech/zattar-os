'use client';

import { createPlatePlugin } from 'platejs/react';
import { ResponsiveFixedToolbar } from '@/components/editor/plate-ui/responsive-fixed-toolbar';

/**
 * Kit de toolbar responsiva para Plate Editor
 * 
 * Substitui o FixedToolbarKit padrão com uma versão responsiva que:
 * - Mobile (< 768px): Toolbar oculta/colapsada
 * - Tablet (768px-1024px): Toolbar condensada
 * - Desktop (>= 1024px): Toolbar completa
 */
export const ResponsiveFixedToolbarKit = [
    createPlatePlugin({
        key: 'responsive-fixed-toolbar',
        render: {
            beforeEditable: () => <ResponsiveFixedToolbar />,
        },
    }),
];
