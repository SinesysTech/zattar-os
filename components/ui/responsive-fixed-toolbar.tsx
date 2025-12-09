'use client';

import * as React from 'react';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cn } from '@/app/_lib/utils/utils';
import { Toolbar, ToolbarGroup } from './toolbar';
import { FixedToolbarButtons } from './fixed-toolbar-buttons';
import { MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Responsive Fixed Toolbar para Plate Editor
 * 
 * - Mobile (< 768px): Toolbar oculta/colapsada com botão de overflow
 * - Tablet (768px-1024px): Toolbar condensada com ícones essenciais
 * - Desktop (>= 1024px): Toolbar completa
 */
export function ResponsiveFixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
    const isMd = useBreakpoint('md');
    const isLg = useBreakpoint('lg');
    const isMobile = !isMd; // < 768px
    const isTablet = isMd && !isLg; // 768px-1024px

    if (isMobile) {
        // Mobile: Toolbar oculta, apenas botão de overflow
        return (
            <Toolbar
                {...props}
                className={cn(
                    'sticky top-0 left-0 z-50 w-full border-b border-b-border bg-background/95 p-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60',
                    props.className
                )}
            >
                <div className="flex w-full items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Toque para formatar
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-screen max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-y-auto"
                        >
                            <div className="p-2">
                                <FixedToolbarButtons />
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Toolbar>
        );
    }

    if (isTablet) {
        // Tablet: Toolbar condensada
        return (
            <Toolbar
                {...props}
                className={cn(
                    'scrollbar-hide sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60',
                    'max-h-14',
                    props.className
                )}
            >
                <FixedToolbarButtons />
            </Toolbar>
        );
    }

    // Desktop: Toolbar completa
    return (
        <Toolbar
            {...props}
            className={cn(
                'scrollbar-hide sticky top-0 left-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60',
                props.className
            )}
        >
            <FixedToolbarButtons />
        </Toolbar>
    );
}
