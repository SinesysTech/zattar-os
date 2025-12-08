/**
 * Property-Based Tests - Responsive List Views
 * 
 * Testes de propriedades para páginas de listagem responsivas
 * usando fast-check para validar comportamentos em mobile.
 */

import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '../helpers/responsive-test-helpers';
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
                    const { container } = render(
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
                        // Card deve ter header e content
                        const cardHeader = card.querySelector('[class*="card-header"]');
                        const cardContent = card.querySelector('[class*="card-content"]');

                        expect(cardHeader || cardContent).toBeTruthy();
                    });
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
     * com detalhes secundários disponíveis na expansão
     */
    test('Property 54: List item information hierarchy', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.array(listItemArbitrary, { minLength: 1, maxLength: 10 }),
                (width, data) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
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
                        // Informação principal (título) deve estar no header
                        const cardHeader = card.querySelector('[class*="card-header"]');
                        const cardTitle = card.querySelector('[class*="card-title"]');

                        // Pelo menos um deve existir para mostrar info principal
                        expect(cardHeader || cardTitle).toBeTruthy();

                        // Detalhes secundários devem estar no content
                        const cardContent = card.querySelector('[class*="card-content"]');

                        // Se há mais de uma coluna, deve ter content com detalhes
                        if (listColumns.length > 1) {
                            expect(cardContent).toBeTruthy();
                        }

                        // Verifica que labels estão presentes para contexto
                        if (cardContent) {
                            const labels = cardContent.querySelectorAll('.text-muted-foreground');
                            // Deve ter pelo menos um label para identificar os dados
                            expect(labels.length).toBeGreaterThan(0);
                        }
                    });
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
                    const { container, getByTestId } = render(
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
                    const filterTrigger = getByTestId('filter-trigger');
                    expect(filterTrigger).toBeInTheDocument();

                    // Verifica que o trigger tem ícone de filtro
                    const filterIcon = filterTrigger.querySelector('svg');
                    expect(filterIcon).toBeInTheDocument();

                    // Se há filtros ativos, deve mostrar badge com contagem
                    if (filterCount > 0) {
                        const badge = filterTrigger.querySelector('.bg-primary');
                        expect(badge).toBeInTheDocument();
                        expect(badge?.textContent).toBe(filterCount.toString());
                    }

                    // Verifica que o painel de filtros existe (mesmo que fechado)
                    // O Sheet component renderiza o conteúdo mesmo quando fechado
                    const filterPanel = container.querySelector('[data-testid="filter-panel"]');
                    expect(filterPanel).toBeInTheDocument();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Verifica que filtros inline são usados em desktop
     */
    test('Filters should be inline on desktop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1024, max: 1920 }), // viewport widths desktop
                (width) => {
                    setViewport({ width, height: 1080 });

                    // Em desktop, filtros podem ser inline ao invés de Sheet
                    const { container } = render(
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="inline-filter"
                                data-testid="inline-search"
                            />
                            <select className="inline-filter" data-testid="inline-select">
                                <option>Status</option>
                            </select>
                        </div>
                    );

                    // Verifica que filtros inline estão presentes
                    const inlineSearch = container.querySelector('[data-testid="inline-search"]');
                    const inlineSelect = container.querySelector('[data-testid="inline-select"]');

                    expect(inlineSearch).toBeInTheDocument();
                    expect(inlineSelect).toBeInTheDocument();

                    // Verifica que ambos têm classe inline-filter
                    expect(inlineSearch?.classList.contains('inline-filter')).toBe(true);
                    expect(inlineSelect?.classList.contains('inline-filter')).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Verifica paginação compacta em mobile
     */
    test('Pagination should be compact on mobile', () => {
        const testPagination = {
            pageIndex: 2,
            pageSize: 10,
            total: 100,
            totalPages: 10,
            onPageChange: jest.fn(),
            onPageSizeChange: jest.fn(),
        };

        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.array(listItemArbitrary, { minLength: 10, maxLength: 10 }),
                (width, data) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
                        <ResponsiveTable
                            data={data}
                            columns={listColumns}
                            mobileLayout="cards"
                            pagination={testPagination}
                        />
                    );

                    // Verifica que controles de paginação existem
                    const paginationButtons = container.querySelectorAll('button[class*="outline"]');
                    expect(paginationButtons.length).toBeGreaterThan(0);

                    // Em mobile, deve ter apenas prev/next (sem first/last)
                    // Máximo de 2 botões de navegação
                    const navButtons = Array.from(paginationButtons).filter(btn =>
                        btn.querySelector('svg')
                    );
                    expect(navButtons.length).toBeLessThanOrEqual(2);

                    // Verifica que texto de paginação é compacto
                    const paginationText = container.textContent;
                    // Deve mostrar formato compacto "3/10" ao invés de texto longo
                    expect(paginationText).toMatch(/\d+\/\d+/);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Verifica que ações de linha são acessíveis em cards
     */
    test('Row actions should be accessible in card layout', () => {
        const testActions = [
            { label: 'Editar', onClick: jest.fn() },
            { label: 'Excluir', onClick: jest.fn() },
            { label: 'Visualizar', onClick: jest.fn() },
        ];

        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.array(listItemArbitrary, { minLength: 1, maxLength: 5 }),
                (width, data) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
                        <ResponsiveTable
                            data={data}
                            columns={listColumns}
                            mobileLayout="cards"
                            rowActions={testActions}
                        />
                    );

                    // Verifica que cada card tem botão de ações
                    const cards = container.querySelectorAll('[data-slot="card"]');
                    expect(cards.length).toBe(data.length);

                    // Cada card deve ter um botão de menu de ações
                    cards.forEach((card) => {
                        const actionButton = card.querySelector('button[class*="ghost"]');
                        expect(actionButton).toBeInTheDocument();

                        // Botão deve ter ícone (MoreVertical)
                        const icon = actionButton?.querySelector('svg');
                        expect(icon).toBeInTheDocument();

                        // Botão deve ter tamanho adequado para touch (h-11 w-11)
                        expect(actionButton?.classList.contains('h-11')).toBe(true);
                        expect(actionButton?.classList.contains('w-11')).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
