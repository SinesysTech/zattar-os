'use client';

// Componente de diálogo para criar nova audiência

import * as React from 'react';
import {
  Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from '@/components/ui/select';
import { Combobox,
  type ComboboxOption } from '@/components/ui/combobox';
import {
  Landmark,
  CalendarDays,
  MapPin,
  Video,
  UserRound,
  MessageSquare,
  AlertCircle} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Stack,
  Inline } from '@/components/ui/stack';
import { Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { actionBuscarProcessosParaSelector } from '@/app/(authenticated)/acervo';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import {
  actionCriarAudienciaPayload,
  actionListarTiposAudiencia,
  actionListarSalasAudiencia,
} from '@/app/(authenticated)/audiencias/actions';
import { localToISO } from '@/app/(authenticated)/audiencias/lib/date-utils';

import { LoadingSpinner } from "@/components/ui/loading-state"
// ─── Section Helpers ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Inline gap="tight" className="mb-3">
      <Icon className="size-3.5 text-primary/70" />
      <Text variant="overline" className="text-muted-foreground">
        {label}
      </Text>
    </Inline>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'rounded-[14px] bg-muted/40 border border-border/30 p-4', className)}>
      {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="mb-1.5 block">
      <Text variant="label" className="text-foreground/80">
        {children}
      </Text>
    </Label>
  );
}

function InlineLoader({ label }: { label: string }) {
  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground/75")}>
      <LoadingSpinner size="sm" className="shrink-0" />
      <span className={cn("text-body-sm")}>{label}</span>
    </div>
  );
}

interface NovaAudienciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Processo {
  id: number;
  numero_processo: string;
  nome_parte_autora: string;
  nome_parte_re: string;
  trt: string;
  grau: string;
}

interface TipoAudiencia {
  id: number;
  descricao: string;
  is_virtual: boolean;
}

interface SalaAudiencia {
  id: number;
  nome: string;
}

interface Usuario {
  id: number;
  nome_exibicao: string;
  email_corporativo: string;
}

// Opções de TRT (TRT1 a TRT24)
const TRTS = Array.from({ length: 24 }, (_, i) => {
  const num = i + 1;
  return {
    value: `TRT${num}`,
    label: `TRT${num}`,
  };
});

// Opções de Grau
const GRAUS = [
  { value: 'primeiro_grau', label: '1º Grau' },
  { value: 'segundo_grau', label: '2º Grau' },
];

