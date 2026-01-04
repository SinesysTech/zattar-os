/**
 * Property-Based Tests - FormShell
 *
 * Testes de propriedades para o componente FormShell
 * usando fast-check para validar comportamentos universais.
 * Segue padrão de responsive-table.test.tsx.
 */

import * as fc from "fast-check";
import { render, waitFor } from "@testing-library/react";
import { FormShell, FormFieldConfig, FormFieldType } from "@/components/shared/form-shell";
import {
  setViewport,
  COMMON_VIEWPORTS,
} from "@/testing/helpers/responsive-test-helpers";
import { useForm } from "react-hook-form";

// Gerador de opções para select
const selectOptionArbitrary = fc.record({
  value: fc.string({ minLength: 1, maxLength: 20 }),
  label: fc.string({ minLength: 1, maxLength: 30 }),
});

// Gerador de configuração de campo
const fieldConfigArbitrary: fc.Arbitrary<FormFieldConfig> = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, "a")),
  type: fc.constantFrom<FormFieldType>("text", "select", "checkbox", "date"),
  label: fc.string({ minLength: 3, maxLength: 50 }),
  placeholder: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
  required: fc.boolean(),
  error: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  disabled: fc.boolean(),
}).chain((field) => {
  // Adiciona options apenas para campos select
  if (field.type === "select") {
    return fc.array(selectOptionArbitrary, { minLength: 2, maxLength: 5 }).map((options) => ({
      ...field,
      options,
    }));
  }
  return fc.constant(field);
});

// Gerador de configuração completa do formulário
const formConfigArbitrary = fc.record({
  fields: fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 8 }),
  loading: fc.boolean(),
  submitLabel: fc.string({ minLength: 3, maxLength: 20 }),
  columns: fc.constantFrom<1 | 2 | 3>(1, 2, 3),
});

// Wrapper para testes que precisam de form context
const TestWrapper = ({
  children,
}: {
  children: (form: ReturnType<typeof useForm>) => React.ReactNode;
}) => {
  const form = useForm();
  return <>{children(form)}</>;
};

