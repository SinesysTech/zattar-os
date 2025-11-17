'use client';

import { CapturaFormBase, validarCamposBase } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarArquivados } from '@/lib/api/captura';
import type { BaseCapturaTRTParams, CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { useState } from 'react';

export function ArquivadosForm() {
  const [advogadoId, setAdvogadoId] = useState<number | ''>('');
  const [trtCodigo, setTrtCodigo] = useState<CodigoTRT | ''>('');
  const [grau, setGrau] = useState<GrauTRT | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
  }>({ success: null });

  const handleCaptura = async () => {
    if (!validarCamposBase(advogadoId, trtCodigo, grau)) {
      setResult({ success: false, error: 'Preencha todos os campos obrigatórios' });
      return;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      const params: BaseCapturaTRTParams = {
        advogado_id: advogadoId as number,
        trt_codigo: trtCodigo as CodigoTRT,
        grau: grau as GrauTRT,
      };

      const response = await capturarArquivados(params);

      if (response.success) {
        setResult({ success: true, data: response.data });
      } else {
        setResult({ success: false, error: response.error });
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
        trtCodigo={trtCodigo}
        grau={grau}
        onAdvogadoIdChange={setAdvogadoId}
        onTrtCodigoChange={setTrtCodigo}
        onGrauChange={setGrau}
      />

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Arquivados
      </CapturaButton>

      <CapturaResult
        success={result.success}
        error={result.error}
        data={result.data as CapturaResult['data']}
      />
    </div>
  );
}

