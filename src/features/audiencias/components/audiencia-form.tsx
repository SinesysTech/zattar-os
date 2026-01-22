'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActionState, useEffect } from 'react';
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
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
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
import { useFormStatus } from 'react-dom';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ptBR } from 'date-fns/locale';
import { useTiposAudiencias } from '../hooks';
import { useUsuarios } from '@/features/usuarios';

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

// Schema com campos adicionais para o formulário (campos de UI)
// Omitimos dataInicio/dataFim do base pois eles são gerados no submit a partir dos campos Date/Time
const formSchema = baseAudienciaSchema.omit({ dataInicio: true, dataFim: true }).extend({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  dataInicioDate: z.date({ required_error: 'Data de início é obrigatória.' }),
  dataFimDate: z.date({ required_error: 'Data de fim é obrigatória.' }),
  horaInicioTime: z.string({ required_error: 'Hora de início é obrigatória.' }),
  horaFimTime: z.string({ required_error: 'Hora de fim é obrigatória.' }),
});

type FormValues = z.infer<typeof formSchema>;

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Salvando...' : isEditing ? 'Atualizar Audiência' : 'Criar Audiência'}
    </Button>
  );
}

export function AudienciaForm({ initialData, onSuccess, onClose }: AudienciaFormProps) {
  // Definir valor inicial correto para useActionState
  const initialState: ActionResult = { success: false, error: '', message: '' };

  const [state, formAction] = useActionState<ActionResult, FormData>(
    initialData ? actionAtualizarAudiencia.bind(null, initialData.id) : actionCriarAudiencia,
    initialState
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        processoId: initialData.processoId,
        dataInicio: initialData.dataInicio,
        dataFim: initialData.dataFim,
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
    // Ignore initial state
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      onSuccess?.(state.data as Audiencia);
      onClose?.();
    } else {
      toast.error(state.error || 'Erro ao salvar', { description: state.message });
      if (state.errors) {
        Object.entries(state.errors).forEach(([path, messages]) => {
          form.setError(path as string & keyof FormValues, {
            type: 'manual',
            message: messages.join(', '),
          });
        });
      }
    }
  }, [state, onSuccess, onClose, form]);

  const onSubmit = (values: FormValues) => {
    console.log('📝 [AudienciaForm] onSubmit triggered', values);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'dataInicioDate' || key === 'dataFimDate') {
          // Combine date and time
          const dateValue = value as Date;
          const timeKey = key === 'dataInicioDate' ? 'horaInicioTime' : 'horaFimTime';
          const timeValue = form.getValues(timeKey);
          if (timeValue) {
            const [hours, minutes] = timeValue.split(':').map(Number);
            dateValue.setHours(hours, minutes, 0, 0);
          }
          formData.append(key.replace('Date', ''), dateValue.toISOString());
        } else if (key === 'horaInicioTime' || key === 'horaFimTime') {
          // Skip, already handled by date combination
        } else if (typeof value === 'object' && value !== null) {
          // Handle complex objects like enderecoPresencial
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    console.log('🚀 [AudienciaForm] Calling formAction');
    formAction(formData);
  };

  const onInvalid = (errors: any) => {
    console.error('❌ [AudienciaForm] Validation Errors:', errors);
    toast.error('Erro de validação no formulário', {
      description: 'Verifique o console para mais detalhes.'
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <input type="hidden" {...form.register('processoId', { valueAsNumber: true })} />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dataInicioDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-left">Data de Início</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                  </FormControl>
                  <PopoverContent className="w-auto p-0">
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
                <FormLabel className="text-left">Hora de Início</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    value={field.value || '00:00'}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dataFimDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-left">Data de Fim</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                  </FormControl>
                  <PopoverContent className="w-auto p-0">
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
                <FormLabel className="text-left">Hora de Fim</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    value={field.value || '00:00'}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <FormField
          control={form.control}
          name="tipoAudienciaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Audiência</FormLabel>
              <Select onValueChange={value => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
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
            <FormItem className="space-y-3">
              <FormLabel>Modalidade</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={ModalidadeAudiencia.Virtual} />
                    </FormControl>
                    <FormLabel className="font-normal">Virtual</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={ModalidadeAudiencia.Presencial} />
                    </FormControl>
                    <FormLabel className="font-normal">Presencial</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={ModalidadeAudiencia.Hibrida} />
                    </FormControl>
                    <FormLabel className="font-normal">Híbrida</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(modalidade === ModalidadeAudiencia.Virtual || modalidade === ModalidadeAudiencia.Hibrida) && (
          <FormField
            control={form.control}
            name="urlAudienciaVirtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Audiência Virtual</FormLabel>
                <FormControl>
                  <Input placeholder="https://zoom.us/j/..." value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(modalidade === ModalidadeAudiencia.Presencial || modalidade === ModalidadeAudiencia.Hibrida) && (
          <>
            <FormLabel>Endereço Presencial</FormLabel>
            {/* These fields would ideally be a custom component for address */}
            <FormField
              control={form.control}
              name="enderecoPresencial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      value={(field.value as Record<string, string> | null | undefined)?.cep ?? ''}
                      onChange={(e) => field.onChange({ ...(field.value as Record<string, string> | null | undefined) ?? {}, cep: e.target.value })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add more enderecoPresencial fields as needed */}
          </>
        )}

        <FormField
          control={form.control}
          name="responsavelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <Select onValueChange={value => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
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

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Observações adicionais..." value={field.value ?? ''} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <SubmitButton isEditing={!!initialData} />
        </DialogFooter>
      </form>
    </Form>
  );
}
