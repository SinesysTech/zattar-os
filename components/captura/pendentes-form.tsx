'use client';

import { CapturaFormBase, validarCamposBase } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarPendentes, FILTROS_PRAZO } from '@/lib/api/captura';
import type { CodigoTRT, GrauTRT, FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PendentesForm() {
  const [advogadoId, setAdvogadoId] = useState<number | ''>('');
  const [trtCodigo, setTrtCodigo] = useState<CodigoTRT | ''>('');
  const [grau, setGrau] = useState<GrauTRT | ''>('');
  const [filtroPrazo, setFiltroPrazo] = useState<FiltroPrazoPendentes>('sem_prazo');
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
      const params = {
        advogado_id: advogadoId as number,
        trt_codigo: trtCodigo as CodigoTRT,
        grau: grau as GrauTRT,
        filtroPrazo,
      };

      const response = await capturarPendentes(params);

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
        {/* Filtro de Prazo */}
        <div className="space-y-2">
          <Label htmlFor="filtroPrazo">Filtro de Prazo</Label>
          <Select
            value={filtroPrazo}
            onValueChange={(value) => setFiltroPrazo(value as FiltroPrazoPendentes)}
          >
            <SelectTrigger id="filtroPrazo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTROS_PRAZO.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Padrão: Sem Prazo (processos sem prazo definido)
          </p>
        </div>
      </CapturaFormBase>

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Pendências
      </CapturaButton>

      <CapturaResult
        success={result.success}
        error={result.error}
        data={result.data as CapturaResult['data']}
      />
    </div>
  );
}

