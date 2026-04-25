'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogFormShell,
  DialogSection,
  type DialogSectionStepState,
} from '@/components/shared/dialog-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Scale,
  Building2,
  FileType,
  CheckCircle2,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Text } from '@/components/ui/typography';
import { toast } from 'sonner';
import { actionCriarExpediente, type ActionResult } from '../actions';
import { GrauTribunal, CodigoTribunal } from '../domain';
import { actionListarAcervoPaginado } from '@/app/(authenticated)/acervo';
import { actionListarUsuarios } from '@/app/(authenticated)/usuarios';
import {
  actionListarTiposExpedientes,
  type TipoExpediente,
} from '@/app/(authenticated)/tipos-expedientes';

interface DadosIniciais {
  processoId: number;
  trt: CodigoTribunal;
  grau: GrauTribunal;
  numeroProcesso: string;
  nomeParteAutora?: string;
  nomeParteRe?: string;
}

interface NovoExpedienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Dados iniciais pré-preenchidos (ex: ao criar expediente a partir de audiência) */
  dadosIniciais?: DadosIniciais;
}

interface Processo {
  id: number;
  numeroProcesso: string;
  nomeParteAutora: string;
  nomeParteRe: string;
  trt: CodigoTribunal;
  grau: GrauTribunal;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
  errors: undefined,
};

const TRTS: ComboboxOption[] = CodigoTribunal.map((trt) => ({
  value: trt,
  label: trt,
}));

const GRAUS: ComboboxOption[] = [
  { value: GrauTribunal.PRIMEIRO_GRAU, label: '1º Grau' },
  { value: GrauTribunal.SEGUNDO_GRAU, label: '2º Grau' },
  { value: GrauTribunal.TRIBUNAL_SUPERIOR, label: 'Tribunal Superior' },
];

const formatarGrau = (grau: string): string => {
  switch (grau) {
    case GrauTribunal.PRIMEIRO_GRAU:
      return '1º Grau';
    case GrauTribunal.SEGUNDO_GRAU:
      return '2º Grau';
    case GrauTribunal.TRIBUNAL_SUPERIOR:
      return 'Tribunal Superior';
    default:
      return grau;
  }
};

type StepNumber = 1 | 2 | 3;

function stepStateFor(
  active: boolean,
  complete: boolean,
): DialogSectionStepState {
  if (complete) return 'complete';
  if (active) return 'active';
  return 'pending';
}

