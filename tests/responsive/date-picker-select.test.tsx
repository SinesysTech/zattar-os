/**
 * Property-based tests para Date Pickers e Selects Responsivos
 * 
 * Testes que validam propriedades universais dos componentes
 * de seleção de data e select em diferentes viewports.
 */

import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { setViewport, hasSufficientTouchTarget, getTouchTargetSize } from '@/tests/helpers/responsive-test-helpers';

describe('Date Picker and Select Property Tests', () => {
    afterEach(() => {
        cleanup();
    });
    /**
     * Feature: responsividade-frontend, Property 29: Touch-optimized date picker
     * Validates: Requirements 7.1
     * 
     * Para qualquer date picker aberto em mobile,
     * uma interface de calendário otimizada para touch deve ser exibida.
     */
    test('Property 29: Date picker displays touch-optimized calendar on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                (width) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza date picker
                    const { container, getByRole } = render(
                        <DatePicker placeholder="Select date" />
                    );

                    // Abre o date picker
                    const trigger = getByRole('button');
                    fireEvent.click(trigger);

                    // Verifica que o calendário foi renderizado
                    const calendar = container.querySelector('[data-slot="calendar"]');
                    expect(calendar).toBeInTheDocument();

                    // Verifica que botões de navegação têm touch targets adequados
                    const navButtons = container.querySelectorAll('[class*="button_previous"], [class*="button_next"]');
                    navButtons.forEach((button) => {
                        const size = getTouchTargetSize(button as HTMLElement);
                        expect(size.width).toBeGreaterThanOrEqual(44);
                        expect(size.height).toBeGreaterThanOrEqual(44);
                    });

                    // Verifica que células do calendário têm touch targets adequados
                    const dayButtons = container.querySelectorAll('[data-slot="calendar"] button[data-day]');
                    if (dayButtons.length > 0) {
                        dayButtons.forEach((dayButton) => {
                            const size = getTouchTargetSize(dayButton as HTMLElement);
                            expect(size.height).toBeGreaterThanOrEqual(44);
                        });
                    }

                    // Verifica que tem classe touch-manipulation
                    const firstDayButton = dayButtons[0] as HTMLElement;
                    if (firstDayButton) {
                        expect(firstDayButton).toHaveClass('touch-manipulation');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 30: Mobile select interface
     * Validates: Requirements 7.2
     * 
     * Para qualquer select dropdown aberto em mobile,
     * opções devem ser exibidas em interface full-screen ou bottom sheet.
     */
    test('Property 30: Select displays mobile-optimized interface', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.array(fc.string(), { minLength: 3, maxLength: 10 }), // options
                (width, options) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza select
                    const { container, getByRole } = render(
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt, idx) => (
                                    <SelectItem key={idx} value={`option-${idx}`}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );

                    // Verifica que trigger tem touch target adequado
                    const trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLElement;
                    expect(hasSufficientTouchTarget(trigger)).toBe(true);

                    // Verifica que trigger tem min-height adequado em mobile
                    const size = getTouchTargetSize(trigger);
                    expect(size.height).toBeGreaterThanOrEqual(44);

                    // Verifica que tem classe touch-manipulation
                    expect(trigger).toHaveClass('touch-manipulation');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 31: Select option touch targets
     * Validates: Requirements 7.3
     * 
     * Para qualquer opção de select exibida em mobile,
     * touch targets devem ter pelo menos 44x44 pixels.
     */
    test('Property 31: Select options have minimum 44x44px touch targets on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.array(fc.string(), { minLength: 2, maxLength: 8 }), // options
                async (width, options) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza select
                    const { container, getByRole } = render(
                        <Select defaultOpen>
                            <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt, idx) => (
                                    <SelectItem key={idx} value={`option-${idx}`}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );

                    // Aguarda renderização do conteúdo
                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="select-content"]');
                        expect(content).toBeInTheDocument();
                    });

                    // Verifica touch targets das opções
                    const selectItems = container.querySelectorAll('[data-slot="select-item"]');

                    selectItems.forEach((item) => {
                        const size = getTouchTargetSize(item as HTMLElement);
                        expect(size.height).toBeGreaterThanOrEqual(44);
                    });

                    // Verifica que tem classe touch-manipulation
                    if (selectItems.length > 0) {
                        const firstItem = selectItems[0] as HTMLElement;
                        expect(firstItem).toHaveClass('touch-manipulation');
                    }
                }
            ),
            { numRuns: 50 } // Reduzido porque envolve async
        );
    });

    /**
     * Feature: responsividade-frontend, Property 32: Mobile combobox interface
     * Validates: Requirements 7.4
     * 
     * Para qualquer combobox usado em mobile,
     * uma interface de busca otimizada para mobile deve ser exibida.
     */
    test('Property 32: Combobox displays mobile-optimized search interface', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.array(
                    fc.record({
                        value: fc.string(),
                        label: fc.string(),
                    }),
                    { minLength: 3, maxLength: 15 }
                ), // combobox options
                (width, options) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza combobox
                    const { container, getByRole } = render(
                        <Combobox
                            options={options as ComboboxOption[]}
                            value={[]}
                            onValueChange={() => { }}
                            placeholder="Select items"
                            searchPlaceholder="Search..."
                        />
                    );

                    // Verifica que trigger tem touch target adequado
                    const trigger = getByRole('combobox');
                    expect(hasSufficientTouchTarget(trigger)).toBe(true);

                    // Verifica min-height
                    const size = getTouchTargetSize(trigger);
                    expect(size.height).toBeGreaterThanOrEqual(44);

                    // Verifica que tem classe touch-manipulation
                    expect(trigger).toHaveClass('touch-manipulation');

                    // Abre o combobox
                    fireEvent.click(trigger);

                    // Verifica que input de busca foi renderizado
                    const searchInput = container.querySelector('input[placeholder*="Search"], input[placeholder*="Buscar"]');
                    expect(searchInput).toBeInTheDocument();

                    // Verifica que input de busca tem touch target adequado
                    if (searchInput) {
                        const inputSize = getTouchTargetSize(searchInput as HTMLElement);
                        expect(inputSize.height).toBeGreaterThanOrEqual(44);
                        expect(searchInput).toHaveClass('touch-manipulation');
                    }

                    // Verifica que opções têm touch targets adequados
                    const comboboxOptions = container.querySelectorAll('[class*="cursor-pointer"][class*="select-none"]');
                    comboboxOptions.forEach((option) => {
                        const optionSize = getTouchTargetSize(option as HTMLElement);
                        expect(optionSize.height).toBeGreaterThanOrEqual(44);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Date picker trigger touch target
     * 
     * Verifica que o botão trigger do date picker tem touch target adequado
     */
    test('Date picker trigger has sufficient touch target on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    const { getByRole } = render(
                        <DatePicker placeholder="Select date" />
                    );

                    const trigger = getByRole('button');

                    // Verifica touch target
                    expect(hasSufficientTouchTarget(trigger)).toBe(true);

                    const size = getTouchTargetSize(trigger);
                    expect(size.height).toBeGreaterThanOrEqual(44);

                    // Verifica classe touch-manipulation
                    expect(trigger).toHaveClass('touch-manipulation');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Calendar navigation buttons
     * 
     * Verifica que botões de navegação do calendário são touch-friendly
     */
    test('Calendar navigation buttons are touch-friendly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    const { container, getByRole } = render(
                        <DatePicker placeholder="Select date" />
                    );

                    // Abre o date picker
                    const trigger = getByRole('button');
                    fireEvent.click(trigger);

                    // Verifica botões de navegação
                    const prevButton = container.querySelector('[class*="button_previous"]') as HTMLElement;
                    const nextButton = container.querySelector('[class*="button_next"]') as HTMLElement;

                    if (prevButton) {
                        expect(hasSufficientTouchTarget(prevButton)).toBe(true);
                        expect(prevButton).toHaveClass('touch-manipulation');
                    }

                    if (nextButton) {
                        expect(hasSufficientTouchTarget(nextButton)).toBe(true);
                        expect(nextButton).toHaveClass('touch-manipulation');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Select smooth scrolling
     * 
     * Verifica que select tem scroll suave para listas longas
     */
    test('Select has smooth scrolling for long lists', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string(), { minLength: 10, maxLength: 30 }),
                async (options) => {
                    setViewport({ width: 375, height: 667 });

                    const { container } = render(
                        <Select defaultOpen>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt, idx) => (
                                    <SelectItem key={idx} value={`option-${idx}`}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="select-content"]');
                        expect(content).toBeInTheDocument();
                    });

                    const content = container.querySelector('[data-slot="select-content"]') as HTMLElement;

                    // Verifica que tem scroll-smooth
                    expect(content).toHaveClass('scroll-smooth');
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Combobox smooth scrolling
     * 
     * Verifica que combobox tem scroll suave
     */
    test('Combobox has smooth scrolling for long lists', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        value: fc.string(),
                        label: fc.string(),
                    }),
                    { minLength: 10, maxLength: 30 }
                ),
                (options) => {
                    setViewport({ width: 375, height: 667 });

                    const { container, getByRole } = render(
                        <Combobox
                            options={options as ComboboxOption[]}
                            value={[]}
                            onValueChange={() => { }}
                        />
                    );

                    // Abre o combobox
                    const trigger = getByRole('combobox');
                    fireEvent.click(trigger);

                    // Verifica scroll suave na lista de opções
                    const optionsList = container.querySelector('[class*="max-h-"][class*="overflow-auto"]') as HTMLElement;

                    if (optionsList) {
                        expect(optionsList).toHaveClass('scroll-smooth');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Visual feedback on interaction
     * 
     * Verifica que componentes fornecem feedback visual claro
     */
    test('Components provide clear visual feedback on interaction', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('datepicker', 'select', 'combobox'),
                (componentType) => {
                    setViewport({ width: 375, height: 667 });

                    let trigger: HTMLElement;

                    if (componentType === 'datepicker') {
                        const { getByRole } = render(<DatePicker />);
                        trigger = getByRole('button');
                    } else if (componentType === 'select') {
                        const { container } = render(
                            <Select>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </Select>
                        );
                        trigger = container.querySelector('[data-slot="select-trigger"]') as HTMLElement;
                    } else {
                        const { getByRole } = render(
                            <Combobox
                                options={[{ value: '1', label: 'Option 1' }]}
                                value={[]}
                                onValueChange={() => { }}
                            />
                        );
                        trigger = getByRole('combobox');
                    }

                    // Verifica que tem transições ou feedback visual
                    const classList = Array.from(trigger.classList);
                    const hasVisualFeedback = classList.some(
                        (cls) =>
                            cls.includes('transition') ||
                            cls.includes('active:') ||
                            cls.includes('hover:') ||
                            cls.includes('focus:')
                    );

                    expect(hasVisualFeedback).toBe(true);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Desktop vs Mobile behavior
     * 
     * Verifica que componentes se adaptam entre desktop e mobile
     */
    test('Components adapt between desktop and mobile viewports', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('mobile', 'desktop'),
                (viewport) => {
                    const width = viewport === 'mobile' ? 375 : 1280;
                    setViewport({ width, height: 800 });

                    const { container, getByRole } = render(
                        <DatePicker placeholder="Select date" />
                    );

                    const trigger = getByRole('button');
                    fireEvent.click(trigger);

                    const calendar = container.querySelector('[data-slot="calendar"]');
                    expect(calendar).toBeInTheDocument();

                    // Em mobile, células devem ser maiores
                    const dayButtons = container.querySelectorAll('[data-slot="calendar"] button[data-day]');

                    if (dayButtons.length > 0) {
                        const firstDay = dayButtons[0] as HTMLElement;
                        const size = getTouchTargetSize(firstDay);

                        if (viewport === 'mobile') {
                            // Em mobile, deve ter pelo menos 44px
                            expect(size.height).toBeGreaterThanOrEqual(44);
                        }
                        // Em desktop, pode ser menor mas ainda funcional
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Combobox search functionality
     * 
     * Verifica que busca do combobox funciona em mobile
     */
    test('Combobox search works correctly on mobile', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        value: fc.string(),
                        label: fc.string(),
                    }),
                    { minLength: 5, maxLength: 15 }
                ),
                fc.string({ minLength: 1, maxLength: 5 }),
                (options, searchTerm) => {
                    setViewport({ width: 375, height: 667 });

                    const { container, getByRole } = render(
                        <Combobox
                            options={options as ComboboxOption[]}
                            value={[]}
                            onValueChange={() => { }}
                        />
                    );

                    // Abre o combobox
                    const trigger = getByRole('combobox');
                    fireEvent.click(trigger);

                    // Encontra o input de busca
                    const searchInput = container.querySelector('input') as HTMLInputElement;
                    expect(searchInput).toBeInTheDocument();

                    // Verifica que input tem autofocus em mobile
                    expect(searchInput).toHaveAttribute('autoFocus');

                    // Simula digitação
                    fireEvent.change(searchInput, { target: { value: searchTerm } });

                    // Verifica que valor foi atualizado
                    expect(searchInput.value).toBe(searchTerm);
                }
            ),
            { numRuns: 50 }
        );
    });
});