export function NovaAudienciaDialog({ open, onOpenChange, onSuccess }: NovaAudienciaDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados de dados
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [tiposAudiencia, setTiposAudiencia] = React.useState<TipoAudiencia[]>([]);
  const [salas, setSalas] = React.useState<SalaAudiencia[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  // Estados de loading
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(false);
  const [loadingSalas, setLoadingSalas] = React.useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = React.useState(false);

  // Form state
  const [trt, setTrt] = React.useState<string>('');
  const [grau, setGrau] = React.useState<string>('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [dataInicio, setDataInicio] = React.useState('');
  const [horaInicio, setHoraInicio] = React.useState('');
  const [dataFim, setDataFim] = React.useState('');
  const [horaFim, setHoraFim] = React.useState('');
  const [tipoAudienciaId, setTipoAudienciaId] = React.useState<string>('');
  const [salaAudienciaId, setSalaAudienciaId] = React.useState<string>('');
  const [urlVirtual, setUrlVirtual] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [observacoes, setObservacoes] = React.useState('');

  // Campos de endereço presencial
  const [logradouro, setLogradouro] = React.useState('');
  const [numero, setNumero] = React.useState('');
  const [complemento, setComplemento] = React.useState('');
  const [bairro, setBairro] = React.useState('');
  const [cidade, setCidade] = React.useState('');
  const [estado, setEstado] = React.useState('');
  const [cep, setCep] = React.useState('');

  // Processo selecionado
  const processoSelecionado = React.useMemo(() => {
    if (processoId.length === 0) return null;
    return processos.find((p) => p.id.toString() === processoId[0]) || null;
  }, [processoId, processos]);

  // Tipo selecionado
  const tipoSelecionado = React.useMemo(() => {
    if (!tipoAudienciaId) return null;
    return tiposAudiencia.find((t) => t.id.toString() === tipoAudienciaId) || null;
  }, [tipoAudienciaId, tiposAudiencia]);

  const buscarProcessos = React.useCallback(async (trtParam: string, grauParam: string) => {
    setLoadingProcessos(true);
    try {
      const result = await actionBuscarProcessosParaSelector({
        trt: trtParam,
        grau: grauParam,
        limite: 200,
      });

      if (!result.success) throw new Error(result.error || 'Erro ao buscar processos');

      setProcessos((result.data as Processo[]) ?? []);
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
      setError('Erro ao carregar processos');
    } finally {
      setLoadingProcessos(false);
    }
  }, []);

  const buscarTiposAudiencia = React.useCallback(async (_trt: string, _grau: string) => {
    setLoadingTipos(true);
    try {
      const result = await actionListarTiposAudiencia();
      if (!result.success) throw new Error(result.error || 'Erro ao buscar tipos de audiência');
      setTiposAudiencia((result.data as unknown as TipoAudiencia[]) || []);
    } catch (err) {
      console.error('Erro ao buscar tipos de audiência:', err);
      setError('Erro ao carregar tipos de audiência');
    } finally {
      setLoadingTipos(false);
    }
  }, []);

  const buscarSalas = React.useCallback(async (trt: string, grau: string) => {
    setLoadingSalas(true);
    try {
      const result = await actionListarSalasAudiencia({ trt, grau });
      if (!result.success) throw new Error(result.error || 'Erro ao buscar salas de audiência');
      setSalas((result.data as unknown as SalaAudiencia[]) || []);
    } catch (err) {
      console.error('Erro ao buscar salas de audiência:', err);
      setError('Erro ao carregar salas de audiência');
    } finally {
      setLoadingSalas(false);
    }
  }, []);

  const buscarUsuarios = React.useCallback(async () => {
    setLoadingUsuarios(true);
    try {
      const result = await actionListarUsuarios({ ativo: true, limite: 1000 });
      if (!result.success) throw new Error(result.error || 'Erro ao buscar usuários');

      const usuariosPayload = result.data as { usuarios?: Usuario[] } | Usuario[] | undefined;
      if (Array.isArray(usuariosPayload)) {
        setUsuarios(usuariosPayload);
      } else {
        setUsuarios(usuariosPayload?.usuarios ?? []);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  // Buscar processos quando TRT e Grau forem selecionados
  React.useEffect(() => {
    if (trt && grau) {
      buscarProcessos(trt, grau);
    } else {
      setProcessos([]);
      setProcessoId([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trt, grau]);

  // Buscar usuários quando o dialog abrir
  React.useEffect(() => {
    if (open && usuarios.length === 0) {
      buscarUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, usuarios.length]);

  // Buscar tipos de audiência quando TRT e Grau forem selecionados
  React.useEffect(() => {
    if (trt && grau) {
      buscarTiposAudiencia(trt, grau);
    } else {
      setTiposAudiencia([]);
      setTipoAudienciaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trt, grau]);

  // Buscar salas quando processo for selecionado
  React.useEffect(() => {
    if (processoSelecionado) {
      buscarSalas(processoSelecionado.trt, processoSelecionado.grau);
    } else {
      setSalas([]);
      setSalaAudienciaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoSelecionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!trt) {
      setError('Selecione o TRT');
      return;
    }

    if (!grau) {
      setError('Selecione o grau');
      return;
    }

    if (processoId.length === 0) {
      setError('Selecione um processo');
      return;
    }

    if (!dataInicio || !horaInicio) {
      setError('Data e hora de início são obrigatórias');
      return;
    }

    if (!dataFim || !horaFim) {
      setError('Data e hora de fim são obrigatórias');
      return;
    }

    // Converter para ISO timestamps usando utilitário de timezone
    const dataInicioISO = localToISO(dataInicio, horaInicio);
    const dataFimISO = localToISO(dataFim, horaFim);

    // Montar endereço presencial se aplicável
    let enderecoPresencial: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
    } | null = null;
    if (tipoSelecionado && !tipoSelecionado.is_virtual) {
      if (logradouro && numero && bairro && cidade && estado && cep) {
        enderecoPresencial = {
          cep,
          logradouro,
          numero,
          complemento: complemento || undefined,
          bairro,
          cidade,
          uf: estado,
        };
      }
    }

    setIsLoading(true);

    try {
      // Find sala name from salaAudienciaId
      const salaSelecionada = salas.find((s) => s.id.toString() === salaAudienciaId);
      const salaAudienciaNome = salaSelecionada?.nome || undefined;

      const result = await actionCriarAudienciaPayload({
        processoId: parseInt(processoId[0]),
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        tipoAudienciaId: tipoAudienciaId ? parseInt(tipoAudienciaId) : undefined,
        salaAudienciaNome,
        urlAudienciaVirtual: urlVirtual || undefined,
        enderecoPresencial,
        observacoes: observacoes || undefined,
        responsavelId: responsavelId ? parseInt(responsavelId) : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar audiência');
      }

      // Resetar form
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao criar audiência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar audiência');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTrt('');
    setGrau('');
    setProcessoId([]);
    setDataInicio('');
    setHoraInicio('');
    setDataFim('');
    setHoraFim('');
    setTipoAudienciaId('');
    setSalaAudienciaId('');
    setUrlVirtual('');
    setResponsavelId('');
    setObservacoes('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setEstado('');
    setCep('');
    setError(null);
  };
  const parseLocalDate = (dateString: string): Date => { const [year, month, day] = dateString.split('-').map(Number); return new Date(year, month - 1, day); };
  const formatYYYYMMDD = (d: Date): string => { const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${da}`; };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Opções para o combobox de processos
  const processosOptions: ComboboxOption[] = React.useMemo(() => {
    return processos.map((p) => ({
      value: p.id.toString(),
      label: `${p.numero_processo} - ${p.nome_parte_autora} vs ${p.nome_parte_re}`,
      searchText: `${p.numero_processo} ${p.nome_parte_autora} ${p.nome_parte_re}`,
    }));
  }, [processos]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        data-density="compact"
        className="sm:max-w-2xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0">
          <DialogTitle>Nova Audiência</DialogTitle>
          <DialogDescription>Preencha os dados para registrar uma nova audiência no sistema.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 [scrollbar-width:thin]">
      <form id="nova-audiencia-form" onSubmit={handleSubmit}>
        <Stack gap="default">
          {/* ── Erro ─────────────────────────────────────────────────────── */}
          {error && (
            <Inline align="start" gap="tight" className={cn(/* design-system-escape: px-3.5 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "rounded-lg border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-destructive")}>
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className={cn(/* design-system-escape: leading-snug sem token DS */ "text-body-sm leading-snug")}>{error}</span>
            </Inline>
          )}

          {/* ── Seção 1: Jurisdição + Processo ───────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={Landmark} label="Jurisdição e Processo" />
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
              <div>
                <FieldLabel htmlFor="trt">Tribunal (TRT) *</FieldLabel>
                <Select value={trt} onValueChange={setTrt}>
                  <SelectTrigger id="trt">
                    <SelectValue placeholder="Selecione o TRT" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRTS.map((tribunal) => (
                      <SelectItem key={tribunal.value} value={tribunal.value}>
                        {tribunal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="grau">Grau *</FieldLabel>
                <Select value={grau} onValueChange={setGrau}>
                  <SelectTrigger id="grau">
                    <SelectValue placeholder="Selecione o grau" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAUS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="processo">Processo *</FieldLabel>
              {!trt || !grau ? (
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border/40 bg-muted/20 text-muted-foreground/70 text-body-sm")}>
                  Selecione o TRT e Grau para listar os processos
                </div>
              ) : loadingProcessos ? (
                <InlineLoader label="Carregando processos..." />
              ) : (
                <Combobox
                  options={processosOptions}
                  value={processoId}
                  onValueChange={setProcessoId}
                  placeholder="Buscar por número ou nome das partes..."
                  searchPlaceholder="Buscar processo..."
                  emptyText="Nenhum processo encontrado."
                  multiple={false}
                />
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── Seção 2: Data e Horário ───────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={CalendarDays} label="Data e Horário" />
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
              <div>
                <FieldLabel htmlFor="dataInicio">Data de Início *</FieldLabel>
                <DatePicker
                  value={dataInicio ? parseLocalDate(dataInicio) : null}
                  onChange={(d) => setDataInicio(d ? formatYYYYMMDD(d) : '')}
                  placeholder="Selecionar data"
                />
              </div>
              <div>
                <FieldLabel htmlFor="horaInicio">Hora de Início *</FieldLabel>
                <Input
                  id="horaInicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
              <div>
                <FieldLabel htmlFor="dataFim">Data de Fim *</FieldLabel>
                <DatePicker
                  value={dataFim ? parseLocalDate(dataFim) : null}
                  onChange={(d) => setDataFim(d ? formatYYYYMMDD(d) : '')}
                  placeholder="Selecionar data"
                />
              </div>
              <div>
                <FieldLabel htmlFor="horaFim">Hora de Fim *</FieldLabel>
                <Input
                  id="horaFim"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── Seção 3: Tipo e Local ─────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            icon={tipoSelecionado?.is_virtual ? Video : MapPin}
            label="Tipo e Local"
          />
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <div>
              <FieldLabel htmlFor="tipo">Tipo de Audiência</FieldLabel>
              {loadingTipos ? (
                <InlineLoader label="Carregando tipos..." />
              ) : !trt || !grau ? (
                <Select disabled>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione TRT e Grau primeiro" />
                  </SelectTrigger>
                </Select>
              ) : (
                <Select value={tipoAudienciaId} onValueChange={setTipoAudienciaId}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecione o tipo de audiência" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAudiencia.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.descricao} {tipo.is_virtual && '(Virtual)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="sala">Sala de Audiência</FieldLabel>
              {loadingSalas ? (
                <InlineLoader label="Carregando salas..." />
              ) : !processoSelecionado ? (
                <Select disabled>
                  <SelectTrigger id="sala">
                    <SelectValue placeholder="Selecione um processo primeiro" />
                  </SelectTrigger>
                </Select>
              ) : (
                <Select value={salaAudienciaId} onValueChange={setSalaAudienciaId}>
                  <SelectTrigger id="sala">
                    <SelectValue placeholder="Selecione a sala de audiência" />
                  </SelectTrigger>
                  <SelectContent>
                    {salas.map((sala) => (
                      <SelectItem key={sala.id} value={sala.id.toString()}>
                        {sala.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Condicional: Virtual ou Presencial */}
            {tipoSelecionado && (
              tipoSelecionado.is_virtual ? (
                <div>
                  <FieldLabel htmlFor="urlVirtual">URL da Audiência Virtual</FieldLabel>
                  <Input
                    id="urlVirtual"
                    type="url"
                    placeholder="https://zoom.us/..."
                    value={urlVirtual}
                    onChange={(e) => setUrlVirtual(e.target.value)}
                  />
                </div>
              ) : (
                <div className={cn(/* design-system-escape: space-y-3 sem token DS; pt-1 padding direcional sem Inset equiv. */ "space-y-3 pt-1")}>
                  <Text variant="overline" as="p" className="text-muted-foreground">
                    Endereço Presencial
                  </Text>

                  <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-3 gap-3")}>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
                      <Input
                        id="logradouro"
                        placeholder="Rua, Avenida, etc."
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="numero">Número</FieldLabel>
                      <Input
                        id="numero"
                        placeholder="123"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3")}>
                    <div>
                      <FieldLabel htmlFor="complemento">Complemento</FieldLabel>
                      <Input
                        id="complemento"
                        placeholder="Sala, Bloco, etc."
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
                      <Input
                        id="bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-3 gap-3")}>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                      <Input
                        id="cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="estado">Estado</FieldLabel>
                      <Input
                        id="estado"
                        placeholder="UF"
                        maxLength={2}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="cep">CEP</FieldLabel>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </SectionCard>

        {/* ── Seção 4: Responsável ──────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={UserRound} label="Responsável" />
          {loadingUsuarios ? (
            <InlineLoader label="Carregando usuários..." />
          ) : (
            <div>
              <FieldLabel htmlFor="responsavel">Responsável pela audiência</FieldLabel>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger id="responsavel">
                  <SelectValue placeholder="Selecione um responsável (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nome_exibicao} ({usuario.email_corporativo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </SectionCard>

        {/* ── Seção 5: Observações ─────────────────────────────────────── */}
        <SectionCard>
          <SectionHeader icon={MessageSquare} label="Observações" />
          <Textarea
            id="observacoes"
            placeholder="Anotações adicionais sobre a audiência..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </SectionCard>

        </Stack>
        </form>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-border/40 shrink-0 justify-between sm:justify-between">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button type="submit" form="nova-audiencia-form" disabled={isLoading}>
              {isLoading && <LoadingSpinner className="mr-2" />}
              Salvar Audiência
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