export function ExpedienteDialog({
  open,
  onOpenChange,
  onSuccess,
  dadosIniciais,
}: NovoExpedienteDialogProps) {
  const [formState, formAction, isPending] = useActionState(
    actionCriarExpediente,
    initialState,
  );

  const getErrors = (): Record<string, string[]> | undefined => {
    return !formState.success ? formState.errors : undefined;
  };

  // ──────────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────────
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [tiposExpediente, setTiposExpediente] = React.useState<TipoExpediente[]>(
    [],
  );
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  const [loadingProcessos, setLoadingProcessos] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = React.useState(false);

  const [trtValue, setTrtValue] = React.useState<string>('');
  const [grauValue, setGrauValue] = React.useState<string>('');
  const [processoIdValue, setProcessoIdValue] = React.useState<string[]>([]);
  const [tipoExpedienteIdValue, setTipoExpedienteIdValue] =
    React.useState<string>('');
  const [dataPrazoValue, setDataPrazoValue] = React.useState<string>('');
  const [horaPrazoValue, setHoraPrazoValue] = React.useState<string>('');
  const [responsavelIdValue, setResponsavelIdValue] =
    React.useState<string>('');
  const [descricaoValue, setDescricaoValue] = React.useState<string>('');

  const modoProcessoDefinido = !!dadosIniciais;

  // ──────────────────────────────────────────────────────────────
  // Processo selecionado (fonte da verdade para numeroProcesso/trt/grau)
  // ──────────────────────────────────────────────────────────────
  const processoSelecionado = React.useMemo<Processo | null>(() => {
    if (modoProcessoDefinido && dadosIniciais) {
      return {
        id: dadosIniciais.processoId,
        numeroProcesso: dadosIniciais.numeroProcesso,
        nomeParteAutora: dadosIniciais.nomeParteAutora || '',
        nomeParteRe: dadosIniciais.nomeParteRe || '',
        trt: dadosIniciais.trt,
        grau: dadosIniciais.grau,
      };
    }
    if (processoIdValue.length === 0) return null;
    return (
      processos.find((p) => p.id.toString() === processoIdValue[0]) || null
    );
  }, [modoProcessoDefinido, dadosIniciais, processoIdValue, processos]);

  // Preenche state inicial quando dadosIniciais são fornecidos
  React.useEffect(() => {
    if (modoProcessoDefinido && dadosIniciais) {
      setTrtValue(dadosIniciais.trt);
      setGrauValue(dadosIniciais.grau);
      setProcessoIdValue([dadosIniciais.processoId.toString()]);
    }
  }, [modoProcessoDefinido, dadosIniciais]);

  // ──────────────────────────────────────────────────────────────
  // Fetch de processos (modo manual): dispara ao selecionar TRT+Grau
  // ──────────────────────────────────────────────────────────────
  const buscarProcessos = React.useCallback(
    async (trt: CodigoTribunal, grau: GrauTribunal) => {
      setLoadingProcessos(true);
      try {
        const result = await actionListarAcervoPaginado({
          trt,
          grau,
          limite: 100,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro ao buscar processos');
        }

        const processosData =
          result.data &&
          typeof result.data === 'object' &&
          'processos' in result.data
            ? (
                result.data as {
                  processos: Array<{
                    id: number;
                    numero_processo: string;
                    nome_parte_autora: string | null;
                    nome_parte_re: string | null;
                    trt: CodigoTribunal;
                    grau: GrauTribunal;
                  }>;
                }
              ).processos
            : [];

        setProcessos(
          processosData.map((p) => ({
            id: p.id,
            numeroProcesso: p.numero_processo,
            nomeParteAutora: p.nome_parte_autora ?? '',
            nomeParteRe: p.nome_parte_re ?? '',
            trt: p.trt,
            grau: p.grau,
          })),
        );
      } catch (err) {
        console.error('Erro ao buscar processos:', err);
        setProcessos([]);
        toast.error('Falha ao carregar processos', {
          description: 'Verifique a conexão e tente novamente.',
        });
      } finally {
        setLoadingProcessos(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (modoProcessoDefinido) return;
    if (trtValue && grauValue) {
      buscarProcessos(trtValue as CodigoTribunal, grauValue as GrauTribunal);
    } else {
      setProcessos([]);
      setProcessoIdValue([]);
    }
  }, [trtValue, grauValue, modoProcessoDefinido, buscarProcessos]);

  // ──────────────────────────────────────────────────────────────
  // Fetch de tipos e usuários (via Server Actions) ao abrir o dialog
  // ──────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchTipos = async () => {
      setLoadingTipos(true);
      try {
        const result = await actionListarTiposExpedientes({ limite: 100 });
        if (cancelled) return;
        if (!result.success) {
          throw new Error(result.error || 'Erro ao buscar tipos de expediente');
        }
        setTiposExpediente(result.data?.data ?? []);
      } catch (err) {
        if (cancelled) return;
        console.error('Erro ao buscar tipos de expediente:', err);
        toast.error('Falha ao carregar tipos de expediente');
      } finally {
        if (!cancelled) setLoadingTipos(false);
      }
    };

    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const result = await actionListarUsuarios({
          ativo: true,
          limite: 1000,
        });
        if (cancelled) return;
        if (!result.success) {
          throw new Error(result.error || 'Erro ao buscar usuários');
        }
        setUsuarios(result.data?.usuarios ?? []);
      } catch (err) {
        if (cancelled) return;
        console.error('Erro ao buscar usuários:', err);
        toast.error('Falha ao carregar responsáveis');
      } finally {
        if (!cancelled) setLoadingUsuarios(false);
      }
    };

    if (tiposExpediente.length === 0) fetchTipos();
    if (usuarios.length === 0) fetchUsuarios();

    return () => {
      cancelled = true;
    };
  }, [open, tiposExpediente.length, usuarios.length]);

  // ──────────────────────────────────────────────────────────────
  // Reset form + side-effects de sucesso
  // ──────────────────────────────────────────────────────────────
  const resetForm = React.useCallback(() => {
    setTrtValue('');
    setGrauValue('');
    setProcessoIdValue([]);
    setTipoExpedienteIdValue('');
    setDescricaoValue('');
    setDataPrazoValue('');
    setHoraPrazoValue('');
    setResponsavelIdValue('');
  }, []);

  React.useEffect(() => {
    if (!open) resetForm();
    if (formState.success) {
      toast.success('Expediente criado', {
        description:
          formState.message || 'O novo expediente foi cadastrado com sucesso.',
      });
      onSuccess();
      onOpenChange(false);
      resetForm();
    }
  }, [
    open,
    formState.success,
    formState.message,
    onOpenChange,
    onSuccess,
    resetForm,
  ]);

  const lastErrorRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const err = !formState.success ? formState.error : undefined;
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      toast.error('Não foi possível criar o expediente', { description: err });
    }
    if (formState.success) {
      lastErrorRef.current = undefined;
    }
  }, [formState]);

  // ──────────────────────────────────────────────────────────────
  // Derived options / validations
  // ──────────────────────────────────────────────────────────────
  const processosOptions: ComboboxOption[] = processos.map((p) => ({
    value: p.id.toString(),
    label: p.numeroProcesso,
    searchText: `${p.numeroProcesso} ${p.nomeParteAutora} ${p.nomeParteRe}`,
  }));

  const usuariosOptions: ComboboxOption[] = usuarios.map((u) => ({
    value: u.id.toString(),
    label: u.nomeExibicao,
    searchText: u.nomeExibicao,
  }));

  const generalError = !formState.success
    ? formState.error || formState.message
    : null;

  const prazoCompleto = !!dataPrazoValue && !!horaPrazoValue;
  const podeSubmeter =
    !!processoSelecionado && !!descricaoValue.trim() && prazoCompleto;

  const dataPrazoISO = prazoCompleto
    ? `${dataPrazoValue}T${horaPrazoValue}:00`
    : '';

  const currentStep: StepNumber = modoProcessoDefinido
    ? 3
    : !trtValue || !grauValue
      ? 1
      : !processoSelecionado
        ? 2
        : 3;

  const stepTitle = React.useMemo(() => {
    switch (currentStep) {
      case 1:
        return 'Tribunal e Grau';
      case 2:
        return 'Seleção de Processo';
      case 3:
        return 'Dados do Expediente';
    }
  }, [currentStep]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  const footerButtons = (
    <Button
      form="criar-expediente-form"
      type="submit"
      size="sm"
      className="rounded-xl gap-2"
      disabled={isPending || !podeSubmeter}
    >
      {isPending ? (
        <LoadingSpinner />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Criar expediente
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Novo expediente manual"
      maxWidth="2xl"
      footer={footerButtons}
      multiStep={{
        current: currentStep,
        total: 3,
        stepTitle,
      }}
    >
      <form
        id="criar-expediente-form"
        action={formAction}
        className="space-y-4"
      >
        {/* Hidden inputs — contratam com o schema do backend */}
        <input
          type="hidden"
          name="numeroProcesso"
          value={processoSelecionado?.numeroProcesso || ''}
        />
        <input
          type="hidden"
          name="trt"
          value={processoSelecionado?.trt || ''}
        />
        <input
          type="hidden"
          name="grau"
          value={processoSelecionado?.grau || ''}
        />
        <input type="hidden" name="origem" value="manual" />
        <input
          type="hidden"
          name="processoId"
          value={processoSelecionado?.id.toString() || ''}
        />
        <input
          type="hidden"
          name="tipoExpedienteId"
          value={tipoExpedienteIdValue}
        />
        <input
          type="hidden"
          name="responsavelId"
          value={responsavelIdValue}
        />
        <input
          type="hidden"
          name="dataPrazoLegalParte"
          value={dataPrazoISO}
        />
        <input
          type="hidden"
          name="nomeParteAutora"
          value={processoSelecionado?.nomeParteAutora || ''}
        />
        <input
          type="hidden"
          name="nomeParteRe"
          value={processoSelecionado?.nomeParteRe || ''}
        />

        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        {/* ─── Etapa 1 — Tribunal + Grau (apenas modo manual) ─── */}
        {!modoProcessoDefinido && (
          <DialogSection
            step={1}
            stepState={stepStateFor(
              currentStep === 1,
              !!(trtValue && grauValue),
            )}
            title="Selecione o tribunal e grau"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trt" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  TRT
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={trtValue}
                  onValueChange={setTrtValue}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="trt"
                    className="h-10 w-full"
                    aria-invalid={!!getErrors()?.trt}
                    aria-describedby={getErrors()?.trt ? 'trt-error' : undefined}
                  >
                    <SelectValue placeholder="Selecione o TRT" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRTS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getErrors()?.trt && (
                  <p
                    id="trt-error"
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.trt[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grau" className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Grau
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={grauValue}
                  onValueChange={setGrauValue}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="grau"
                    className="h-10 w-full"
                    aria-invalid={!!getErrors()?.grau}
                    aria-describedby={getErrors()?.grau ? 'grau-error' : undefined}
                  >
                    <SelectValue placeholder="Selecione o grau" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAUS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getErrors()?.grau && (
                  <p
                    id="grau-error"
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.grau[0]}
                  </p>
                )}
              </div>
            </div>
          </DialogSection>
        )}

        {/* ─── Etapa 2 — Seleção de processo ─── */}
        {!modoProcessoDefinido && trtValue && grauValue && (
          <DialogSection
            step={2}
            stepState={stepStateFor(
              currentStep === 2,
              !!processoSelecionado,
            )}
            title="Selecione o processo"
          >
            <div className="space-y-2">
              <Label
                htmlFor="processoIdCombobox"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Processo
                <span className="text-destructive">*</span>
              </Label>

              {loadingProcessos ? (
                <div className="flex items-center gap-2 h-10 px-3 border border-border/40 rounded-md bg-muted/40">
                  <LoadingSpinner />
                  <span className="text-sm text-muted-foreground">
                    Carregando processos...
                  </span>
                </div>
              ) : processos.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum processo encontrado para {trtValue} -{' '}
                    {formatarGrau(grauValue)}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Combobox
                    options={processosOptions}
                    value={processoIdValue}
                    onValueChange={setProcessoIdValue}
                    placeholder="Buscar por número, parte autora ou ré..."
                    searchPlaceholder="Digite para buscar..."
                    searchHint="Busque por número do processo, parte autora ou parte ré"
                    emptyText="Nenhum processo encontrado"
                    disabled={isPending}
                  />
                  {getErrors()?.processoId && (
                    <p
                      role="alert"
                      className="text-sm font-medium text-destructive"
                    >
                      {getErrors()!.processoId[0]}
                    </p>
                  )}
                </>
              )}
            </div>
          </DialogSection>
        )}

        {/* ─── Processo vinculado (quando há) ─── */}
        {processoSelecionado && (
          <DialogSection
            icon={CheckCircle2}
            title="Processo vinculado"
          >
            <p className="text-base font-semibold tabular-nums">
              {processoSelecionado.numeroProcesso}
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 min-w-0">
                <Text
                  variant="meta-label"
                  as="dt"
                  className="text-muted-foreground"
                >
                  Parte autora
                </Text>
                <dd className="text-sm font-medium truncate">
                  {processoSelecionado.nomeParteAutora || '—'}
                </dd>
              </div>
              <div className="space-y-1 min-w-0">
                <Text
                  variant="meta-label"
                  as="dt"
                  className="text-muted-foreground"
                >
                  Parte ré
                </Text>
                <dd className="text-sm font-medium truncate">
                  {processoSelecionado.nomeParteRe || '—'}
                </dd>
              </div>
            </dl>
          </DialogSection>
        )}

        {/* ─── Etapa 3 — Dados do expediente ─── */}
        {processoSelecionado && (
          <DialogSection
            step={3}
            stepState={stepStateFor(currentStep === 3, podeSubmeter)}
            title="Dados do expediente"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label
                  htmlFor="tipoExpedienteIdSelect"
                  className="flex items-center gap-2"
                >
                  <FileType className="h-4 w-4 text-muted-foreground" />
                  Tipo de expediente
                </Label>
                {loadingTipos ? (
                  <div className="flex items-center gap-2 h-10 px-3 border border-border/40 rounded-md bg-muted/40">
                    <LoadingSpinner />
                    <span className="text-sm text-muted-foreground">
                      Carregando tipos...
                    </span>
                  </div>
                ) : (
                  <Select
                    value={tipoExpedienteIdValue}
                    onValueChange={setTipoExpedienteIdValue}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="tipoExpedienteIdSelect"
                      className="h-10 w-full"
                    >
                      <SelectValue placeholder="Selecione o tipo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposExpediente.map((tipo) => (
                        <SelectItem
                          key={tipo.id}
                          value={tipo.id.toString()}
                        >
                          {tipo.tipoExpediente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {getErrors()?.tipoExpedienteId && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.tipoExpedienteId[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label
                  htmlFor="descricao"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={descricaoValue}
                  onChange={(e) => setDescricaoValue(e.target.value)}
                  placeholder="Descreva o expediente em detalhes..."
                  disabled={isPending}
                  rows={4}
                  required
                  className="resize-none w-full"
                  aria-invalid={!!getErrors()?.descricao}
                  aria-describedby={getErrors()?.descricao ? 'descricao-error' : undefined}
                />
                {getErrors()?.descricao && (
                  <p
                    id="descricao-error"
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.descricao[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-1">
                <Label
                  htmlFor="dataPrazo"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Data do prazo
                  <span className="text-destructive">*</span>
                </Label>
                <div className={isPending ? 'pointer-events-none opacity-50' : ''}>
                  <FormDatePicker
                    id="dataPrazo"
                    value={dataPrazoValue || undefined}
                    onChange={(v) => setDataPrazoValue(v || '')}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-1">
                <Label
                  htmlFor="horaPrazo"
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Hora
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="horaPrazo"
                  name="horaPrazo"
                  type="time"
                  value={horaPrazoValue}
                  onChange={(e) => setHoraPrazoValue(e.target.value)}
                  disabled={isPending || !dataPrazoValue}
                  className="h-10 w-full pl-2"
                  aria-invalid={
                    !!(getErrors()?.dataPrazoLegalParte || getErrors()?.horaPrazo)
                  }
                  aria-describedby={
                    getErrors()?.dataPrazoLegalParte || getErrors()?.horaPrazo
                      ? 'prazo-error'
                      : undefined
                  }
                />
                {(getErrors()?.dataPrazoLegalParte ||
                  getErrors()?.horaPrazo) && (
                  <p
                    id="prazo-error"
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.dataPrazoLegalParte?.[0] ||
                      getErrors()!.horaPrazo?.[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label
                  htmlFor="responsavelIdCombobox"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Responsável
                </Label>
                {loadingUsuarios ? (
                  <div className="flex items-center gap-2 h-10 px-3 border border-border/40 rounded-md bg-muted/40">
                    <LoadingSpinner />
                    <span className="text-sm text-muted-foreground">
                      Carregando usuários...
                    </span>
                  </div>
                ) : (
                  <Combobox
                    options={usuariosOptions}
                    value={responsavelIdValue ? [responsavelIdValue] : []}
                    onValueChange={(values) =>
                      setResponsavelIdValue(values[0] || '')
                    }
                    placeholder="Selecione o responsável (opcional)"
                    searchPlaceholder="Buscar por nome..."
                    emptyText="Nenhum usuário encontrado"
                    disabled={isPending}
                  />
                )}
                {getErrors()?.responsavelId && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {getErrors()!.responsavelId[0]}
                  </p>
                )}
              </div>
            </div>
          </DialogSection>
        )}
      </form>
    </DialogFormShell>
  );
}
