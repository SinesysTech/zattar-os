'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Check, ChevronDown, Loader2, Search, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdvogados } from '@/app/_lib/hooks/use-advogados';
import type { MeioComunicacao } from '@/backend/comunica-cnj/types/types';

// Schema de validação
const searchSchema = z
  .object({
    siglaTribunal: z.string().optional(),
    texto: z.string().optional(),
    nomeParte: z.string().optional(),
    numeroOab: z.string().optional(),
    ufOab: z.string().optional(),
    numeroProcesso: z.string().optional(),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    meio: z.enum(['E', 'D']).optional(),
    itensPorPagina: z.number().optional(),
  })
  .refine(
    (data) => {
      const hasFilter =
        data.siglaTribunal ||
        data.texto ||
        data.nomeParte ||
        data.numeroOab ||
        data.numeroProcesso ||
        data.dataInicio;
      return hasFilter;
    },
    { message: 'Pelo menos um filtro deve ser preenchido', path: ['root'] }
  );

type SearchFormData = z.infer<typeof searchSchema>;

interface TribunalCNJ {
  id: string;
  sigla: string;
  nome: string;
  jurisdicao: string;
}

interface ComunicaCNJSearchFormProps {
  onSearch: (filters: Record<string, unknown>) => Promise<void>;
  isLoading: boolean;
}

/**
 * Formulário de busca de comunicações CNJ
 */
