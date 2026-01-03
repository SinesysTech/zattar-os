"use client";

import * as React from "react";
import { useForm, UseFormReturn, FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Field types supported by FormShell
 */
export type FormFieldType = "text" | "select" | "checkbox" | "date";

/**
 * Option for select fields
 */
export interface FormSelectOption {
  value: string;
  label: string;
}

/**
 * Base field configuration
 */
export interface FormFieldConfig {
  /** Field name/key */
  name: string;
  /** Field type */
  type: FormFieldType;
  /** Field label */
  label: string;
  /** Placeholder text (for text/select) */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Options for select fields */
  options?: FormSelectOption[];
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Custom className for the field */
  className?: string;
  /** Number of columns to span (1-3 or 'full') */
  span?: 1 | 2 | 3 | "full";
}

/**
 * Props for FormShell component
 */
export interface FormShellProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form fields configuration */
  fields: FormFieldConfig[];
  /** Submit handler */
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Submit button label */
  submitLabel?: string;
  /** Additional actions to render in footer */
  actions?: React.ReactNode;
  /** Number of columns (1-3), adapts responsively */
  columns?: 1 | 2 | 3;
  /** Gap between fields */
  gap?: 2 | 3 | 4 | 6 | 8;
  /** Additional className */
  className?: string;
  /** Form instance from parent (for controlled forms) */
  form?: UseFormReturn<TFieldValues>;
  /** Default values for form */
  defaultValues?: Partial<TFieldValues>;
  /** Children to render inside the form (for custom fields) */
  children?: React.ReactNode;
}

/**
 * FormShell - Reusable form wrapper with responsive grid and custom field support
 *
 * Provides:
 * - Responsive grid layout (1 col mobile, 2 col tablet, configurable desktop)
 * - Custom field types (text, select, checkbox, date)
 * - Error display via FormMessage
 * - Loading state for submit button
 * - Full accessibility (labels linked via htmlFor, ARIA attributes)
 *
 * @example
 * ```tsx
 * <FormShell
 *   fields={[
 *     { name: "name", type: "text", label: "Nome" },
 *     { name: "type", type: "select", label: "Tipo", options: [...] },
 *   ]}
 *   onSubmit={handleSubmit}
 *   loading={isLoading}
 *   submitLabel="Salvar"
 * />
 * ```
 */
export function FormShell<TFieldValues extends FieldValues = FieldValues>({
  fields,
  onSubmit,
  loading = false,
  submitLabel = "Salvar",
  actions,
  columns = 2,
  gap = 4,
  className,
  form: externalForm,
  defaultValues,
  children,
}: FormShellProps<TFieldValues>) {
  // Create internal form if not provided
  const internalForm = useForm<TFieldValues>({
    defaultValues: defaultValues as TFieldValues,
  });

  const form = externalForm || internalForm;

  // Get responsive grid classes
  const gridClasses = cn(
    "grid w-full",
    // Mobile: single column
    "grid-cols-1",
    // Tablet: 2 columns max
    columns >= 2 && "md:grid-cols-2",
    // Desktop: configured columns
    columns === 3 && "lg:grid-cols-3",
    // Gap
    gap === 2 && "gap-2",
    gap === 3 && "gap-3",
    gap === 4 && "gap-4",
    gap === 6 && "gap-6",
    gap === 8 && "gap-8"
  );

  // Get span class for field
  const getSpanClass = (span?: 1 | 2 | 3 | "full") => {
    if (!span) return "";
    if (span === "full") return "col-span-full";
    if (span === 2) return "md:col-span-2";
    if (span === 3) return "lg:col-span-3";
    return "";
  };

  // Render field based on type
  const renderField = (fieldConfig: FormFieldConfig) => {
    const { name, type, label, placeholder, required, options, disabled, className: fieldClassName, span } = fieldConfig;

    return (
      <FormField
        key={name}
        control={form.control}
        name={name as Path<TFieldValues>}
        render={({ field, fieldState }) => (
          <FormItem
            className={cn(getSpanClass(span), fieldClassName)}
            data-testid={`form-field-${name}`}
          >
            <FormLabel
              data-required={required}
              className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}
            >
              {label}
            </FormLabel>
            <FormControl>
              {type === "text" && (
                <Input
                  {...field}
                  placeholder={placeholder}
                  disabled={disabled || loading}
                  aria-invalid={!!fieldState.error}
                  aria-describedby={fieldState.error ? `${name}-error` : undefined}
                  data-testid={`input-${name}`}
                />
              )}
              {type === "select" && (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled || loading}
                >
                  <SelectTrigger
                    aria-invalid={!!fieldState.error}
                    data-testid={`select-${name}`}
                  >
                    <SelectValue placeholder={placeholder || "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "checkbox" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled || loading}
                    aria-invalid={!!fieldState.error}
                    data-testid={`checkbox-${name}`}
                  />
                </div>
              )}
              {type === "date" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={disabled || loading}
                      aria-invalid={!!fieldState.error}
                      data-testid={`date-${name}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>{placeholder || "Selecione uma data"}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </FormControl>
            <FormMessage
              id={`${name}-error`}
              data-testid={`error-${name}`}
            />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-6", className)}
        data-testid="form-shell"
        data-loading={loading}
      >
        <div className={gridClasses} data-testid="form-grid">
          {fields.map(renderField)}
          {children}
        </div>

        {/* Form Actions */}
        <div
          className={cn(
            "flex gap-3",
            // Mobile: stack vertically
            "flex-col sm:flex-row",
            "[&>button]:w-full sm:[&>button]:w-auto",
            "sm:justify-end"
          )}
          data-testid="form-actions"
        >
          {actions}
          <Button
            type="submit"
            disabled={loading}
            data-testid="submit-button"
            aria-disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type { FormShellProps };
