'use client';

// Componente de diálogo para criar novo expediente manual
// Refatorado com melhorias de UI/UX seguindo padrões shadcn/ui

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Clock,
  User,
  Scale,
  Building2,
  FileType,
  CheckCircle2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/app/_lib/utils/utils';

interface DadosIniciais {
  processo_id: number;
  trt: string;
  grau: string;
  numero_processo: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
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
  numero_processo: string;
  polo_ativo_nome: string;
  polo_passivo_nome: string;
  trt: string;
  grau: string;
}

interface TipoExpediente {
  id: number;
  tipo_expediente: string;
}

// Corrigido: Usando camelCase para corresponder ao retorno da API
interface Usuario {
  id: number;
  nomeExibicao: string;
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

const formatarGrau = (grau: string): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

export function NovoExpedienteDialog({
  open,
  onOpenChange,
  onSuccess,
  dadosIniciais,
}: NovoExpedienteDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados de dados
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [tiposExpediente, setTiposExpediente] = React.useState<TipoExpediente[]>([]);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  // Estados de loading
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);
  const [loadingTipos, setLoadingTipos] = React.useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = React.useState(false);

  // Form state
  const [trt, setTrt] = React.useState<string>('');
  const [grau, setGrau] = React.useState<string>('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [tipoExpedienteId, setTipoExpedienteId] = React.useState<string>('');
  const [descricao, setDescricao] = React.useState('');
  const [dataPrazo, setDataPrazo] = React.useState('');
  const [horaPrazo, setHoraPrazo] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState<string>('');

  // Determinar se está no modo com dados iniciais (processo já definido)
  const modoProcessoDefinido = !!dadosIniciais;

  // Processo selecionado - usa dados iniciais ou busca na lista
  const processoSelecionado = React.useMemo(() => {
    if (modoProcessoDefinido && dadosIniciais) {
      return {
        id: dadosIniciais.processo_id,
        numero_processo: dadosIniciais.numero_processo,
        polo_ativo_nome: dadosIniciais.polo_ativo_nome || '',
        polo_passivo_nome: dadosIniciais.polo_passivo_nome || '',
        trt: dadosIniciais.trt,
        grau: dadosIniciais.grau,
      };
    }
    if (processoId.length === 0) return null;
    return processos.find((p) => p.id.toString() === processoId[0]) || null;
  }, [modoProcessoDefinido, dadosIniciais, processoId, processos]);

  // Buscar processos quando TRT e Grau forem selecionados (apenas no modo manual)
  React.useEffect(() => {
    if (!modoProcessoDefinido && trt && grau) {
      buscarProcessos(trt, grau);
    } else if (!modoProcessoDefinido) {
      setProcessos([]);
      setProcessoId([]);
    }
  }, [trt, grau, modoProcessoDefinido]);

  // Buscar tipos de expediente e usuários quando o dialog abrir
  React.useEffect(() => {
    const fetchTiposExpediente = async () => {
      setLoadingTipos(true);
      try {
        const response = await fetch('/api/tipos-expedientes?limite=100');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao buscar tipos de expediente');
        }
        setTiposExpediente(result.data.tipos_expedientes || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tipos de expediente';
        console.error('Erro ao buscar tipos de expediente:', err);
        setError(errorMessage);
      } finally {
        setLoadingTipos(false);
      }
    };

    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const response = await fetch('/api/usuarios?limite=100&ativo=true');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao buscar usuários');
        }
        setUsuarios(result.data?.usuarios || []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários';
        console.error('Erro ao buscar usuários:', err);
        setError(errorMessage);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    if (open) {
      if (tiposExpediente.length === 0) {
        fetchTiposExpediente();
      }
      if (usuarios.length === 0) {
        fetchUsuarios();
      }
    }
  }, [open, tiposExpediente.length, usuarios.length]);

  // Resetar form quando fechar
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setTrt('');
    setGrau('');
    setProcessoId([]);
    setTipoExpedienteId('');
    setDescricao('');
    setDataPrazo('');
    setHoraPrazo('');
    setResponsavelId('');
    setError(null);
  };

