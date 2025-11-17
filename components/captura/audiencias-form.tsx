'use client';

import { CapturaFormBase, validarCamposBase } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarAudiencias } from '@/lib/api/captura';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function AudienciasForm() {
  const [advogadoId, setAdvogadoId] = useState<number | ''>('');
  const [trtCodigo, setTrtCodigo] = useState<CodigoTRT | ''>('');
  const [grau, setGrau] = useState<GrauTRT | ''>('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
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
      const params: {
        advogado_id: number;
        trt_codigo: CodigoTRT;
        grau: GrauTRT;
        dataInicio?: string;
        dataFim?: string;
      } = {
        advogado_id: advogadoId as number,
        trt_codigo: trtCodigo as CodigoTRT,
        grau: grau as GrauTRT,
      };

      if (dataInicio) {
        params.dataInicio = dataInicio;
      }
      if (dataFim) {
        params.dataFim = dataFim;
      }

      const response = await capturarAudiencias(params);

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
        data={result.data as CapturaResult['data']}
      />
    </div>
  );
}

