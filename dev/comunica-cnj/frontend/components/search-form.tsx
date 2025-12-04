'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../../components/ui/command';
import { useComunicaCNJStore } from '../lib/stores/comunica-cnj-store';
import { listAdvogadosAction } from '../../../../app/actions/pje';
import type { AdvogadoWithCredenciais } from '../../../../lib/types/credentials';
import { DateRangePicker } from '../../../../components/ui/date-range-picker';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
const searchSchema = z.object({
  siglaTribunal: z.string().optional(),
  texto: z.string().optional(),
  nomeParte: z.string().optional(),
  modoAdvogado: z.enum(['cadastrado', 'manual']).optional(),
  advogadoId: z.string().uuid().optional(),
  nomeAdvogado: z.string().optional(),
  numeroOab: z.string().optional(),
  ufOab: z.string().optional(),
  numeroProcesso: z.string().optional(),
  numeroComunicacao: z.union([z.number().int().positive(), z.string(), z.undefined()]).optional(),
  orgaoId: z.number().int().positive().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  meio: z.enum(['E', 'D']).optional(),
}).refine((data) => {
  const hasFilter = data.siglaTribunal || data.texto || data.nomeParte || data.advogadoId || data.nomeAdvogado || data.numeroOab || data.numeroProcesso || data.orgaoId || data.dataInicio || data.dataFim || data.meio;
  return hasFilter;
}, { message: 'Pelo menos um filtro deve ser preenchido', path: ['root'] });
type SearchFormData = z.infer<typeof searchSchema>;
interface ComunicaCNJSearchFormProps { tribunaisCNJ: Array<{ sigla: string; nome: string }>; }
export function ComunicaCNJSearchForm({ tribunaisCNJ }: ComunicaCNJSearchFormProps) {
  const { fetchComunicacoes, isLoading } = useComunicaCNJStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<SearchFormData>({ resolver: zodResolver(searchSchema) });
  register('numeroOab');
  register('ufOab');
  const [isMounted, setIsMounted] = useState(false);
  const modoAdvogado = watch('modoAdvogado');
  const [advogados, setAdvogados] = useState<AdvogadoWithCredenciais[]>([]);
  const [loadingAdvogados, setLoadingAdvogados] = useState(false);
  const [tribunalSearchOpen, setTribunalSearchOpen] = useState(false);
  const [tribunalSearchTerm, setTribunalSearchTerm] = useState('');
  const [orgaoSearchOpen, setOrgaoSearchOpen] = useState(false);
  const [orgaoSearchTerm, setOrgaoSearchTerm] = useState('');
  const [advogadoDialogOpen, setAdvogadoDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const selectedTribunal = watch('siglaTribunal');
  const selectedAdvogadoId = watch('advogadoId');
  const nomeAdvogado = watch('nomeAdvogado');
  const numeroOab = watch('numeroOab');
  const ufOab = watch('ufOab');
  const selectedOrgaoId = watch('orgaoId');
  const [orgaos, setOrgaos] = useState<Array<{ id: string; orgaoIdCNJ: number; nome: string; tipo: string | null }>>([]);
  const [loadingOrgaos, setLoadingOrgaos] = useState(false);
  useEffect(() => { if (advogadoDialogOpen && advogados.length === 0) { setLoadingAdvogados(true); listAdvogadosAction(undefined).then((result: any) => { if (result.success && result.data) { setAdvogados(result.data); } }).catch((error: any) => { console.error('Erro ao carregar advogados:', error); }).finally(() => { setLoadingAdvogados(false); }); } }, [advogadoDialogOpen]);
  useEffect(() => { if (selectedTribunal) { setLoadingOrgaos(true); setValue('orgaoId', undefined); fetch(`/api/tribunais/${selectedTribunal}/orgaos`).then((res) => res.json()).then((data) => { if (data.orgaos && Array.isArray(data.orgaos)) { setOrgaos(data.orgaos); } else { setOrgaos([]); } }).catch((error: any) => { console.error('Erro ao carregar órgãos:', error); setOrgaos([]); }).finally(() => { setLoadingOrgaos(false); }); } else { setOrgaos([]); setValue('orgaoId', undefined); } }, [selectedTribunal, setValue]);
  const onSubmit = async (data: SearchFormData) => { const filters: any = { itensPorPagina: 100 }; if (data.siglaTribunal) filters.siglaTribunal = data.siglaTribunal; if (data.texto) filters.texto = data.texto; if (data.nomeParte) filters.nomeParte = data.nomeParte; if (data.numeroProcesso) filters.numeroProcesso = data.numeroProcesso; if (data.numeroComunicacao) filters.numeroComunicacao = typeof data.numeroComunicacao === 'string' ? Number(data.numeroComunicacao) : data.numeroComunicacao; if (data.orgaoId) filters.orgaoId = data.orgaoId; if (data.dataInicio) filters.dataInicio = data.dataInicio; if (data.dataFim) filters.dataFim = data.dataFim; if (data.meio) filters.meio = data.meio; if (data.modoAdvogado === 'cadastrado' || (data.numeroOab && data.ufOab)) { if (data.numeroOab && data.numeroOab !== '') { filters.numeroOab = data.numeroOab.toString(); } if (data.ufOab && data.ufOab !== '') { filters.ufOab = data.ufOab; } if ((!filters.numeroOab || !filters.ufOab) && data.advogadoId) { const advogado = advogados.find((a) => a.id === data.advogadoId); if (advogado) { filters.numeroOab = advogado.oabNumero?.toString(); filters.ufOab = advogado.oabUf; } } } else if (data.modoAdvogado === 'manual') { if (data.nomeAdvogado) filters.nomeAdvogado = data.nomeAdvogado; if (data.numeroOab) filters.numeroOab = data.numeroOab.toString(); if (data.ufOab) filters.ufOab = data.ufOab; } await fetchComunicacoes(filters); };
  const filteredTribunais = useMemo(() => { if (!tribunalSearchTerm) return tribunaisCNJ; const searchLower = tribunalSearchTerm.toLowerCase(); return tribunaisCNJ.filter((t) => t.sigla.toLowerCase().includes(searchLower) || t.nome.toLowerCase().includes(searchLower)); }, [tribunaisCNJ, tribunalSearchTerm]);
  const filteredOrgaos = useMemo(() => { if (!orgaoSearchTerm) return orgaos; const searchLower = orgaoSearchTerm.toLowerCase(); return orgaos.filter((o) => o.nome.toLowerCase().includes(searchLower) || (o.tipo && o.tipo.toLowerCase().includes(searchLower))); }, [orgaos, orgaoSearchTerm]);
  const selectedTribunalData = tribunaisCNJ.find((t) => t.sigla === selectedTribunal);
  const selectedOrgaoData = orgaos.find((o) => o.orgaoIdCNJ === selectedOrgaoId);
  const selectedAdvogadoData = advogados.find((a) => a.id === selectedAdvogadoId);
  const parseLocalDate = (dateString: string): Date => { const [year, month, day] = dateString.split('-').map(Number); return new Date(year, month - 1, day); };
  const formatYYYYMMDD = (d: Date): string => { const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; };
  if (!isMounted) { useEffect(() => setIsMounted(true), []); return (<form className="space-y-4 p-4 border rounded-lg"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><div className="space-y-2"><Label htmlFor="siglaTribunal">Tribunal</Label><Button variant="outline" className="w-full justify-between" disabled>Carregando...</Button></div></div></form>); }
  const onError = (errors: any) => { console.error('[SearchForm] Validation errors:', errors); };
  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="siglaTribunal">Tribunal</Label>
          <Popover open={tribunalSearchOpen} onOpenChange={setTribunalSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={tribunalSearchOpen} className="w-full justify-between">
                {selectedTribunalData ? `${selectedTribunalData.sigla} - ${selectedTribunalData.nome}` : 'Selecione um tribunal'}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="flex flex-col"><div className="p-2 border-b"><Input placeholder="Buscar tribunal..." value={tribunalSearchTerm} onChange={(e) => setTribunalSearchTerm(e.target.value)} className="h-9" /></div><div className="max-h-[300px] overflow-y-auto">{filteredTribunais.length === 0 ? (<div className="p-4 text-sm text-muted-foreground text-center">Nenhum tribunal encontrado</div>) : (filteredTribunais.map((tribunal) => (<div key={tribunal.sigla} className={cn('flex items-center px-3 py-2 cursor-pointer hover:bg-accent', selectedTribunal === tribunal.sigla && 'bg-accent')} onClick={() => { setValue('siglaTribunal', tribunal.sigla); setTribunalSearchOpen(false); setTribunalSearchTerm(''); }}><Check className={cn('mr-2 h-4 w-4', selectedTribunal === tribunal.sigla ? 'opacity-100' : 'opacity-0')} /><span className="flex-1">{tribunal.sigla} - {tribunal.nome}</span></div>)))}</div></div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2"><Label htmlFor="texto">Busca Textual</Label><Input {...register('texto')} placeholder="Texto livre na comunicação" /></div>
        <div className="space-y-2"><Label htmlFor="numeroProcesso">Número do Processo</Label><Input {...register('numeroProcesso')} placeholder="0000000-00.0000.0.00.0000" /></div>
        <div className="space-y-2"><Label htmlFor="numeroComunicacao">Número da Comunicação (Opcional)</Label><Input {...register('numeroComunicacao', { setValueAs: (value) => { if (value === '' || value === null || value === undefined) return undefined; const num = Number(value); return isNaN(num) || num <= 0 ? undefined : num; } })} type="number" placeholder="Ex: 123456 (opcional)" /></div>
        <div className="space-y-2"><Label htmlFor="orgaoId">Órgão Judicial</Label><Popover open={orgaoSearchOpen} onOpenChange={setOrgaoSearchOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" aria-expanded={orgaoSearchOpen} className="w-full justify-between" disabled={!selectedTribunal || loadingOrgaos}>{loadingOrgaos ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Carregando órgãos...</>) : !selectedTribunal ? ('Selecione um tribunal primeiro') : selectedOrgaoData ? (<span className="truncate">{selectedOrgaoData.nome}</span>) : orgaos.length === 0 ? ('Nenhum órgão disponível') : ('Selecione um órgão')}<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-full p-0" align="start"><div className="flex flex-col"><div className="p-2 border-b"><Input placeholder="Buscar órgão..." value={orgaoSearchTerm} onChange={(e) => setOrgaoSearchTerm(e.target.value)} className="h-9" /></div><div className="max-h-[300px] overflow-y-auto">{filteredOrgaos.length === 0 ? (<div className="p-4 text-sm text-muted-foreground text-center">{orgaoSearchTerm ? 'Nenhum órgão encontrado' : 'Nenhum órgão disponível'}</div>) : (filteredOrgaos.map((orgao) => (<div key={orgao.id} className={cn('flex items-center px-3 py-2 cursor-pointer hover:bg-accent', selectedOrgaoId === orgao.orgaoIdCNJ && 'bg-accent')} onClick={() => { setValue('orgaoId', orgao.orgaoIdCNJ); setOrgaoSearchOpen(false); setOrgaoSearchTerm(''); }}><Check className={cn('mr-2 h-4 w-4', selectedOrgaoId === orgao.orgaoIdCNJ ? 'opacity-100' : 'opacity-0')} /><span className="flex-1 truncate">{orgao.nome}{orgao.tipo && (<span className="ml-2 text-xs text-muted-foreground">({orgao.tipo})</span>)}</span></div>)))}</div></div></PopoverContent></Popover></div>
        <div className="space-y-2"><Label htmlFor="nomeParte">Parte</Label><Input {...register('nomeParte')} placeholder="Nome da parte" /></div>
        <div className="space-y-2"><Label htmlFor="advogado">Advogado</Label><Select value={modoAdvogado || ''} onValueChange={(value) => { if (value === 'cadastrado') { setAdvogadoDialogOpen(true); } else if (value === 'manual') { setManualDialogOpen(true); } }}><SelectTrigger id="advogado"><SelectValue placeholder="Selecione o modo" /></SelectTrigger><SelectContent><SelectItem value="cadastrado">Advogado Cadastrado</SelectItem><SelectItem value="manual">Dados Manuais</SelectItem></SelectContent></Select></div>
        <Dialog open={advogadoDialogOpen} onOpenChange={setAdvogadoDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Selecionar Advogado Cadastrado</DialogTitle><DialogDescription>Escolha um advogado cadastrado no sistema</DialogDescription></DialogHeader>{loadingAdvogados ? (<div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><span className="ml-3 text-muted-foreground">Carregando advogados...</span></div>) : (<Command className="border rounded-lg"><CommandInput placeholder="Buscar advogado..." /><CommandList className="max-h-[300px]"><CommandEmpty>Nenhum advogado encontrado</CommandEmpty><CommandGroup>{advogados.map((advogado) => (<CommandItem key={advogado.id} value={`${advogado.nome} ${advogado.oabNumero} ${advogado.oabUf}`} onSelect={() => { setValue('modoAdvogado', 'cadastrado'); if (advogado.id && typeof advogado.id === 'string') { setValue('advogadoId', advogado.id, { shouldValidate: true }); setValue('numeroOab', advogado.oabNumero?.toString() || '', { shouldValidate: false, shouldDirty: true, shouldTouch: false }); setValue('ufOab', advogado.oabUf || '', { shouldValidate: false, shouldDirty: true, shouldTouch: false }); } else { setValue('advogadoId', undefined); } setValue('nomeAdvogado', undefined); setAdvogadoDialogOpen(false); }} className="cursor-pointer"><Check className={cn('mr-2 h-4 w-4', selectedAdvogadoId === advogado.id ? 'opacity-100' : 'opacity-0')} /><div className="flex flex-col"><span className="font-medium">{advogado.nome}</span><span className="text-sm text-muted-foreground">OAB {advogado.oabNumero}/{advogado.oabUf}</span></div></CommandItem>))}</CommandGroup></CommandList></Command>)}</DialogContent></Dialog>
        <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}><DialogContent><DialogHeader><DialogTitle>Dados do Advogado (Manual)</DialogTitle><DialogDescription>Preencha os dados do advogado manualmente</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="nomeAdvogadoDialog">Nome do Advogado</Label><Input id="nomeAdvogadoDialog" placeholder="Nome completo" defaultValue={nomeAdvogado} onChange={(e) => setValue('nomeAdvogado', e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="numeroOabDialog">Número OAB</Label><Input id="numeroOabDialog" placeholder="Ex: 123456" defaultValue={numeroOab} onChange={(e) => setValue('numeroOab', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="ufOabDialog">UF</Label><Input id="ufOabDialog" placeholder="Ex: SP" maxLength={2} defaultValue={ufOab} onChange={(e) => setValue('ufOab', e.target.value.toUpperCase())} /></div></div><div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setManualDialogOpen(false)}>Cancelar</Button><Button type="button" onClick={() => { setValue('modoAdvogado', 'manual'); setValue('advogadoId', undefined); setManualDialogOpen(false); }}>Confirmar</Button></div></div></DialogContent></Dialog>
        <div className="space-y-2">
          <Label htmlFor="dateRange">Período</Label>
          <DateRangePicker
            value={{
              from: watch('dataInicio') ? parseLocalDate(watch('dataInicio')!) : undefined,
              to: watch('dataFim') ? parseLocalDate(watch('dataFim')!) : undefined,
            }}
            onChange={(range) => {
              setValue('dataInicio', range?.from ? formatYYYYMMDD(range.from) : undefined);
              setValue('dataFim', range?.to ? formatYYYYMMDD(range.to) : undefined);
            }}
            allowSingle
          />
        </div>
        <div className="space-y-2"><Label htmlFor="meio">Meio</Label><Select onValueChange={(value) => setValue('meio', value as any)}><SelectTrigger id="meio"><SelectValue placeholder="Selecione o meio" /></SelectTrigger><SelectContent><SelectItem value="E">Edital</SelectItem><SelectItem value="D">Diário Eletrônico</SelectItem></SelectContent></Select></div>
      </div>
      {(errors.root || Object.keys(errors).length > 0) && (<div className="space-y-1">{errors.root && (<p className="text-sm text-destructive">{errors.root.message}</p>)}{Object.keys(errors).filter(key => key !== 'root').map((key) => (<p key={key} className="text-sm text-destructive">{key}: {errors[key as keyof typeof errors]?.message || 'Erro de validação'}</p>))}</div>)}
      <div className="flex gap-2"><Button type="submit" disabled={isLoading}>{isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Buscando...</>) : (<><Search className="mr-2 h-4 w-4" />Buscar</>)}</Button><Button type="button" variant="outline" onClick={() => reset()}><X className="mr-2 h-4 w-4" />Limpar</Button></div>
    </form>
  );
}