  const buscarProcessos = async (trtValue: string, grauValue: string) => {
    setLoadingProcessos(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        trt: trtValue,
        grau: grauValue,
        limite: '100',
      });

      const response = await fetch(`/api/acervo?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar processos');
      }

      setProcessos(result.data.processos || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar processos';
      console.error('Erro ao buscar processos:', err);
      setError(errorMessage);
      setProcessos([]);
    } finally {
      setLoadingProcessos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    const processoIdFinal = modoProcessoDefinido ? dadosIniciais?.processo_id : (processoId.length > 0 ? parseInt(processoId[0]) : null);
    
    if (!processoIdFinal) {
      setError('Selecione um processo');
      return;
    }

    if (!descricao.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        processo_id: processoIdFinal,
        descricao: descricao.trim(),
      };

      if (tipoExpedienteId) {
        payload.tipo_expediente_id = parseInt(tipoExpedienteId);
      }

      if (dataPrazo && horaPrazo) {
        const dataHora = `${dataPrazo}T${horaPrazo}:00`;
        payload.data_prazo_legal = new Date(dataHora).toISOString();
      }

      if (responsavelId) {
        payload.responsavel_id = parseInt(responsavelId);
      }

      const response = await fetch('/api/expedientes-manuais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao criar expediente');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar expediente';
      console.error('Erro ao criar expediente:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Opções para Combobox de processos
  const processosOptions: ComboboxOption[] = processos.map((p) => ({
    value: p.id.toString(),
    label: p.numero_processo,
    searchText: `${p.numero_processo} ${p.polo_ativo_nome} ${p.polo_passivo_nome}`,
  }));

  // Opções para Combobox de responsáveis
  const usuariosOptions: ComboboxOption[] = usuarios.map((u) => ({
    value: u.id.toString(),
    label: u.nomeExibicao,
    searchText: u.nomeExibicao,
  }));

  // Layout quando há dados iniciais (processo já definido)
  if (modoProcessoDefinido && dadosIniciais) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Novo Expediente Manual
            </DialogTitle>
            <DialogDescription>
              Criar expediente vinculado ao processo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Erro geral */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Header com informações do processo */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {dadosIniciais.trt}
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      {formatarGrau(dadosIniciais.grau)}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">{dadosIniciais.numero_processo}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Parte Autora</div>
                  <div className="font-medium">{dadosIniciais.polo_ativo_nome || '-'}</div>
                  <div className="text-muted-foreground mt-2">Parte Ré</div>
                  <div className="font-medium">{dadosIniciais.polo_passivo_nome || '-'}</div>
                </div>
              </div>
            </div>

            {/* Campos do expediente em duas colunas */}
            <div className="grid grid-cols-2 gap-6">
              {/* Coluna esquerda */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Expediente</Label>
                  <Select
                    value={tipoExpedienteId}
                    onValueChange={setTipoExpedienteId}
                    disabled={isLoading || loadingTipos}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecione o tipo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposExpediente.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.tipo_expediente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Responsável
                  </Label>
                  {loadingUsuarios ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando usuários...</span>
                    </div>
                  ) : (
                    <Combobox
                      options={usuariosOptions}
                      value={responsavelId ? [responsavelId] : []}
                      onValueChange={(values) => setResponsavelId(values[0] || '')}
                      placeholder="Selecione o responsável (opcional)"
                      searchPlaceholder="Buscar por nome..."
                      emptyText="Nenhum usuário encontrado"
                      disabled={isLoading}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Prazo
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <FormDatePicker
                      id="dataPrazo"
                      value={dataPrazo || undefined}
                      onChange={(v) => setDataPrazo(v || '')}
                      className="h-10"
                    />
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="horaPrazo"
                        type="time"
                        value={horaPrazo}
                        onChange={(e) => setHoraPrazo(e.target.value)}
                        disabled={isLoading || !dataPrazo}
                        className="h-10 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna direita */}
              <div className="space-y-2">
                <Label htmlFor="descricao" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o expediente em detalhes..."
                  disabled={isLoading}
                  className="h-[180px] resize-none"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Informe detalhes sobre o expediente a ser realizado.
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !descricao.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Criar Expediente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Layout padrão quando não há dados iniciais (seleção manual de processo)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Expediente Manual
          </DialogTitle>
          <DialogDescription>
            Criar um expediente manual vinculado a um processo existente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erro geral */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Etapa 1: Selecionar TRT e Grau */}
          <Card className={cn(trt && grau ? 'border-primary/20' : '')}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  trt && grau
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {trt && grau ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                </div>
                <h3 className="text-sm font-medium">Selecione o Tribunal e Grau</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trt" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    TRT
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select value={trt} onValueChange={setTrt} disabled={isLoading}>
                    <SelectTrigger id="trt" className="h-10">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grau" className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    Grau
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select value={grau} onValueChange={setGrau} disabled={isLoading}>
                    <SelectTrigger id="grau" className="h-10">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etapa 2: Selecionar Processo */}
          {trt && grau && (
            <Card className={cn(processoSelecionado ? 'border-primary/20' : '')}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                    processoSelecionado
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {processoSelecionado ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                  </div>
                  <h3 className="text-sm font-medium">Selecione o Processo</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processo" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Processo
                    <span className="text-destructive">*</span>
                  </Label>
                  {loadingProcessos ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando processos...</span>
                    </div>
                  ) : processos.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhum processo encontrado para {trt} - {grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Combobox
                        options={processosOptions}
                        value={processoId}
                        onValueChange={setProcessoId}
                        placeholder="Buscar por número, parte autora ou ré..."
                        searchPlaceholder="Digite para buscar..."
                        emptyText="Nenhum processo encontrado"
                        disabled={isLoading}
                      />
                      {processoSelecionado && (
                        <div className="mt-3 p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Processo selecionado
                          </div>
                          <div className="text-lg font-semibold mb-2">
                            {processoSelecionado.numero_processo}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Parte Autora:</span>
                              <div className="font-medium truncate">{processoSelecionado.polo_ativo_nome || '-'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Parte Ré:</span>
                              <div className="font-medium truncate">{processoSelecionado.polo_passivo_nome || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Etapa 3: Dados do Expediente */}
          {processoSelecionado && (
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    3
                  </div>
                  <h3 className="text-sm font-medium">Dados do Expediente</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo" className="flex items-center gap-2">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                    Tipo de Expediente
                  </Label>
                  {loadingTipos ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando tipos...</span>
                    </div>
                  ) : (
                    <Select
                      value={tipoExpedienteId}
                      onValueChange={setTipoExpedienteId}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="tipo" className="h-10">
                        <SelectValue placeholder="Selecione o tipo (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposExpediente.map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>
                            {tipo.tipo_expediente}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Descrição
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o expediente em detalhes..."
                    disabled={isLoading}
                    rows={4}
                    required
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Prazo
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <FormDatePicker
                      id="dataPrazo"
                      value={dataPrazo || undefined}
                      onChange={(v) => setDataPrazo(v || '')}
                      className="h-10"
                    />
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="horaPrazo"
                        type="time"
                        value={horaPrazo}
                        onChange={(e) => setHoraPrazo(e.target.value)}
                        disabled={isLoading || !dataPrazo}
                        className="h-10 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Responsável
                  </Label>
                  {loadingUsuarios ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Carregando usuários...</span>
                    </div>
                  ) : (
                    <Combobox
                      options={usuariosOptions}
                      value={responsavelId ? [responsavelId] : []}
                      onValueChange={(values) => setResponsavelId(values[0] || '')}
                      placeholder="Selecione o responsável (opcional)"
                      searchPlaceholder="Buscar por nome..."
                      emptyText="Nenhum usuário encontrado"
                      disabled={isLoading}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-2" />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !processoSelecionado || !descricao.trim()}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Criar Expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
