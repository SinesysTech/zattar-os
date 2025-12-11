'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateZodSchema } from '@/features/assinatura-digital/utils';
import {
  DynamicFormSchema,
  FormFieldType,
  FormFieldSchema,
  FormSectionSchema,
  DynamicFormData,
  ConditionalRule,
} from '@/types/assinatura-digital';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { InputCPF, InputTelefone, InputCEP, type AddressData, InputData, InputCPFCNPJ } from '@/features/assinatura-digital/components/inputs';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicFormRendererProps {
  schema: DynamicFormSchema;
  onSubmit: (data: DynamicFormData) => void | Promise<void>;
  defaultValues?: DynamicFormData;
  isSubmitting?: boolean;
  formId?: string;
}

export default function DynamicFormRenderer({
  schema,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  formId,
}: DynamicFormRendererProps) {
  // Generate Zod schema from form schema
  const zodSchema = useMemo(() => generateZodSchema(schema), [schema]);

  // Derive default values from schema and merge with provided defaultValues
  const mergedDefaultValues = useMemo(() => {
    const schemaDefaults: DynamicFormData = {};

    // Collect default values from schema
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          schemaDefaults[field.id] = field.defaultValue;
        }
      });
    });

    // Merge with provided defaultValues (provided values take precedence)
    return {
      ...schemaDefaults,
      ...(defaultValues || {}),
    };
  }, [schema, defaultValues]);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
    defaultValues: mergedDefaultValues,
  });

  // Watch all values for conditional rendering
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch é necessário para renderização condicional
  const formValues = form.watch() as DynamicFormData;

  // Collect all field IDs from schema for CEP auto-fill detection
  const fieldIds = useMemo(() => {
    const ids = new Set<string>();
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        ids.add(field.id);
      });
    });
    return ids;
  }, [schema]);

  /**
   * Evaluate conditional rule to determine if field should be rendered
   */
  const evaluateConditional = (
    conditional: ConditionalRule,
    values: DynamicFormData
  ): boolean => {
    const controlValue = values[conditional.field];

    switch (conditional.operator) {
      case '=':
        return controlValue === conditional.value;
      case '!=':
        return controlValue !== conditional.value;
      case '>':
        return Number(controlValue) > Number(conditional.value);
      case '<':
        return Number(controlValue) < Number(conditional.value);
      case 'contains':
        return String(controlValue).includes(String(conditional.value));
      case 'empty':
        return !controlValue || controlValue === '';
      case 'notEmpty':
        return !!controlValue && controlValue !== '';
      default:
        return true;
    }
  };

  /**
   * Handle address found from CEP lookup
   */
  const handleAddressFound = (address: AddressData) => {
    // Auto-fill related fields based on naming conventions
    const fieldMappings = {
      logradouro: address.logradouro,
      bairro: address.bairro,
      cidade: address.localidade,
      estado: address.uf,
    };

    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
      // Check if field exists in schema and has a value
      if (value && fieldIds.has(fieldName)) {
        form.setValue(fieldName, value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });
  };

  /**
   * Render individual field based on type
   * Note: FormControl is now rendered inside renderFieldControl for each field type
   * to avoid nested FormControl issues (especially with SELECT which has its own structure)
   */
  const renderField = (field: FormFieldSchema) => {
    return (
      <FormField
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: fieldProps }) => (
          <FormItem>
            <FormLabel
              className={field.helpText ? 'flex items-center gap-2' : undefined}
            >
              {field.label}
              {field.helpText && (
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </FormLabel>
            {renderFieldControl(field, fieldProps)}
            <FormMessage />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </FormItem>
        )}
      />
    );
  };

  /**
   * Render field control based on field type
   * Each field type is wrapped with FormControl to ensure proper ARIA attributes
   * and tooltip behavior for validation errors.
   */
  const renderFieldControl = (
    field: FormFieldSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fieldProps: any
  ): React.ReactNode => {
    const commonProps = {
      disabled: field.disabled || isSubmitting,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case FormFieldType.TEXT:
      case FormFieldType.EMAIL:
        return (
          <FormControl>
            <Input {...commonProps} {...fieldProps} />
          </FormControl>
        );

      case FormFieldType.TEXTAREA:
        return (
          <FormControl>
            <Textarea rows={4} {...commonProps} {...fieldProps} />
          </FormControl>
        );

      case FormFieldType.NUMBER:
        return (
          <FormControl>
            <Input type="number" {...commonProps} {...fieldProps} />
          </FormControl>
        );

      case FormFieldType.DATE:
        return (
          <FormControl>
            <InputData
              placeholder={field.placeholder || 'dd/mm/aaaa'}
              disabled={field.disabled || isSubmitting}
              {...fieldProps}
            />
          </FormControl>
        );

      case FormFieldType.CPF:
        return (
          <FormControl>
            <InputCPF
              placeholder={field.placeholder || '000.000.000-00'}
              disabled={field.disabled || isSubmitting}
              {...fieldProps}
            />
          </FormControl>
        );

      case FormFieldType.CNPJ:
        return (
          <FormControl>
            <InputCPFCNPJ
              placeholder={field.placeholder}
              disabled={field.disabled || isSubmitting}
              {...fieldProps}
            />
          </FormControl>
        );

      case FormFieldType.PHONE:
        return (
          <FormControl>
            <InputTelefone
              placeholder={field.placeholder || '(00) 00000-0000'}
              disabled={field.disabled || isSubmitting}
              {...fieldProps}
            />
          </FormControl>
        );

      case FormFieldType.CEP:
        return (
          <FormControl>
            <InputCEP
              placeholder={field.placeholder || '00000-000'}
              disabled={field.disabled || isSubmitting}
              onAddressFound={handleAddressFound}
              {...fieldProps}
            />
          </FormControl>
        );

      case FormFieldType.SELECT:
        // SELECT: FormControl wraps only the SelectTrigger (not the entire Select)
        // This ensures proper ARIA attributes and tooltip behavior
        return (
          <Select
            onValueChange={fieldProps.onChange}
            value={String(fieldProps.value || '')}
            disabled={field.disabled || isSubmitting}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={field.placeholder || 'Selecione'}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case FormFieldType.RADIO:
        return (
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                // Convert string back to original type (number, boolean, or string)
                // Per FormFieldOption.value: string | number | boolean
                const firstOptionValue = field.options?.[0]?.value;
                if (typeof firstOptionValue === 'number') {
                  fieldProps.onChange(Number(value));
                } else if (typeof firstOptionValue === 'boolean') {
                  // Convert string "true"/"false" to actual boolean
                  fieldProps.onChange(value === 'true');
                } else {
                  fieldProps.onChange(value);
                }
              }}
              value={String(fieldProps.value ?? '')}
              disabled={field.disabled || isSubmitting}
              className="flex flex-wrap gap-6"
            >
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={String(option.value)}
                    id={`${field.id}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        );

      case FormFieldType.CHECKBOX:
        return (
          <FormControl>
            <Checkbox
              checked={!!fieldProps.value}
              onCheckedChange={(checked) => fieldProps.onChange(checked === true)}
              disabled={field.disabled || isSubmitting}
            />
          </FormControl>
        );

      default:
        return (
          <FormControl>
            <Input {...commonProps} {...fieldProps} />
          </FormControl>
        );
    }
  };

  /**
   * Render section with fields
   */
  const renderSection = (section: FormSectionSchema) => {
    return (
      <div key={section.id} className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">
              {section.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {section.fields.map((field) => {
            // Evaluate conditional rendering
            if (field.conditional) {
              const shouldRender = evaluateConditional(
                field.conditional,
                formValues
              );
              if (!shouldRender) return null;
            }

            // Determine grid class based on gridColumns
            const gridClass =
              field.gridColumns === 1
                ? 'md:col-span-3'
                : field.gridColumns === 2
                ? 'md:col-span-2'
                : 'md:col-span-1';

            return (
              <div key={field.id} className={cn(gridClass)}>
                {renderField(field)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        role="form"
        onSubmit={form.handleSubmit((data) => onSubmit(data as DynamicFormData))}
        className="space-y-6"
      >
        {schema.sections.map((section, index) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
            {index < schema.sections.length - 1 && <Separator />}
          </React.Fragment>
        ))}

        {/* Hidden submit button for accessibility */}
        <button
          type="submit"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          Submit
        </button>
      </form>
    </Form>
  );
}