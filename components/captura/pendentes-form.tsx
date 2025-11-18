'use client';

import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarPendentes, FILTROS_PRAZO } from '@/lib/api/captura';
import type { FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
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
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [filtroPrazo, setFiltroPrazo] = useState<FiltroPrazoPendentes>('sem_prazo');
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
      const response = await capturarPendentes({
        advogado_id: advogadoId,
        credencial_ids: credenciaisSelecionadas,
        filtroPrazo,
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
        Iniciar Captura de Expedientes
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
