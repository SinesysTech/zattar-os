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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Check, ChevronDown, Loader2, Search, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdvogados } from '@/app/_lib/hooks/use-advogados';

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
    meio: z.string().optional(),
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

// Helper para formatar data
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formulário de busca de comunicações CNJ
 */
export function ComunicaCNJSearchForm({ onSearch, isLoading }: ComunicaCNJSearchFormProps) {
  const [tribunais, setTribunais] = useState<TribunalCNJ[]>([]);
  const [loadingTribunais, setLoadingTribunais] = useState(true);
  const [tribunalSearchOpen, setTribunalSearchOpen] = useState(false);
  const [tribunalSearchTerm, setTribunalSearchTerm] = useState('');
  const [advogadoSearchOpen, setAdvogadoSearchOpen] = useState(false);
  const [selectedAdvogadoId, setSelectedAdvogadoId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>();
  const [selectedMeio, setSelectedMeio] = useState<string>('');

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

  // Buscar tribunais
  useEffect(() => {
    const fetchTribunais = async () => {
      try {
        const response = await fetch('/api/comunica-cnj/tribunais');
        const data = await response.json();
        if (data.success && data.data?.tribunais) {
          // Deduplicar tribunais por sigla
          const uniqueTribunais = data.data.tribunais.reduce((acc: TribunalCNJ[], tribunal: TribunalCNJ) => {
            if (!acc.find(t => t.sigla === tribunal.sigla)) {
              acc.push(tribunal);
            }
            return acc;
          }, []);
          setTribunais(uniqueTribunais);
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

  const onSubmit = async (data: SearchFormData) => {
    await onSearch({
      ...data,
      // Adicionar datas do range picker
      dataInicio: dateRange?.from ? formatDateToYYYYMMDD(dateRange.from) : undefined,
      dataFim: dateRange?.to ? formatDateToYYYYMMDD(dateRange.to) : undefined,
      // Adicionar meio (se não for vazio)
      meio: selectedMeio || undefined,
      // Adicionar OAB do advogado selecionado
      ...(selectedAdvogado && {
        numeroOab: selectedAdvogado.oab,
        ufOab: selectedAdvogado.uf_oab,
      }),
    });
  };

  const handleReset = () => {
    reset();
    setSelectedAdvogadoId(null);
    setDateRange(undefined);
    setSelectedMeio('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Tribunal - coluna dupla */}
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">Tribunal</Label>
          <Popover open={tribunalSearchOpen} onOpenChange={setTribunalSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={tribunalSearchOpen}
                className="w-full justify-between font-normal h-9 text-sm"
                disabled={loadingTribunais}
              >
                {loadingTribunais ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Carregando...
                  </span>
                ) : selectedTribunalData ? (
                  <span className="truncate text-left">
                    {selectedTribunalData.sigla} - {selectedTribunalData.nome}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar tribunal..."
                  value={tribunalSearchTerm}
                  onValueChange={setTribunalSearchTerm}
                  className="h-9"
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
                        className="py-1.5"
                      >
                        <Check
                          className={cn(
                            'mr-1.5 h-3 w-3 shrink-0',
                            selectedTribunal === tribunal.sigla ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="font-medium text-sm shrink-0">{tribunal.sigla}</span>
                        <span className="ml-1.5 text-muted-foreground text-sm truncate">
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
        <div className="space-y-1.5">
          <Label className="text-xs">Processo</Label>
          <Input
            {...register('numeroProcesso')}
            placeholder="0000000-00.0000.0.00.0000"
            className="h-9 text-sm"
          />
        </div>

        {/* Advogado (OAB) */}
        <div className="space-y-1.5">
          <Label className="text-xs">Advogado</Label>
          <Popover open={advogadoSearchOpen} onOpenChange={setAdvogadoSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={advogadoSearchOpen}
                className="w-full justify-between font-normal h-9 text-sm"
                disabled={loadingAdvogados}
              >
                {loadingAdvogados ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </span>
                ) : selectedAdvogado ? (
                  <span className="truncate text-left">
                    {selectedAdvogado.nome_completo.split(' ')[0]} - {selectedAdvogado.oab}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Selecione</span>
                )}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar advogado..." className="h-9" />
                <CommandList>
                  <CommandEmpty>Nenhum advogado encontrado</CommandEmpty>
                  <CommandGroup>
                    {advogados?.map((advogado) => (
                      <CommandItem
                        key={advogado.id}
                        value={`${advogado.nome_completo} ${advogado.oab} ${advogado.uf_oab}`}
                        onSelect={() => {
                          setSelectedAdvogadoId(advogado.id);
                          setAdvogadoSearchOpen(false);
                        }}
                        className="py-1.5"
                      >
                        <Check
                          className={cn(
                            'mr-1.5 h-3 w-3 shrink-0',
                            selectedAdvogadoId === advogado.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{advogado.nome_completo}</span>
                          <span className="text-xs text-muted-foreground">
                            OAB {advogado.oab}/{advogado.uf_oab}
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
        <div className="space-y-1.5">
          <Label className="text-xs">Parte</Label>
          <Input {...register('nomeParte')} placeholder="Nome" className="h-9 text-sm" />
        </div>

        {/* Busca Textual */}
        <div className="space-y-1.5">
          <Label className="text-xs">Texto</Label>
          <Input {...register('texto')} placeholder="Busca" className="h-9 text-sm" />
        </div>

        {/* Período */}
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">Período</Label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Selecione o período"
          />
        </div>

        {/* Meio */}
        <div className="space-y-1.5">
          <Label className="text-xs">Meio</Label>
          <Select
            value={selectedMeio}
            onValueChange={setSelectedMeio}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="E">Edital</SelectItem>
              <SelectItem value="D">Diário Eletrônico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botões */}
        <div className="space-y-1.5 col-span-2 md:col-span-3 flex items-end gap-2">
          <Button type="submit" disabled={isLoading} className="h-9">
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-1.5 h-3 w-3" />
                Buscar
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="h-9">
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Erro de validação */}
      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}
    </form>
  );
}
