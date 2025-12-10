'use client';

import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarAudiencias } from '@/core/app/api/captura/captura';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_AUDIENCIA_OPTIONS } from '@/core/app/api/audiencias/audiencias';

interface AudienciasFormProps {
  onSuccess?: () => void;
}

export function AudienciasForm({ onSuccess }: AudienciasFormProps) {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [status, setStatus] = useState<'M' | 'C' | 'F'>('M');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
    capture_id?: number;
  }>({ success: null });

  const handleCaptura = async () => {
    if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
      setResult({
        success: false,
        error: 'Selecione um advogado e pelo menos uma credencial',
      });
      return;
    }

    if (!advogadoId) {
      setResult({ success: false, error: 'Advogado não selecionado' });
      return;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      const params: {
        advogado_id: number;
        credencial_ids: number[];
        dataInicio?: string;
        dataFim?: string;
        status?: 'M' | 'C' | 'F';
      } = {
        advogado_id: advogadoId,
        credencial_ids: credenciaisSelecionadas,
        status,
      };

      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;

      const response = await capturarAudiencias(params);

      if (!response.success) {
        setResult({
          success: false,
          error: response.error || 'Erro ao iniciar captura',
        });
      } else {
        setResult({
          success: true,
          data: response.data,
          capture_id: response.capture_id,
        });
        onSuccess?.();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({ success: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <CapturaFormBase
        advogadoId={advogadoId}
        credenciaisSelecionadas={credenciaisSelecionadas}
        onAdvogadoChange={setAdvogadoId}
        onCredenciaisChange={setCredenciaisSelecionadas}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="status">Status da Audiência</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as 'M' | 'C' | 'F')}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_AUDIENCIA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Selecione o status das audiências que deseja capturar
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data Início (opcional)</Label>
          <FormDatePicker
            id="dataInicio"
            value={dataInicio || undefined}
            onChange={(v) => setDataInicio(v || '')}
          />
          <p className="text-sm text-muted-foreground">
            Se não informada, será usada a data de hoje
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataFim">Data Fim (opcional)</Label>
          <FormDatePicker
            id="dataFim"
            value={dataFim || undefined}
            onChange={(v) => setDataFim(v || '')}
          />
          <p className="text-sm text-muted-foreground">
            Se não informada, será usada hoje + 365 dias
          </p>
        </div>
        </div>
      </CapturaFormBase>

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Audiências
      </CapturaButton>

      <CapturaResult
        success={result.success}
        error={result.error}
        data={result.data}
        captureId={result.capture_id}
      />
    </div>
  );
}
