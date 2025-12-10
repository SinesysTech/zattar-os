'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

const processoFormSchema = z.object({
  numero_processo: z.string().min(1, 'Número do processo é obrigatório.'),
  classe_judicial: z.string().min(1, 'Classe judicial é obrigatória.'),
  trt: z.string().min(1, 'TRT é obrigatório.'),
  grau: z.string().min(1, 'Grau é obrigatório.'),
  parte_autora: z.string().min(1, 'Parte autora é obrigatória.'),
  parte_re: z.string().min(1, 'Parte ré é obrigatória.'),
  orgao_julgador: z.string().min(1, 'Órgão julgador é obrigatório.'),
  vara: z.string().optional(),
  comarca: z.string().optional(),
  valor_causa: z.number().positive('O valor da causa deve ser positivo.').optional(),
  honorarios: z.number().positive('Os honorários devem ser positivos.').optional(),
  observacoes: z.string().optional(),
});

type ProcessoFormValues = z.infer<typeof processoFormSchema>;

interface ProcessoFormProps {
  onCancel: () => void;
  onSubmit: (data: ProcessoFormValues) => void;
  defaultValues?: Partial<ProcessoFormValues>;
  isLoading?: boolean;
}

export function ProcessoForm({ onCancel, onSubmit, defaultValues, isLoading }: ProcessoFormProps) {
  const form = useForm<ProcessoFormValues>({
    resolver: zodResolver(processoFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Seção 1 - Dados Básicos */}
          <div>
            <h3 className="text-lg font-medium font-heading">Dados Básicos</h3>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_processo"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="classe_judicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe Judicial</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ação Trabalhista - Rito Ordinário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TRT</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o TRT" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TRT1">TRT1</SelectItem>
                        <SelectItem value="TRT2">TRT2</SelectItem>
                        <SelectItem value="TRT3">TRT3</SelectItem>
                        <SelectItem value="TRT4">TRT4</SelectItem>
                        <SelectItem value="TRT5">TRT5</SelectItem>
                        <SelectItem value="TRT6">TRT6</SelectItem>
                        <SelectItem value="TRT7">TRT7</SelectItem>
                        <SelectItem value="TRT8">TRT8</SelectItem>
                        <SelectItem value="TRT9">TRT9</SelectItem>
                        <SelectItem value="TRT10">TRT10</SelectItem>
                        <SelectItem value="TRT11">TRT11</SelectItem>
                        <SelectItem value="TRT12">TRT12</SelectItem>
                        <SelectItem value="TRT13">TRT13</SelectItem>
                        <SelectItem value="TRT14">TRT14</SelectItem>
                        <SelectItem value="TRT15">TRT15</SelectItem>
                        <SelectItem value="TRT16">TRT16</SelectItem>
                        <SelectItem value="TRT17">TRT17</SelectItem>
                        <SelectItem value="TRT18">TRT18</SelectItem>
                        <SelectItem value="TRT19">TRT19</SelectItem>
                        <SelectItem value="TRT20">TRT20</SelectItem>
                        <SelectItem value="TRT21">TRT21</SelectItem>
                        <SelectItem value="TRT22">TRT22</SelectItem>
                        <SelectItem value="TRT23">TRT23</SelectItem>
                        <SelectItem value="TRT24">TRT24</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grau</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primeiro_grau">1º Grau</SelectItem>
                        <SelectItem value="segundo_grau">2º Grau</SelectItem>
                        <SelectItem value="tribunal_superior">Tribunal Superior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 2 - Partes Envolvidas */}
          <div>
            <h3 className="text-lg font-medium font-heading">Partes Envolvidas</h3>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parte_autora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parte Autora (Cliente)</FormLabel>
                    <FormControl>
                      <Input placeholder="Buscar cliente..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parte_re"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parte Ré</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da parte ré" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 3 - Tribunal */}
          <div>
            <h3 className="text-lg font-medium font-heading">Tribunal</h3>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orgao_julgador"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Órgão Julgador</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1ª Vara do Trabalho de..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vara"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vara</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1ª Vara do Trabalho" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comarca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comarca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 4 - Valores */}
          <div>
            <h3 className="text-lg font-medium font-heading">Valores</h3>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_causa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Causa</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="honorarios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honorários Contratuais</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhes adicionais sobre o processo..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
