'use client';

import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarAcervoGeral } from '@/lib/api/captura';
import { useState } from 'react';

export function AcervoGeralForm() {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
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
      const response = await capturarAcervoGeral({
        advogado_id: advogadoId,
        credencial_ids: credenciaisSelecionadas,
      });

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
      />

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Acervo Geral
      </CapturaButton>

      <CapturaResult
        success={result.success}
        error={result.error}
        data={result.data as any}
        captureId={result.capture_id}
      />
    </div>
  );
}
