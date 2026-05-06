'use client';

import { useForm, useWatch, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActionState, useEffect, startTransition } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Audiencia } from '../domain';
import { ModalidadeAudiencia } from '../domain';
import { actionCriarAudiencia, actionAtualizarAudiencia, type ActionResult } from '../actions';
import { toast } from 'sonner';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { useTiposAudiencias } from '../hooks';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

interface AudienciaFormProps {
  initialData?: Audiencia;
  onSuccess?: (audiencia: Audiencia) => void;
  onClose?: () => void;
}

// Schema base sem validação refinada
const baseAudienciaSchema = z.object({
  processoId: z.number({ required_error: 'Processo é obrigatório.' }),
  dataInicio: z.string({ required_error: 'Data de início é obrigatória.' }).datetime('Formato de data inválido.'),
  dataFim: z.string({ required_error: 'Data de fim é obrigatória.' }).datetime('Formato de data inválido.'),
  tipoAudienciaId: z.number().optional().nullable(),
  modalidade: z.nativeEnum(ModalidadeAudiencia).optional().nullable(),
  urlAudienciaVirtual: z.string().url('URL inválida.').optional().nullable(),
  enderecoPresencial: z.record(z.unknown()).optional().nullable(),
  responsavelId: z.number().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  salaAudienciaNome: z.string().optional().nullable(),
});