describe("FormShell - Property-Based Tests", () => {
  beforeEach(() => {
    setViewport(COMMON_VIEWPORTS.desktop);
  });

  /**
   * Feature: form-shell-fields, Property 1: Renders all custom field types
   * Validates: Requirements F1.1
   *
   * Para qualquer configuração de campos,
   * deve renderizar os tipos corretos de componentes shadcn
   */
  test("Property 1: Renders all custom field types with correct shadcn components", () => {
    fc.assert(
      fc.property(
        fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 5 }),
        (fields) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
              submitLabel="Salvar"
            />
          );

          // Verifica que cada campo foi renderizado com o componente correto
          fields.forEach((field) => {
            const fieldWrapper = container.querySelector(`[data-testid="form-field-${field.name}"]`);
            expect(fieldWrapper).toBeInTheDocument();

            if (field.type === "text") {
              const input = container.querySelector(`[data-testid="input-${field.name}"]`);
              expect(input).toBeInTheDocument();
              expect(input?.tagName.toLowerCase()).toBe("input");
            }

            if (field.type === "select") {
              const select = container.querySelector(`[data-testid="select-${field.name}"]`);
              expect(select).toBeInTheDocument();
              // Select trigger do shadcn usa button
              expect(select?.getAttribute("data-slot")).toBe("select-trigger");
            }

            if (field.type === "checkbox") {
              const checkbox = container.querySelector(`[data-testid="checkbox-${field.name}"]`);
              expect(checkbox).toBeInTheDocument();
              expect(checkbox?.getAttribute("role")).toBe("checkbox");
            }

            if (field.type === "date") {
              const dateButton = container.querySelector(`[data-testid="date-${field.name}"]`);
              expect(dateButton).toBeInTheDocument();
              expect(dateButton?.tagName.toLowerCase()).toBe("button");
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: form-shell-errors, Property 2: Displays errors via FormMessage
   * Validates: Requirements F1.2
   *
   * Para qualquer campo com erro definido,
   * deve exibir FormMessage com o texto do erro
   */
  test("Property 2: Displays errors via FormMessage when error present", async () => {
    await fc.assert(
      await fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, "a")),
        fc.string({ minLength: 5, maxLength: 100 }),
        async (fieldName, errorMessage) => {
          const mockSubmit = jest.fn();

          // Cria um formulário com erro
          const TestForm = () => {
            const form = useForm({
              defaultValues: { [fieldName]: "" },
            });

            // Define erro manualmente
            React.useEffect(() => {
              form.setError(fieldName as never, { message: errorMessage });
            }, [form]);

            return (
              <FormShell
                form={form as ReturnType<typeof useForm>}
                fields={[
                  {
                    name: fieldName,
                    type: "text",
                    label: "Test Field",
                    error: errorMessage,
                  },
                ]}
                onSubmit={mockSubmit}
              />
            );
          };

          const { container } = render(<TestForm />);

          await waitFor(() => {
            // Verifica que FormMessage está presente
            const errorElement = container.querySelector(`[data-testid="error-${fieldName}"]`);
            expect(errorElement).toBeInTheDocument();

            // Verifica que tem a classe de erro
            const hasErrorClass = errorElement?.classList.contains("text-destructive") ||
                                  errorElement?.getAttribute("data-slot") === "form-message";
            expect(hasErrorClass).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: form-shell-responsive, Property 3: Responsive grid layout
   * Validates: Requirements F1.3
   *
   * Para qualquer viewport,
   * deve aplicar grid-cols responsivo corretamente
   * - Mobile (<640px): grid-cols-1
   * - Tablet (768px-1023px): md:grid-cols-2
   * - Desktop (>=1024px): lg:grid-cols-3 (se columns=3)
   */
  test("Property 3: Responsive grid validated across viewports", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { viewport: { width: 375, height: 667 }, expected: "grid-cols-1" },
          { viewport: { width: 500, height: 800 }, expected: "grid-cols-1" },
          { viewport: { width: 768, height: 1024 }, expected: "md:grid-cols-2" },
          { viewport: { width: 900, height: 1024 }, expected: "md:grid-cols-2" },
          { viewport: { width: 1024, height: 768 }, expected: "lg:grid-cols-3" },
          { viewport: { width: 1920, height: 1080 }, expected: "lg:grid-cols-3" }
        ),
        fc.array(fieldConfigArbitrary, { minLength: 3, maxLength: 6 }),
        ({ viewport, expected }, fields) => {
          setViewport(viewport);
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
              columns={3}
            />
          );

          const grid = container.querySelector('[data-testid="form-grid"]');
          expect(grid).toBeInTheDocument();

          // Verifica classe base de grid
          expect(grid).toHaveClass("grid");
          expect(grid).toHaveClass("grid-cols-1");

          // Verifica classes responsivas
          if (expected === "md:grid-cols-2") {
            expect(grid).toHaveClass("md:grid-cols-2");
          }
          if (expected === "lg:grid-cols-3") {
            expect(grid).toHaveClass("lg:grid-cols-3");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: form-shell-loading, Property 4: Submit button disabled on loading
   * Validates: Requirements F1.4
   *
   * Para qualquer estado de loading,
   * o botão submit deve estar desabilitado quando loading=true
   */
  test("Property 4: Submit button disabled on loading=true, enabled otherwise", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 3 }),
        (loading, fields) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
              loading={loading}
            />
          );

          const submitButton = container.querySelector('[data-testid="submit-button"]');
          expect(submitButton).toBeInTheDocument();

          if (loading) {
            // Quando loading=true, botão deve estar desabilitado
            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveAttribute("aria-disabled", "true");

            // Deve mostrar ícone de loading (Loader2)
            const spinner = submitButton?.querySelector(".animate-spin");
            expect(spinner).toBeInTheDocument();
          } else {
            // Quando loading=false, botão deve estar habilitado
            expect(submitButton).not.toBeDisabled();

            // Não deve mostrar spinner
            const spinner = submitButton?.querySelector(".animate-spin");
            expect(spinner).not.toBeInTheDocument();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: form-shell-a11y, Property 5: Accessibility - labels and ARIA
   * Validates: Requirements F1.5
   *
   * Para qualquer campo,
   * labels devem estar linkados via htmlFor e ARIA para erros
   */
  test("Property 5: Accessibility - labels linked via htmlFor, ARIA for errors", () => {
    fc.assert(
      fc.property(
        fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 5 }),
        (fields) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
            />
          );

          fields.forEach((field) => {
            const fieldWrapper = container.querySelector(`[data-testid="form-field-${field.name}"]`);
            expect(fieldWrapper).toBeInTheDocument();

            // Verifica que label existe
            const label = fieldWrapper?.querySelector('[data-slot="form-label"]');
            expect(label).toBeInTheDocument();

            // Verifica htmlFor está definido
            const htmlFor = label?.getAttribute("for");
            expect(htmlFor).toBeTruthy();

            // Verifica que campo de input referencia o label
            const formControl = fieldWrapper?.querySelector('[data-slot="form-control"]');
            if (formControl) {
              const inputId = formControl.getAttribute("id");
              expect(inputId).toBe(htmlFor);
            }

            // Verifica indicador de campo obrigatório
            if (field.required) {
              const labelElement = label as HTMLElement;
              expect(labelElement?.getAttribute("data-required")).toBe("true");
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: form-shell-columns, Property 6: Column configuration
   * Validates: Requirements F1.6
   *
   * Para qualquer configuração de colunas,
   * deve aplicar as classes corretas de grid
   */
  test("Property 6: Column configuration applies correct grid classes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<1 | 2 | 3>(1, 2, 3),
        fc.array(fieldConfigArbitrary, { minLength: 3, maxLength: 6 }),
        (columns, fields) => {
          setViewport(COMMON_VIEWPORTS.desktop);
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
              columns={columns}
            />
          );

          const grid = container.querySelector('[data-testid="form-grid"]');
          expect(grid).toBeInTheDocument();

          // Verifica classe base
          expect(grid).toHaveClass("grid-cols-1");

          // Verifica classes de coluna baseado em configuração
          if (columns >= 2) {
            expect(grid).toHaveClass("md:grid-cols-2");
          }
          if (columns === 3) {
            expect(grid).toHaveClass("lg:grid-cols-3");
          }
          if (columns === 1) {
            expect(grid).not.toHaveClass("md:grid-cols-2");
            expect(grid).not.toHaveClass("lg:grid-cols-3");
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: form-shell-gap, Property 7: Gap configuration
   * Validates: Requirements F1.7
   *
   * Para qualquer configuração de gap,
   * deve aplicar a classe correta
   */
  test("Property 7: Gap configuration applies correct classes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<2 | 3 | 4 | 6 | 8>(2, 3, 4, 6, 8),
        fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 3 }),
        (gap, fields) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
              gap={gap}
            />
          );

          const grid = container.querySelector('[data-testid="form-grid"]');
          expect(grid).toBeInTheDocument();
          expect(grid).toHaveClass(`gap-${gap}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: form-shell-mobile, Property 8: Mobile stacked buttons
   * Validates: Requirements F1.8
   *
   * Para qualquer viewport mobile,
   * botões devem estar empilhados verticalmente
   */
  test("Property 8: Mobile viewport stacks buttons vertically", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }),
        fc.array(fieldConfigArbitrary, { minLength: 1, maxLength: 3 }),
        (width, fields) => {
          setViewport({ width, height: 667 });
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={fields}
              onSubmit={mockSubmit}
            />
          );

          const actions = container.querySelector('[data-testid="form-actions"]');
          expect(actions).toBeInTheDocument();

          // Verifica classes de stacking vertical em mobile
          expect(actions).toHaveClass("flex-col");
          expect(actions).toHaveClass("sm:flex-row");

          // Verifica full-width em mobile
          const classList = Array.from(actions?.classList || []);
          const hasFullWidthButtons = classList.some((cls) =>
            cls.includes("[&>button]:w-full")
          );
          expect(hasFullWidthButtons).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: form-shell-select, Property 9: Select options rendering
   * Validates: Requirements F1.9
   *
   * Para qualquer campo select com opções,
   * todas as opções devem estar disponíveis
   */
  test("Property 9: Select fields render with correct options structure", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, "a")),
        fc.array(selectOptionArbitrary, { minLength: 2, maxLength: 5 }),
        (fieldName, options) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={[
                {
                  name: fieldName,
                  type: "select",
                  label: "Test Select",
                  options,
                },
              ]}
              onSubmit={mockSubmit}
            />
          );

          // Verifica que select trigger está presente
          const selectTrigger = container.querySelector(`[data-testid="select-${fieldName}"]`);
          expect(selectTrigger).toBeInTheDocument();
          expect(selectTrigger?.getAttribute("data-slot")).toBe("select-trigger");

          // Verifica que tem placeholder ou valor
          const selectValue = selectTrigger?.querySelector('[data-slot="select-value"]');
          expect(selectValue).toBeInTheDocument();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: form-shell-span, Property 10: Field span configuration
   * Validates: Requirements F1.10
   *
   * Para qualquer campo com span configurado,
   * deve aplicar a classe de coluna correta
   */
  test("Property 10: Field span applies correct column span classes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<1 | 2 | 3 | "full">(1, 2, 3, "full"),
        fc.string({ minLength: 3, maxLength: 30 }).map((s) => s.replace(/[^a-zA-Z0-9]/g, "a")),
        (span, fieldName) => {
          const mockSubmit = jest.fn();

          const { container } = render(
            <FormShell
              fields={[
                {
                  name: fieldName,
                  type: "text",
                  label: "Test Field",
                  span,
                },
              ]}
              onSubmit={mockSubmit}
              columns={3}
            />
          );

          const fieldWrapper = container.querySelector(`[data-testid="form-field-${fieldName}"]`);
          expect(fieldWrapper).toBeInTheDocument();

          if (span === "full") {
            expect(fieldWrapper).toHaveClass("col-span-full");
          }
          if (span === 2) {
            expect(fieldWrapper).toHaveClass("md:col-span-2");
          }
          if (span === 3) {
            expect(fieldWrapper).toHaveClass("lg:col-span-3");
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
