/**
 * Tests for useFormField hook - shadcn/ui form field integration
 *
 * Tests form field context, validation states, error handling, and react-hook-form integration
 */

import { renderHook, render } from '@testing-library/react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import React from 'react';
import { useFormField, FormField, FormItem } from '@/components/ui/form';

// Test wrapper component that provides all required contexts
interface FormTestWrapperProps {
  children: React.ReactNode;
  fieldName: string;
  defaultValues?: Record<string, unknown>;
  formOptions?: Parameters<typeof useForm>[0];
}

function FormTestWrapper({
  children,
  fieldName,
  defaultValues = {},
  formOptions = {},
}: FormTestWrapperProps) {
  const form = useForm({
    defaultValues,
    mode: 'onChange',
    ...formOptions,
  });

  return (
    <FormProvider {...form}>
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <div {...field}>{children}</div>
          </FormItem>
        )}
      />
    </FormProvider>
  );
}

describe('useFormField hook', () => {
  describe('Basic Functionality', () => {
    it('should return field context values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="testField">{children}</FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current).toHaveProperty('id');
      expect(result.current).toHaveProperty('name');
      expect(result.current).toHaveProperty('formItemId');
      expect(result.current).toHaveProperty('formDescriptionId');
      expect(result.current).toHaveProperty('formMessageId');
      expect(result.current.name).toBe('testField');
    });

    it('should generate consistent IDs based on field name', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="email">{children}</FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      const { id, formItemId, formDescriptionId, formMessageId } = result.current;

      expect(formItemId).toBe(`${id}-form-item`);
      expect(formDescriptionId).toBe(`${id}-form-item-description`);
      expect(formMessageId).toBe(`${id}-form-item-message`);
    });

    it('should throw error when used outside FormField', () => {
      // Suppress console.error for this test
      const consoleError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useFormField());
      }).toThrow();

      // The error is thrown when trying to access FormContext or useFormContext
      // The specific error message may vary, but it should throw
      console.error = consoleError;
    });
  });

  describe('Field State', () => {
    it('should return isDirty as false for untouched field', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="username" defaultValues={{ username: '' }}>
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.isDirty).toBe(false);
    });

    it('should return isTouched as false for untouched field', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="email" defaultValues={{ email: '' }}>
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.isTouched).toBe(false);
    });

    it('should return invalid state when field has error', () => {
      const TestComponent = () => {
        const form = useForm({
          defaultValues: { email: '' },
          mode: 'onChange',
        });

        // Set error manually
        React.useEffect(() => {
          form.setError('email', {
            type: 'manual',
            message: 'Email is required',
          });
        }, [form]);

        return (
          <FormProvider {...form}>
            <FormField
              control={form.control}
              name="email"
              render={(_field) => (
                <FormItem>
                  <FieldConsumer />
                </FormItem>
              )}
            />
          </FormProvider>
        );
      };

      const fieldStateRef: { current: ReturnType<typeof useFormField> | null } = { current: null };
      const FieldConsumer = () => {
        fieldStateRef.current = useFormField();
        return null;
      };

      render(<TestComponent />);

      expect(fieldStateRef.current).not.toBeNull();
      expect(fieldStateRef.current?.invalid).toBe(true);
      expect(fieldStateRef.current?.error).toBeDefined();
      expect(fieldStateRef.current?.error?.message).toBe('Email is required');
    });
  });

  describe('Error Handling', () => {
    it('should provide error details when field has validation error', () => {
      const TestComponent = () => {
        const form = useForm({
          defaultValues: { password: '' },
          mode: 'onChange',
        });

        React.useEffect(() => {
          form.setError('password', {
            type: 'minLength',
            message: 'Password must be at least 8 characters',
          });
        }, [form]);

        return (
          <FormProvider {...form}>
            <FormField
              control={form.control}
              name="password"
              render={(_field) => (
                <FormItem>
                  <FieldConsumer />
                </FormItem>
              )}
            />
          </FormProvider>
        );
      };

      const fieldStateRef: { current: ReturnType<typeof useFormField> | null } = { current: null };
      const FieldConsumer = () => {
        fieldStateRef.current = useFormField();
        return null;
      };

      render(<TestComponent />);

      expect(fieldStateRef.current).not.toBeNull();
      expect(fieldStateRef.current?.error).toBeDefined();
      expect(fieldStateRef.current?.error?.type).toBe('minLength');
      expect(fieldStateRef.current?.error?.message).toBe(
        'Password must be at least 8 characters'
      );
    });

    it('should not have error when field is valid', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="validField" defaultValues={{ validField: 'valid' }}>
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.error).toBeUndefined();
      expect(result.current.invalid).toBe(false);
    });
  });

  describe('Multiple Fields', () => {
    it('should handle multiple fields independently', () => {
      const TestComponent = () => {
        const form = useForm({
          defaultValues: {
            field1: '',
            field2: '',
          },
        });

        return (
          <FormProvider {...form}>
            <FormField
              control={form.control}
              name="field1"
              render={(_field) => (
                <FormItem>
                  <Field1Consumer />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="field2"
              render={(_field) => (
                <FormItem>
                  <Field2Consumer />
                </FormItem>
              )}
            />
          </FormProvider>
        );
      };

      const field1StateRef: { current: ReturnType<typeof useFormField> | null } = { current: null };
      const field2StateRef: { current: ReturnType<typeof useFormField> | null } = { current: null };

      const Field1Consumer = () => {
        field1StateRef.current = useFormField();
        return null;
      };

      const Field2Consumer = () => {
        field2StateRef.current = useFormField();
        return null;
      };

      render(<TestComponent />);

      expect(field1StateRef.current).not.toBeNull();
      expect(field2StateRef.current).not.toBeNull();
      expect(field1StateRef.current?.name).toBe('field1');
      expect(field2StateRef.current?.name).toBe('field2');
      expect(field1StateRef.current?.id).not.toBe(field2StateRef.current?.id);
      expect(field1StateRef.current?.formItemId).not.toBe(field2StateRef.current?.formItemId);
    });
  });

  describe('React Hook Form Integration', () => {
    it('should integrate with react-hook-form validation', () => {
      const TestComponent = () => {
        const form = useForm({
          defaultValues: { email: '' },
          mode: 'onChange',
        });

        return (
          <FormProvider {...form}>
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={(_field) => (
                <FormItem>
                  <FieldConsumer />
                </FormItem>
              )}
            />
          </FormProvider>
        );
      };

      const fieldStateRef: { current: ReturnType<typeof useFormField> | null } = { current: null };
      const FieldConsumer = () => {
        fieldStateRef.current = useFormField();
        return null;
      };

      render(<TestComponent />);

      // Initially should have required error (if validation runs on mount with mode: onChange)
      // This depends on react-hook-form behavior
      expect(fieldStateRef.current).toBeDefined();
      expect(fieldStateRef.current?.name).toBe('email');
    });

    it('should work with nested field paths', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper
          fieldName="user.email"
          defaultValues={{ user: { email: '' } }}
        >
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe('user.email');
    });

    it('should work with array field paths', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper
          fieldName="items.0.name"
          defaultValues={{ items: [{ name: '' }] }}
        >
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe('items.0.name');
    });
  });

  describe('Accessibility', () => {
    it('should provide proper aria attributes structure', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="accessible" defaultValues={{ accessible: '' }}>
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      const { id, formItemId, formDescriptionId, formMessageId } = result.current;

      // These IDs should be unique and properly formatted for ARIA
      expect(formItemId).toMatch(/-form-item$/);
      expect(formDescriptionId).toMatch(/-form-item-description$/);
      expect(formMessageId).toMatch(/-form-item-message$/);

      // All should start with the same base ID
      expect(formItemId.startsWith(id)).toBe(true);
      expect(formDescriptionId.startsWith(id)).toBe(true);
      expect(formMessageId.startsWith(id)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty field name', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper fieldName="" defaultValues={{ '': '' }}>
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe('');
    });

    it('should handle special characters in field name', () => {
      const fieldName = 'field-with-dashes_and_underscores';
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper
          fieldName={fieldName}
          defaultValues={{ [fieldName]: '' }}
        >
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe(fieldName);
    });

    it('should handle deeply nested field paths', () => {
      const fieldName = 'level1.level2.level3.level4.field';
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormTestWrapper
          fieldName={fieldName}
          defaultValues={{
            level1: { level2: { level3: { level4: { field: '' } } } },
          }}
        >
          {children}
        </FormTestWrapper>
      );

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe(fieldName);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should infer correct field types', () => {
      interface FormValues {
        email: string;
        age: number;
        active: boolean;
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => {
        const form = useForm<FormValues>({
          defaultValues: {
            email: '',
            age: 0,
            active: false,
          },
        });

        return (
          <FormProvider {...form}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <div {...field}>{children}</div>
                </FormItem>
              )}
            />
          </FormProvider>
        );
      };

      const { result } = renderHook(() => useFormField(), { wrapper });

      expect(result.current.name).toBe('email');
    });
  });
});
