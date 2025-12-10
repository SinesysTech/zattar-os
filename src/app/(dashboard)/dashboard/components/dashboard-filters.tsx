'use client';

import * as React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet';
import { useViewport } from '@/hooks/use-viewport';
import { cn } from '@/lib/utils';

export interface DashboardFiltersProps {
    /**
     * Conteúdo dos filtros
     */
    children: React.ReactNode;

    /**
     * Número de filtros ativos (para badge)
     */
    activeFiltersCount?: number;

    /**
     * Callback quando filtros são aplicados
     */
    onApply?: () => void;

    /**
     * Callback quando filtros são limpos
     */
    onClear?: () => void;

    /**
     * Título dos filtros
     */
    title?: string;

    /**
     * Descrição dos filtros
     */
    description?: string;

    /**
     * Classes adicionais
     */
    className?: string;
}

/**
 * Componente de filtros responsivo para Dashboard
 * 
 * Em mobile (< 768px): Exibe filtros em um Sheet (drawer lateral)
 * Em desktop (≥ 768px): Exibe filtros inline
 * 
 * @example
 * ```tsx
 * <DashboardFilters
 *   activeFiltersCount={2}
 *   onApply={handleApplyFilters}
 *   onClear={handleClearFilters}
 * >
 *   <Select>...</Select>
 *   <DatePicker>...</DatePicker>
 * </DashboardFilters>
 * ```
 */
export function DashboardFilters({
    children,
    activeFiltersCount = 0,
    onApply,
    onClear,
    title = 'Filtros',
    description = 'Filtre os dados do dashboard',
    className,
}: DashboardFiltersProps) {
    const [open, setOpen] = React.useState(false);
    const viewport = useViewport();
    const isMobile = viewport.isMobile;

    const handleApply = () => {
        onApply?.();
        setOpen(false);
    };

    const handleClear = () => {
        onClear?.();
    };

    // Conteúdo dos filtros
    const filtersContent = (
        <div className="space-y-4">
            {children}
        </div>
    );

    // Botões de ação
    const actionButtons = (
        <div className="flex gap-2 pt-4 border-t">
            <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1"
                disabled={activeFiltersCount === 0}
            >
                <X className="h-4 w-4 mr-2" />
                Limpar
            </Button>
            <Button
                onClick={handleApply}
                className="flex-1"
            >
                Aplicar Filtros
            </Button>
        </div>
    );

    // Mobile: Sheet
    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" className={cn('relative', className)}>
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <Badge
                                variant="default"
                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>{title}</SheetTitle>
                        <SheetDescription>{description}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        {filtersContent}
                    </div>
                    <SheetFooter className="mt-6">
                        {actionButtons}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop: Inline collapsible
    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <h3 className="text-sm font-medium">{title}</h3>
                    {activeFiltersCount > 0 && (
                        <Badge variant="default" className="h-5 px-2 text-xs">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </div>
            </div>
            {filtersContent}
            {actionButtons}
        </div>
    );
}

/**
 * Container para um grupo de filtros
 */
export interface FilterGroupProps {
    /**
     * Título do grupo
     */
    label: string;

    /**
     * Conteúdo do grupo
     */
    children: React.ReactNode;

    /**
     * Classes adicionais
     */
    className?: string;
}

export function FilterGroup({ label, children, className }: FilterGroupProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}
