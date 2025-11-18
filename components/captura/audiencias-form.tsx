'use client';

import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarAudiencias } from '@/lib/api/captura';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function AudienciasForm() {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
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
      } = {
        advogado_id: advogadoId,
        credencial_ids: credenciaisSelecionadas,
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
          capture_id: (response as any).capture_id,
        });
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
        {/* Data Início */}
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data Início (opcional)</Label>
          <Input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Se não informada, será usada a data de hoje
          </p>
        </div>

        {/* Data Fim */}
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data Fim (opcional)</Label>
          <Input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Se não informada, será usada hoje + 365 dias
          </p>
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