export function ComunicaCNJSearchForm({ onSearch, isLoading }: ComunicaCNJSearchFormProps) {
  const [tribunais, setTribunais] = useState<TribunalCNJ[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(true);
  const [tribunalSearchOpen, setTribunalSearchOpen] = useState(false);
  const [tribunalSearchTerm, setTribunalSearchTerm] = useState('');
  const [advogadoSearchOpen, setAdvogadoSearchOpen] = useState(false);
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<string | null>(null);

  const { advogados, isLoading: loadingAdvogados } = useAdvogados();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      itensPorPagina: 100,
    },
  });

  const selectedTribunal = watch('siglaTribunal');
  const dataInicio = watch('dataInicio');
  const dataFim = watch('dataFim');

  // Buscar tribunais
  useEffect(() => {
    const fetchTribunais = async () => {
      try {
        const response = await fetch('/api/comunica-cnj/tribunais');
        const data = await response.json();
        if (data.success) {
          setTribunais(data.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar tribunais:', error);
      } finally {
        setLoadingTribunais(false);
      }
    };
    fetchTribunais();
  }, []);

  // Filtrar tribunais por busca
  const filteredTribunais = useMemo(() => {
    if (!tribunalSearchTerm) return tribunais;
    const searchLower = tribunalSearchTerm.toLowerCase();
    return tribunais.filter(
      (t) =>
        t.sigla.toLowerCase().includes(searchLower) ||
        t.nome.toLowerCase().includes(searchLower)
    );
  }, [tribunais, tribunalSearchTerm]);

  // Encontrar tribunal selecionado
  const selectedTribunalData = tribunais.find((t) => t.sigla === selectedTribunal);

  // Encontrar advogado selecionado
  const selectedAdvogado = advogados?.find((a) => a.id === selectedAdvogadoId);

  // Formatar data para YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse data de YYYY-MM-DD para Date
  const parseYYYYMMDD = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const onSubmit = async (data: SearchFormData) => {
    await onSearch({
      ...data,
      // Adicionar OAB do advogado selecionado
      ...(selectedAdvogado && {
        numeroOab: selectedAdvogado.oab_numero,
        ufOab: selectedAdvogado.oab_uf,
      }),
    });
  };

  const handleReset = () => {
    reset();
    setSelectedAdvogadoId(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tribunal */}
        <div className="space-y-2">
          <Label htmlFor="siglaTribunal">Tribunal</Label>
          <Popover open={tribunalSearchOpen} onOpenChange={setTribunalSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tribunalSearchOpen}
                className="w-full justify-between font-normal"
                disabled={loadingTribunais}
              >
                {loadingTribunais ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </span>
                ) : selectedTribunalData ? (
                  <span className="truncate">
                    {selectedTribunalData.sigla} - {selectedTribunalData.nome}
                  </span>
                ) : (
                  'Selecione um tribunal'
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar tribunal..."
                  value={tribunalSearchTerm}
                  onValueChange={setTribunalSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>Nenhum tribunal encontrado</CommandEmpty>
                  <CommandGroup>
                    {filteredTribunais.map((tribunal) => (
                      <CommandItem
                        key={tribunal.sigla}
                        value={`${tribunal.sigla} ${tribunal.nome}`}
                        onSelect={() => {
                          setValue('siglaTribunal', tribunal.sigla);
                          setTribunalSearchOpen(false);
                          setTribunalSearchTerm('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedTribunal === tribunal.sigla ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-medium">{tribunal.sigla}</span>
                        <span className="ml-2 text-muted-foreground truncate">
                          {tribunal.nome}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Número do Processo */}
        <div className="space-y-2">
          <Label htmlFor="numeroProcesso">Número do Processo</Label>
          <Input
            {...register('numeroProcesso')}
            placeholder="0000000-00.0000.0.00.0000"
          />
        </div>

        {/* Advogado (OAB) */}
        <div className="space-y-2">
          <Label>Advogado (OAB)</Label>
          <Popover open={advogadoSearchOpen} onOpenChange={setAdvogadoSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={advogadoSearchOpen}
                className="w-full justify-between font-normal"
                disabled={loadingAdvogados}
              >
                {loadingAdvogados ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </span>
                ) : selectedAdvogado ? (
                  <span className="truncate">
                    {selectedAdvogado.nome} - OAB {selectedAdvogado.oab_numero}/{selectedAdvogado.oab_uf}
                  </span>
                ) : (
                  'Selecione um advogado'
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar advogado..." />
                <CommandList>
                  <CommandEmpty>Nenhum advogado encontrado</CommandEmpty>
                  <CommandGroup>
                    {advogados?.map((advogado) => (
                      <CommandItem
                        key={advogado.id}
                        value={`${advogado.nome} ${advogado.oab_numero} ${advogado.oab_uf}`}
                        onSelect={() => {
                          setSelectedAdvogadoId(advogado.id);
                          setAdvogadoSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedAdvogadoId === advogado.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{advogado.nome}</span>
                          <span className="text-sm text-muted-foreground">
                            OAB {advogado.oab_numero}/{advogado.oab_uf}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Nome da Parte */}
        <div className="space-y-2">
          <Label htmlFor="nomeParte">Nome da Parte</Label>
          <Input {...register('nomeParte')} placeholder="Nome da parte" />
        </div>

        {/* Busca Textual */}
        <div className="space-y-2">
          <Label htmlFor="texto">Busca Textual</Label>
          <Input {...register('texto')} placeholder="Texto na comunicação" />
        </div>

        {/* Data Início */}
        <div className="space-y-2">
          <Label>Data Início</Label>
          <FormDatePicker
            value={dataInicio ? parseYYYYMMDD(dataInicio) : undefined}
            onChange={(date) => {
              setValue('dataInicio', date ? formatDateToYYYYMMDD(date) : undefined);
            }}
            placeholder="Selecione a data"
          />
        </div>

        {/* Data Fim */}
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <FormDatePicker
            value={dataFim ? parseYYYYMMDD(dataFim) : undefined}
            onChange={(date) => {
              setValue('dataFim', date ? formatDateToYYYYMMDD(date) : undefined);
            }}
            placeholder="Selecione a data"
          />
        </div>

        {/* Meio */}
        <div className="space-y-2">
          <Label htmlFor="meio">Meio de Comunicação</Label>
          <Select
            onValueChange={(value) => setValue('meio', value as MeioComunicacao)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="E">Edital</SelectItem>
              <SelectItem value="D">Diário Eletrônico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Erro de validação */}
      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpar
        </Button>
      </div>
    </form>
  );
}
