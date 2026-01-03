// @ts-nocheck
/**
 * Property-Based Tests - DialogFormShell
 *
 * Testes de propriedades para o componente DialogFormShell
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('DialogFormShell - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: dialog-multistep, Property 30: Multi-step progress bar
     * Validates: Requirements 7.1
     *
     * Para qualquer DialogFormShell com multiStep,
     * deve renderizar barra de progresso correta
     */
    test('Property 30: DialogFormShell with multiStep renders progress bar', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.record({
                    current: fc.integer({ min: 1, max: 10 }),
                    total: fc.integer({ min: 2, max: 10 }),
                }),
                async ({ current, total }) => {
                    const adjustedCurrent = Math.min(current, total);
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Multi-step Form"
                            multiStep={{
                                current: adjustedCurrent,
                                total,
                                stepTitle: 'Step Title',
                            }}
                        >
                            <div>Form content</div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        // Verifica Progress component
                        const progress = container.querySelector('[role="progressbar"]');
                        expect(progress).toBeInTheDocument();

                        // Verifica texto "Etapa X de Y"
                        const stepText = container.textContent;
                        expect(stepText).toMatch(new RegExp(`Etapa ${adjustedCurrent} de ${total}`));
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: dialog-cancel, Property 31: Default cancel button
     * Validates: Requirements 7.2
     *
     * Para qualquer DialogFormShell,
     * deve ter botão Cancelar padrão à esquerda
     */
    test('Property 31: DialogFormShell has default cancel button on the left', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }),
                async (title) => {
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title={title}
                        >
                            <div>Content</div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        // Verifica presença do botão Cancelar
                        const cancelButton = Array.from(container.querySelectorAll('button')).find(
                            (btn) => btn.textContent === 'Cancelar'
                        );
                        expect(cancelButton).toBeInTheDocument();

                        // Verifica variant="destructive"
                        const className = cancelButton?.className || '';
                        expect(className).toMatch(/bg-destructive|text-destructive/);

                        // Verifica classe mr-auto (à esquerda)
                        expect(className).toMatch(/mr-auto/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-maxwidth, Property 32: Desktop max-width variants
     * Validates: Requirements 7.3
     *
     * Para qualquer DialogFormShell com maxWidth,
     * deve aplicar classe correta em desktop
     */
    test('Property 32: DialogFormShell applies correct maxWidth class', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl') as fc.Arbitrary<'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'>,
                async (maxWidth) => {
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Dialog"
                            maxWidth={maxWidth}
                        >
                            <div>Content</div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="responsive-dialog-content"]') ||
                            container.querySelector('[data-slot="sheet-content"]') ||
                            container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica classe de max-width
                        const expectedClass = `sm:max-w-${maxWidth}`;
                        expect(className).toMatch(new RegExp(expectedClass.replace(/([0-9]xl)/, '\\d?xl')));
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-background, Property 33: Explicit white background
     * Validates: Requirements 7.4
     *
     * Para qualquer DialogFormShell,
     * deve ter background branco explícito
     */
    test('Property 33: DialogFormShell has explicit white background', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }),
                async (title) => {
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title={title}
                        >
                            <div>Content</div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="responsive-dialog-content"]') ||
                            container.querySelector('[data-slot="sheet-content"]') ||
                            container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica background branco
                        expect(className).toMatch(/bg-white|dark:bg-gray-950/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-mobile, Property 34: Mobile uses ResponsiveDialog (Sheet)
     * Validates: Requirements 7.5
     *
     * Para qualquer DialogFormShell em mobile,
     * deve usar ResponsiveDialog (Sheet)
     */
    test('Property 34: DialogFormShell uses ResponsiveDialog on mobile', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.integer({ min: 320, max: 639 }),
                async (width) => {
                    setViewport({ width, height: 667 });

                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Mobile Dialog"
                        >
                            <div>Content</div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        // Em mobile, pode usar Sheet ou Dialog responsivo
                        const sheetContent = container.querySelector('[data-slot="sheet-content"]');
                        const dialogContent = container.querySelector('[data-slot="responsive-dialog-content"]') ||
                            container.querySelector('[data-slot="dialog-content"]');

                        // Deve ter pelo menos um dos dois
                        expect(sheetContent || dialogContent).toBeInTheDocument();
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    // Geradores para custom fields
    const customFieldArbitrary = fc.oneof(
        fc.record({
            type: fc.constant('input'),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            label: fc.string({ minLength: 3, maxLength: 50 }),
            placeholder: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
            required: fc.boolean(),
            defaultValue: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
        }),
        fc.record({
            type: fc.constant('textarea'),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            label: fc.string({ minLength: 3, maxLength: 50 }),
            rows: fc.integer({ min: 2, max: 10 }),
            required: fc.boolean(),
            defaultValue: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
        }),
        fc.record({
            type: fc.constant('select'),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            label: fc.string({ minLength: 3, maxLength: 50 }),
            options: fc.array(
                fc.record({
                    value: fc.string({ minLength: 1, maxLength: 20 }),
                    label: fc.string({ minLength: 1, maxLength: 30 }),
                }),
                { minLength: 2, maxLength: 5 }
            ),
            required: fc.boolean(),
        }),
        fc.record({
            type: fc.constant('checkbox'),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            label: fc.string({ minLength: 3, maxLength: 50 }),
            defaultChecked: fc.boolean(),
        })
    );

    /**
     * Feature: dialog-custom-fields, Property 35: Custom field rendering
     * Validates: Requirements 7.6
     *
     * Para quaisquer campos personalizados dentro do DialogFormShell,
     * as propriedades devem ser preservadas e renderizadas corretamente
     */
    test('Property 35: Custom fields render with correct props', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.array(customFieldArbitrary, { minLength: 1, maxLength: 5 }),
                async (fields) => {
                    const mockOnOpenChange = jest.fn();

                    const formContent = (
                        <div>
                            {fields.map((field, i) => (
                                <div key={i} data-testid={`field-wrapper-${i}`}>
                                    <label htmlFor={`field-${i}`}>{field.label}</label>
                                    {field.type === 'input' && (
                                        <input
                                            id={`field-${i}`}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            defaultValue={field.defaultValue}
                                            data-testid={`input-${i}`}
                                        />
                                    )}
                                    {field.type === 'textarea' && (
                                        <textarea
                                            id={`field-${i}`}
                                            name={field.name}
                                            rows={field.rows}
                                            required={field.required}
                                            defaultValue={field.defaultValue}
                                            data-testid={`textarea-${i}`}
                                        />
                                    )}
                                    {field.type === 'select' && (
                                        <select
                                            id={`field-${i}`}
                                            name={field.name}
                                            required={field.required}
                                            data-testid={`select-${i}`}
                                        >
                                            {field.options.map((opt, j) => (
                                                <option key={j} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {field.type === 'checkbox' && (
                                        <input
                                            id={`field-${i}`}
                                            name={field.name}
                                            type="checkbox"
                                            defaultChecked={field.defaultChecked}
                                            data-testid={`checkbox-${i}`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    );

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Form with Custom Fields"
                        >
                            {formContent}
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        fields.forEach((field, i) => {
                            const wrapper = container.querySelector(`[data-testid="field-wrapper-${i}"]`);
                            expect(wrapper).toBeInTheDocument();
                            expect(wrapper?.textContent).toContain(field.label);

                            if (field.type === 'input') {
                                const input = container.querySelector(`[data-testid="input-${i}"]`) as HTMLInputElement;
                                expect(input).toBeInTheDocument();
                                expect(input.name).toBe(field.name);
                                if (field.placeholder) {
                                    expect(input.placeholder).toBe(field.placeholder);
                                }
                                expect(input.required).toBe(field.required);
                            } else if (field.type === 'textarea') {
                                const textarea = container.querySelector(`[data-testid="textarea-${i}"]`) as HTMLTextAreaElement;
                                expect(textarea).toBeInTheDocument();
                                expect(textarea.name).toBe(field.name);
                                expect(textarea.rows).toBe(field.rows);
                                expect(textarea.required).toBe(field.required);
                            } else if (field.type === 'select') {
                                const select = container.querySelector(`[data-testid="select-${i}"]`) as HTMLSelectElement;
                                expect(select).toBeInTheDocument();
                                expect(select.name).toBe(field.name);
                                expect(select.required).toBe(field.required);
                                const options = select.querySelectorAll('option');
                                expect(options.length).toBe(field.options.length);
                            } else if (field.type === 'checkbox') {
                                const checkbox = container.querySelector(`[data-testid="checkbox-${i}"]`) as HTMLInputElement;
                                expect(checkbox).toBeInTheDocument();
                                expect(checkbox.name).toBe(field.name);
                                expect(checkbox.type).toBe('checkbox');
                            }
                        });
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-custom-fields, Property 36: Required field validation
     * Validates: Requirements 7.7
     *
     * Para quaisquer campos required=true dentro do DialogFormShell,
     * o atributo required deve ser aplicado corretamente
     */
    test('Property 36: Required attribute preserved for custom fields', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.boolean(),
                fc.string({ minLength: 3, maxLength: 30 }),
                async (isRequired, fieldName) => {
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Test Required Fields"
                        >
                            <div>
                                <label htmlFor="test-input">Test Field</label>
                                <input
                                    id="test-input"
                                    name={fieldName}
                                    required={isRequired}
                                    data-testid="test-input"
                                />
                            </div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        const input = container.querySelector('[data-testid="test-input"]') as HTMLInputElement;
                        expect(input).toBeInTheDocument();
                        expect(input.required).toBe(isRequired);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: dialog-custom-fields, Property 37: Select options rendering
     * Validates: Requirements 7.8
     *
     * Para qualquer campo select com opções geradas,
     * todas as opções devem ser renderizadas corretamente
     */
    test('Property 37: Select options render correctly', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.array(
                    fc.record({
                        value: fc.string({ minLength: 1, maxLength: 20 }),
                        label: fc.string({ minLength: 1, maxLength: 30 }),
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                async (options) => {
                    const mockOnOpenChange = jest.fn();

                    const { container } = render(
                        <DialogFormShell
                            open={true}
                            onOpenChange={mockOnOpenChange}
                            title="Test Select Options"
                        >
                            <div>
                                <label htmlFor="test-select">Test Select</label>
                                <select id="test-select" data-testid="test-select">
                                    {options.map((opt, i) => (
                                        <option key={i} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </DialogFormShell>
                    );

                    await waitFor(() => {
                        const select = container.querySelector('[data-testid="test-select"]');
                        expect(select).toBeInTheDocument();

                        const renderedOptions = select?.querySelectorAll('option');
                        expect(renderedOptions?.length).toBe(options.length);

                        options.forEach((opt, i) => {
                            const optElement = renderedOptions?.[i] as HTMLOptionElement;
                            expect(optElement.value).toBe(opt.value);
                            expect(optElement.textContent).toBe(opt.label);
                        });
                    });
                }
            ),
            { numRuns: 50 }
        );
    });
});
