'use client';

// Componente de diálogo para criar novo expediente manual

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NovoExpedienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

interface Usuario {
  id: number;
  nome_exibicao: string;
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

export function NovoExpedienteDialog({
  open,
  onOpenChange,
  onSuccess,
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

  // Processo selecionado
  const processoSelecionado = React.useMemo(() => {
    if (processoId.length === 0) return null;
    return processos.find((p) => p.id.toString() === processoId[0]) || null;
  }, [processoId, processos]);

  // Buscar processos quando TRT e Grau forem selecionados
  React.useEffect(() => {
    if (trt && grau) {
      buscarProcessos(trt, grau);
    } else {
      setProcessos([]);
      setProcessoId([]);
    }
  }, [trt, grau]);

  // Buscar tipos de expediente e usuários quando o dialog abrir
  React.useEffect(() => {
    if (open) {
      if (tiposExpediente.length === 0) {
        buscarTiposExpediente();
      }
      if (usuarios.length === 0) {
        buscarUsuarios();
      }
    }
  }, [open]);

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
    } catch (err: any) {
      console.error('Erro ao buscar processos:', err);
      setError(err.message || 'Erro ao buscar processos');
      setProcessos([]);
    } finally {
      setLoadingProcessos(false);
    }
  };

  const buscarTiposExpediente = async () => {
    setLoadingTipos(true);

    try {
      const response = await fetch('/api/tipos-expedientes?limite=100');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar tipos de expediente');
      }

      setTiposExpediente(result.data.tipos_expedientes || []);
    } catch (err: any) {
      console.error('Erro ao buscar tipos de expediente:', err);
      setError(err.message || 'Erro ao buscar tipos de expediente');
    } finally {
      setLoadingTipos(false);
    }
  };

  const buscarUsuarios = async () => {
    setLoadingUsuarios(true);

    try {
      const response = await fetch('/api/usuarios?limite=100');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar usuários');
      }

      setUsuarios(result.data.usuarios || []);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!processoId || processoId.length === 0) {
      setError('Selecione um processo');
      return;
    }

    if (!descricao.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        processo_id: parseInt(processoId[0]),
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
    } catch (err: any) {
      console.error('Erro ao criar expediente:', err);
      setError(err.message || 'Erro ao criar expediente');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Expediente Manual</DialogTitle>
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
          <div className="space-y-4">
            <h3 className="text-sm font-medium">1. Selecione o Tribunal e Grau</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trt">TRT *</Label>
                <Select value={trt} onValueChange={setTrt} disabled={isLoading}>
                  <SelectTrigger id="trt">
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
                <Label htmlFor="grau">Grau *</Label>
                <Select value={grau} onValueChange={setGrau} disabled={isLoading}>
                  <SelectTrigger id="grau">
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
          </div>

          {/* Etapa 2: Selecionar Processo */}
          {trt && grau && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">2. Selecione o Processo</h3>

              <div className="space-y-2">
                <Label htmlFor="processo">Processo *</Label>
                {loadingProcessos ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando processos...
                  </div>
                ) : processos.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    Nenhum processo encontrado para {trt} - {grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                  </div>
                ) : (
                  <>
                    <Combobox
                      options={processosOptions}
                      value={processoId}
                      onValueChange={setProcessoId}
                      placeholder="Buscar por número, parte autora ou ré..."
                      disabled={isLoading}
                    />
                    {processoSelecionado && (
                      <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                        <div className="font-medium">Processo selecionado:</div>
                        <div className="mt-1">
                          <strong>Número:</strong> {processoSelecionado.numero_processo}
                        </div>
                        <div>
                          <strong>Parte Autora:</strong> {processoSelecionado.polo_ativo_nome}
                        </div>
                        <div>
                          <strong>Parte Ré:</strong> {processoSelecionado.polo_passivo_nome}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Etapa 3: Dados do Expediente */}
          {processoSelecionado && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">3. Dados do Expediente</h3>

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
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva o expediente..."
                  disabled={isLoading}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataPrazo">Data do Prazo</Label>
                  <Input
                    id="dataPrazo"
                    type="date"
                    value={dataPrazo}
                    onChange={(e) => setDataPrazo(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaPrazo">Hora do Prazo</Label>
                  <Input
                    id="horaPrazo"
                    type="time"
                    value={horaPrazo}
                    onChange={(e) => setHoraPrazo(e.target.value)}
                    disabled={isLoading || !dataPrazo}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Select
                  value={responsavelId}
                  onValueChange={setResponsavelId}
                  disabled={isLoading || loadingUsuarios}
                >
                  <SelectTrigger id="responsavel">
                    <SelectValue placeholder="Selecione o responsável (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nome_exibicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
