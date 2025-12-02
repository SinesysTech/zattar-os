"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { FormFieldSchema, FormFieldType, fieldRequiresOptions } from '@/types/formsign/form-schema.types';
import { ChevronDown, Trash2, Plus, Info, Save, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const fieldPropertiesSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  name: z.string().min(1, 'Name é obrigatório'),
  label: z.string().min(1, 'Label é obrigatório'),
  type: z.nativeEnum(FormFieldType),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  gridColumns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  customValidator: z.string().optional(),
  validationMessage: z.string().optional(),
  conditionalField: z.string().optional(),
  conditionalOperator: z.enum(['=', '!=', '>', '<', 'contains', 'empty', 'notEmpty']).optional(),
  conditionalValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

type FormValues = z.infer<typeof fieldPropertiesSchema>;

interface FieldPropertiesPanelProps {
  field: FormFieldSchema | null;
  allFieldIds: string[];
  allFieldNames: string[];
  onChange: (field: FormFieldSchema) => void;
  onDelete: () => void;
}

const CUSTOM_VALIDATORS = [
  { value: 'validateCPF', label: 'Validar CPF' },
  { value: 'validateCNPJ', label: 'Validar CNPJ' },
  { value: 'validateTelefone', label: 'Validar Telefone' },
  { value: 'validateCEP', label: 'Validar CEP' },
  { value: 'validateDateNotFuture', label: 'Data não pode ser futura' },
];

export default function FieldPropertiesPanel({
  field,
  allFieldIds,
  allFieldNames,
  onChange,
  onDelete
}: FieldPropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basico']));
  const [options, setOptions] = useState<Array<{ label: string; value: string | number; disabled?: boolean }>>(
    field?.options || []
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(fieldPropertiesSchema),
    mode: 'onChange',
    defaultValues: field ? {
      id: field.id,
      name: field.name,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder ?? '',
      helpText: field.helpText ?? '',
      gridColumns: field.gridColumns ?? 1,
      defaultValue: field.defaultValue ?? '',
      required: field.validation?.required ?? false,
      min: field.validation?.min ?? undefined,
      max: field.validation?.max ?? undefined,
      pattern: field.validation?.pattern ?? '',
      customValidator: field.validation?.custom ?? '',
      validationMessage: field.validation?.message ?? '',
      conditionalField: field.conditional?.field ?? '',
      conditionalOperator: field.conditional?.operator ?? '=',
      conditionalValue: field.conditional?.value ?? '',
    } : {
      id: '',
      name: '',
      label: '',
      type: FormFieldType.TEXT,
      placeholder: '',
      helpText: '',
      gridColumns: 1,
      defaultValue: '',
      required: false,
      min: undefined,
      max: undefined,
      pattern: '',
      customValidator: '',
      validationMessage: '',
      conditionalField: '',
      conditionalOperator: '=',
      conditionalValue: '',
    }
  });

  useEffect(() => {
    if (field) {
      form.reset({
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder ?? '',
        helpText: field.helpText ?? '',
        gridColumns: field.gridColumns ?? 1,
        defaultValue: field.defaultValue ?? '',
        required: field.validation?.required ?? false,
        min: field.validation?.min ?? undefined,
        max: field.validation?.max ?? undefined,
        pattern: field.validation?.pattern ?? '',
        customValidator: field.validation?.custom ?? '',
        validationMessage: field.validation?.message ?? '',
        conditionalField: field.conditional?.field ?? '',
        conditionalOperator: field.conditional?.operator ?? '=',
        conditionalValue: field.conditional?.value ?? '',
      });
      setOptions(field.options || []);
    }
  }, [field, form]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleApply = (values: FormValues) => {
    if (!field) return;

    // Validation 1: ID is readonly, so always use the original field.id
    values.id = field.id;

    // Validation 2: Check for duplicate Name
    if (values.name !== field.name && allFieldNames.includes(values.name)) {
      form.setError('name', { message: 'Name já está em uso por outro campo' });
      return;
    }

    // Validation 3: Check if options are required but missing
    if (fieldRequiresOptions(values.type) && options.length === 0) {
      toast.error('Campos SELECT e RADIO precisam de ao menos uma opção');
      return;
    }

    // Validation 4: Check min <= max
    if (values.min !== undefined && values.max !== undefined && values.min > values.max) {
      form.setError('min', { message: 'Mínimo deve ser menor ou igual ao máximo' });
      form.setError('max', { message: 'Máximo deve ser maior ou igual ao mínimo' });
      return;
    }

    const updatedField: FormFieldSchema = {
      ...field,
      id: values.id,
      name: values.name,
      label: values.label,
      type: values.type,
      placeholder: values.placeholder,
      helpText: values.helpText,
      gridColumns: values.gridColumns,
      defaultValue: values.defaultValue,
      validation: {
        required: values.required,
        min: values.min,
        max: values.max,
        pattern: values.pattern,
        custom: values.customValidator,
        message: values.validationMessage,
      },
      conditional: values.conditionalField ? {
        field: values.conditionalField,
        operator: values.conditionalOperator || '=',
        value: values.conditionalValue,
      } : undefined,
      options: fieldRequiresOptions(values.type) ? options : undefined,
    };

    onChange(updatedField);
  };

  const addOption = () => {
    setOptions([...options, { label: '', value: '' }]);
  };

  const updateOption = (index: number, key: 'label' | 'value' | 'disabled', value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [key]: value };
    setOptions(newOptions);
  };

  const deleteOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const moveOptionUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setOptions(newOptions);
  };

  const moveOptionDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
  };

  if (!field) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center space-y-2 py-12">
          <Info className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">Nenhum campo selecionado</p>
          <p className="text-xs text-muted-foreground">
            Selecione um campo no canvas para editar suas propriedades
          </p>
        </CardContent>
      </Card>
    );
  }

  const fieldType = form.watch('type');
  const showMinMax = [FormFieldType.TEXT, FormFieldType.TEXTAREA, FormFieldType.EMAIL, FormFieldType.NUMBER].includes(fieldType);
  const showPattern = [FormFieldType.TEXT, FormFieldType.EMAIL, FormFieldType.TEXTAREA].includes(fieldType);
  const showOptions = fieldRequiresOptions(fieldType);
  const availableFields = allFieldIds.filter(id => id !== field.id);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Propriedades do Campo</CardTitle>
        <CardDescription className="text-xs">{field.label}</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleApply)} className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto space-y-3">
            {/* Seção Básico */}
            <Collapsible
              open={expandedSections.has('basico')}
              onOpenChange={() => toggleSection('basico')}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                <span className="text-sm font-semibold flex-1 text-left">Básico</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSections.has('basico') && "transform rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do campo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id"
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>ID (somente leitura)</FormLabel>
                      <FormControl>
                        <Input {...formField} placeholder="campo_id" readOnly className="bg-muted" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Identificador único gerado automaticamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...formField} placeholder="campo_nome" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Nome do campo usado na submissão do formulário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placeholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placeholder</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite aqui..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="helpText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto de Ajuda</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gridColumns"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largura do Campo</FormLabel>
                      <Select
                        value={String(field.value || 1)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Largura Total (1 coluna)</SelectItem>
                          <SelectItem value="2">Metade (2 colunas)</SelectItem>
                          <SelectItem value="3">Um Terço (3 colunas)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultValue"
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>Valor Padrão</FormLabel>
                      <FormControl>
                        {fieldType === FormFieldType.NUMBER ? (
                          <Input
                            type="number"
                            {...formField}
                            value={String(formField.value ?? '')}
                            onChange={e => formField.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Valor padrão"
                          />
                        ) : fieldType === FormFieldType.DATE ? (
                          <Input
                            type="date"
                            {...formField}
                            value={String(formField.value ?? '')}
                            onChange={e => formField.onChange(e.target.value || undefined)}
                          />
                        ) : fieldType === FormFieldType.CHECKBOX ? (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={Boolean(formField.value)}
                              onCheckedChange={(checked) => formField.onChange(checked)}
                            />
                            <Label className="text-sm font-normal">Marcado por padrão</Label>
                          </div>
                        ) : (fieldType === FormFieldType.SELECT || fieldType === FormFieldType.RADIO) && options.length > 0 ? (
                          <Select
                            value={String(formField.value ?? '__none__')}
                            onValueChange={(value) => formField.onChange(value === '__none__' ? '' : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um valor padrão..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Nenhum</SelectItem>
                              {options.map((opt, idx) => (
                                <SelectItem key={idx} value={String(opt.value)}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...formField}
                            value={String(formField.value ?? '')}
                            onChange={e => formField.onChange(e.target.value || undefined)}
                            placeholder="Valor padrão"
                          />
                        )}
                      </FormControl>
                      <FormDescription className="text-xs">
                        Valor inicial do campo ao carregar o formulário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Seção Validação */}
            <Collapsible
              open={expandedSections.has('validacao')}
              onOpenChange={() => toggleSection('validacao')}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                <span className="text-sm font-semibold flex-1 text-left">Validação</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSections.has('validacao') && "transform rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-3">
                <FormField
                  control={form.control}
                  name="required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Campo Obrigatório</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {showMinMax && (
                  <>
                    <FormField
                      control={form.control}
                      name="min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mínimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              placeholder={fieldType === FormFieldType.NUMBER ? "Valor mínimo" : "Comprimento mínimo"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              placeholder={fieldType === FormFieldType.NUMBER ? "Valor máximo" : "Comprimento máximo"}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {showPattern && (
                  <FormField
                    control={form.control}
                    name="pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Padrão (Regex)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="^[A-Za-z]+$" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Expressão regular para validação
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="customValidator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validador Customizado</FormLabel>
                      <Select
                        value={field.value || '__none__'}
                        onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Nenhum</SelectItem>
                          {CUSTOM_VALIDATORS.map(validator => (
                            <SelectItem key={validator.value} value={validator.value}>
                              {validator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validationMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem de Erro</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mensagem customizada" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {availableFields.length > 0 && (
              <>
                <Separator />

                {/* Seção Condicional */}
                <Collapsible
                  open={expandedSections.has('condicional')}
                  onOpenChange={() => toggleSection('condicional')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-semibold flex-1 text-left">Condicional</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedSections.has('condicional') && "transform rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-3">
                    <FormField
                      control={form.control}
                      name="conditionalField"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campo de Controle</FormLabel>
                          <Select
                            value={field.value || '__none__'}
                            onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um campo..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">Nenhum</SelectItem>
                              {availableFields.map(fieldId => (
                                <SelectItem key={fieldId} value={fieldId}>
                                  {fieldId}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Campo que controla a visibilidade deste campo
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('conditionalField') && (
                      <>
                        <FormField
                          control={form.control}
                          name="conditionalOperator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operador</FormLabel>
                              <Select value={field.value || '='} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="=">Igual (=)</SelectItem>
                                  <SelectItem value="!=">Diferente (!=)</SelectItem>
                                  <SelectItem value=">">Maior (&gt;)</SelectItem>
                                  <SelectItem value="<">Menor (&lt;)</SelectItem>
                                  <SelectItem value="contains">Contém</SelectItem>
                                  <SelectItem value="empty">Vazio</SelectItem>
                                  <SelectItem value="notEmpty">Não Vazio</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {!['empty', 'notEmpty'].includes(form.watch('conditionalOperator') || '=') && (
                          <FormField
                            control={form.control}
                            name="conditionalValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={String(field.value ?? '')}
                                    onChange={e => field.onChange(e.target.value)}
                                    placeholder="Valor para comparação"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}

            {showOptions && (
              <>
                <Separator />

                {/* Seção Opções */}
                <Collapsible
                  open={expandedSections.has('opcoes')}
                  onOpenChange={() => toggleSection('opcoes')}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-semibold flex-1 text-left">
                      Opções {options.length > 0 && `(${options.length})`}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedSections.has('opcoes') && "transform rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 border rounded-lg">
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => moveOptionUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6"
                            aria-label="Mover para cima"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => moveOptionDown(index)}
                            disabled={index === options.length - 1}
                            className="h-6 w-6"
                            aria-label="Mover para baixo"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={option.label}
                            onChange={e => updateOption(index, 'label', e.target.value)}
                            placeholder="Label"
                            className="h-8"
                          />
                          <Input
                            value={String(option.value)}
                            onChange={e => updateOption(index, 'value', e.target.value)}
                            placeholder="Valor"
                            className="h-8"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={option.disabled || false}
                              onCheckedChange={checked => updateOption(index, 'disabled', checked as boolean)}
                            />
                            <Label className="text-xs">Desabilitado</Label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteOption(index)}
                          className="text-red-600 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Opção
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </CardContent>

          <CardFooter className="border-t pt-4 flex gap-2">
            <Button
              type="submit"
              size="sm"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}