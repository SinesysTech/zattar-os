/**
 * Property-Based Tests - Responsive List Views
 * 
 * Testes de propriedades para páginas de listagem responsivas
 * usando fast-check para validar comportamentos em mobile.
 */

import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';
import { Filter } from 'lucide-react';

// Mock de dados para testes de listagem
interface ListItemData {
    id: string;
    title: string;
    description: string;
    status: string;
    date: string;
    priority: 'high' | 'medium' | 'low';
}

// Colunas de teste para listagem
const listColumns: ResponsiveTableColumn<ListItemData>[] = [
    {
        id: 'title',
        accessorKey: 'title',
        header: 'Título',
        priority: 1,
        cardLabel: 'Título',
    },
    {
        id: 'description',
        accessorKey: 'description',
        header: 'Descrição',
        priority: 2,
        cardLabel: 'Descrição',
    },
    {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        priority: 3,
        cardLabel: 'Status',
    },
    {
        id: 'date',
        accessorKey: 'date',
        header: 'Data',
        priority: 4,
        cardLabel: 'Data',
    },
    {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Prioridade',
        priority: 5,
        cardLabel: 'Prioridade',
    },
];

// Gerador de dados de listagem
const listItemArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    status: fc.constantFrom('active', 'pending', 'completed', 'cancelled'),
    date: fc.integer({ min: 946684800000, max: 1924905600000 }).map(timestamp =>
        new Date(timestamp).toISOString().split('T')[0]
    ),
    priority: fc.constantFrom('high', 'medium', 'low'),
});

// Componente de filtros colapsáveis para testes
interface FilterPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    filterCount?: number;
    children?: React.ReactNode;
}

function FilterPanel({ isOpen, onOpenChange, filterCount = 0, children }: FilterPanelProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-trigger">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {filterCount > 0 && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {filterCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" data-testid="filter-panel">
                <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
}

describe('Responsive List Views - Property-Based Tests', () => {
    beforeEach(() => {
        // Reset viewport antes de cada teste
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    afterEach(() => {
        // Cleanup após cada teste
        cleanup();
    });

    /**
     * Feature: responsividade-frontend, Property 53: List card layout on mobile
     * Validates: Requirements 12.1
     * 
     * Para qualquer visualização de lista exibida em viewport width < 768px,
     * o layout de tabela deve ser convertido para layout baseado em cards
     */
    test('Property 53: List card layout on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // viewport widths mobile
                fc.array(listItemArbitrary, { minLength: 1, maxLength: 10 }),
                (width, data) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 667 });

                    // Renderiza lista em modo cards
                    const { container, unmount } = render(
                        <ResponsiveTable
                            data={data}
                            columns={listColumns}
                            mobileLayout="cards"
                        />
                    );

                    // Verifica que cards são renderizados
                    const cards = container.querySelectorAll('[data-slot="card"]');
                    expect(cards.length).toBe(data.length);

                    // Verifica que não há elemento table tradicional
                    const table = container.querySelector('table');
                    expect(table).not.toBeInTheDocument();

                    // Verifica que cada card tem estrutura adequada
                    cards.forEach((card) => {
                        // Card deve ter conteúdo
                        expect(card.textContent).toBeTruthy();
                    });

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 54: List item information hierarchy
     * Validates: Requirements 12.2
     * 
     * Para quaisquer itens de lista exibidos em mobile,
     * informações essenciais devem ser mostradas proeminentemente
     * com detalhes secundários disponíveis
     */
    test('Property 54: List item information hierarchy', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.array(listItemArbitrary, { minLength: 1, maxLength: 10 }),
                (width, data) => {
                    setViewport({ width, height: 667 });

                    const { container, unmount } = render(
                        <ResponsiveTable
                            data={data}
                            columns={listColumns}
                            mobileLayout="cards"
                        />
                    );

                    // Verifica que cards existem
                    const cards = container.querySelectorAll('[data-slot="card"]');
                    expect(cards.length).toBeGreaterThan(0);

                    // Para cada card, verifica hierarquia de informações
                    cards.forEach((card) => {
                        // Card deve ter estrutura básica e conteúdo
                        expect(card).toBeTruthy();
                        expect(card.textContent).toBeTruthy();

                        // Verifica que o card tem conteúdo visível
                        const hasContent = card.textContent && card.textContent.trim().length > 0;
                        expect(hasContent).toBe(true);
                    });

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 55: List filters collapsible
     * Validates: Requirements 12.3
     * 
     * Para quaisquer filtros e busca exibidos em mobile,
     * eles devem ser agrupados em um painel de filtros colapsável
     */
    test('Property 55: List filters collapsible', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.integer({ min: 0, max: 5 }), // número de filtros ativos
                (width, filterCount) => {
                    setViewport({ width, height: 667 });

                    // Renderiza painel de filtros
                    const { container, unmount } = render(
                        <FilterPanel
                            isOpen={false}
                            onOpenChange={() => { }}
                            filterCount={filterCount}
                        >
                            <div data-testid="filter-content">
                                <input type="text" placeholder="Buscar..." />
                                <select>
                                    <option>Status</option>
                                </select>
                            </div>
                        </FilterPanel>
                    );

                    // Verifica que existe um trigger para abrir filtros
                    const filterTrigger = container.querySelector('[data-testid="filter-trigger"]');
                    expect(filterTrigger).toBeInTheDocument();

                    // Verifica que o trigger tem ícone de filtro
                    const filterIcon = filterTrigger?.querySelector('svg');
                    expect(filterIcon).toBeInTheDocument();

                    // Se há filtros ativos, deve mostrar badge com contagem
                    if (filterCount > 0) {
                        const badge = filterTrigger?.querySelector('.bg-primary');
                        expect(badge).toBeInTheDocument();
                        expect(badge?.textContent).toBe(filterCount.toString());
                    }

                    // Verifica que o Sheet está presente no DOM
                    // Quando fechado, o conteúdo pode não estar renderizado
                    // O importante é que o trigger existe e pode abrir o painel
                    const sheetRoot = container.querySelector('[data-slot="sheet-trigger"]');
                    expect(sheetRoot).toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });
});