const formSchema = baseAudienciaSchema
  .omit({ dataInicio: true, dataFim: true })
  .extend({
    dataInicioDate: z.date({ required_error: 'Data de início é obrigatória.' }),
    horaInicioTime: z.string({ required_error: 'Hora de início é obrigatória.' }),
    dataFimDate: z.date({ required_error: 'Data de fim é obrigatória.' }),
    horaFimTime: z.string({ required_error: 'Hora de fim é obrigatória.' }),
    processoId: z.coerce.number({ required_error: 'Processo é obrigatório.' }),
    tipoAudienciaId: z.coerce.number().optional().nullable(),
    responsavelId: z.coerce.number().optional().nullable(),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.dataInicioDate);
      const [hI, mI] = data.horaInicioTime.split(':').map(Number);
      inicio.setHours(hI, mI, 0, 0);

      const fim = new Date(data.dataFimDate);
      const [hF, mF] = data.horaFimTime.split(':').map(Number);
      fim.setHours(hF, mF, 0, 0);

      return fim > inicio;
    },
    {
      message: 'A data de fim deve ser posterior à data de início.',
      path: ['dataFimDate'],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function AudienciaForm({ initialData, onSuccess, onClose }: AudienciaFormProps) {
  const initialState: ActionResult = { success: false, error: '', message: '' };

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    initialData ? actionAtualizarAudiencia.bind(null, initialData.id) : actionCriarAudiencia,
    initialState
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        processoId: initialData.processoId,
        tipoAudienciaId: initialData.tipoAudienciaId,
        modalidade: initialData.modalidade,
        urlAudienciaVirtual: initialData.urlAudienciaVirtual,
        responsavelId: initialData.responsavelId,
        observacoes: initialData.observacoes,
        salaAudienciaNome: initialData.salaAudienciaNome,
        dataInicioDate: new Date(initialData.dataInicio),
        dataFimDate: new Date(initialData.dataFim),
        horaInicioTime: format(new Date(initialData.dataInicio), 'HH:mm'),
        horaFimTime: format(new Date(initialData.dataFim), 'HH:mm'),
      }
      : {
        modalidade: ModalidadeAudiencia.Virtual,
      },
  });

  const { tiposAudiencia } = useTiposAudiencias();
  const { usuarios } = useUsuarios();

  const modalidade = useWatch({ control: form.control, name: 'modalidade' });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      onSuccess?.(state.data as Audiencia);
      onClose?.();
    } else {
      toast.error(state.error || 'Erro ao salvar', { description: state.message });
      if (state.errors) {
        Object.entries(state.errors).forEach(([path, messages]) => {
          form.setError(path as Path<FormValues>, {
            type: 'manual',
            message: (messages as string[]).join(', '),
          });
        });
      }
    }
  }, [state, onSuccess, onClose, form]);

  const onSubmit = (values: FormValues) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        // Skip processoId on update - it's already bound to the audiencia
        if (key === 'processoId' && initialData) {
          return;
        }
        if (value !== undefined && value !== null) {
          if (key === 'dataInicioDate' || key === 'dataFimDate') {
            // Combine date and time
            const dateValue = new Date(value as Date);
            const timeKey = key === 'dataInicioDate' ? 'horaInicioTime' : 'horaFimTime';
            const timeValue = form.getValues(timeKey) as string | undefined;
            if (timeValue) {
              const [hours, minutes] = timeValue.split(':').map(Number);
              dateValue.setHours(hours, minutes, 0, 0);
            }
            formData.append(key.replace('Date', ''), dateValue.toISOString());
          } else if (key === 'horaInicioTime' || key === 'horaFimTime') {
            // Skip, already handled by date combination
          } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
            // Handle complex objects like enderecoPresencial
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      startTransition(() => {
        formAction(formData);
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error('Erro ao processar o formulário. Verifique os dados e tente novamente.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className={cn("flex flex-col flex-1 stack-default")}>
          {/* Datas e Horários - Grid 4 colunas em telas grandes */}
          <div className={cn("grid grid-cols-2 lg:grid-cols-4 inline-medium")}>
            <FormField
              control={form.control}
              name="dataInicioDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={cn("text-left text-body-sm")}>Data de Início</FormLabel>
                  <Popover>
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-9',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            <Text variant="caption" as="span">Escolha uma data</Text>
                          )}
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto inset-none")}>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horaInicioTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={cn("text-left text-body-sm")}>Hora de Início</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="h-9"
                      value={field.value || '00:00'}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataFimDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={cn("text-left text-body-sm")}>Data de Fim</FormLabel>
                  <Popover>
                    <FormControl>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-9',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            <Text variant="caption" as="span">Escolha uma data</Text>
                          )}
                        </Button>
                      </PopoverTrigger>
                    </FormControl>
                    <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto inset-none")}>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horaFimTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={cn("text-left text-body-sm")}>Hora de Fim</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      className="h-9"
                      value={field.value || '00:00'}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo e Modalidade - Grid 2 colunas */}
          <div className={cn("grid grid-cols-1 lg:grid-cols-2 inline-default")}>
            <FormField
              control={form.control}
              name="tipoAudienciaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn("text-body-sm")}>Tipo de Audiência</FormLabel>
                  <Select onValueChange={value => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione o tipo de audiência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposAudiencia.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.descricao}
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
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn("text-body-sm")}>Modalidade</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                      className={cn("flex flex-row inline-default pt-1")}
                    >
                      <FormItem className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2 stack-none")}>
                        <FormControl>
                          <RadioGroupItem value={ModalidadeAudiencia.Virtual} />
                        </FormControl>
                        <FormLabel className={cn("font-normal text-body-sm")}>Virtual</FormLabel>
                      </FormItem>
                      <FormItem className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2 stack-none")}>
                        <FormControl>
                          <RadioGroupItem value={ModalidadeAudiencia.Presencial} />
                        </FormControl>
                        <FormLabel className={cn("font-normal text-body-sm")}>Presencial</FormLabel>
                      </FormItem>
                      <FormItem className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2 stack-none")}>
                        <FormControl>
                          <RadioGroupItem value={ModalidadeAudiencia.Hibrida} />
                        </FormControl>
                        <FormLabel className={cn("font-normal text-body-sm")}>Híbrida</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          {/* Campos condicionais baseados na modalidade */}
          {(modalidade === ModalidadeAudiencia.Virtual || modalidade === ModalidadeAudiencia.Hibrida) && (
            <FormField
              control={form.control}
              name="urlAudienciaVirtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn("text-body-sm")}>URL da Audiência Virtual</FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      placeholder="https://zoom.us/j/..."
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(modalidade === ModalidadeAudiencia.Presencial || modalidade === ModalidadeAudiencia.Hibrida) && (
            <FormField
              control={form.control}
              name="enderecoPresencial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn("text-body-sm")}>CEP do Endereço Presencial</FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      placeholder="00000-000"
                      value={(field.value as Record<string, string> | null | undefined)?.cep ?? ''}
                      onChange={(e) => field.onChange({ ...(field.value as Record<string, string> | null | undefined) ?? {}, cep: e.target.value })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Responsável */}
          <FormField
            control={form.control}
            name="responsavelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn("text-body-sm")}>Responsável</FormLabel>
                <Select onValueChange={value => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nomeExibicao || usuario.nomeCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Observações */}
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn("text-body-sm")}>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-20 resize-none"
                    placeholder="Observações adicionais..."
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Footer fixo na parte inferior do dialog */}
        <div className={cn("flex justify-end inline-medium pt-4 mt-4 border-t")}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {initialData ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              initialData ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
