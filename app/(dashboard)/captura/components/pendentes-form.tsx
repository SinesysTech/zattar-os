'use client';

import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarPendentes, FILTROS_PRAZO } from '@/app/api/captura/captura';
import type { FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const ORDEM_FILTROS: FiltroPrazoPendentes[] = ['sem_prazo', 'no_prazo'];

export function PendentesForm() {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [filtrosPrazo, setFiltrosPrazo] = useState<FiltroPrazoPendentes[]>(ORDEM_FILTROS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
    capture_id?: number;
  }>({ success: null });

  const toggleFiltroPrazo = (valor: FiltroPrazoPendentes) => {
    setFiltrosPrazo((prev) => {
      const jaSelecionado = prev.includes(valor);

      if (jaSelecionado && prev.length === 1) {
        return prev;
      }

      const atualizado = jaSelecionado
        ? prev.filter((f) => f !== valor)
        : [...prev, valor];

      return atualizado.sort(
        (a, b) => ORDEM_FILTROS.indexOf(a) - ORDEM_FILTROS.indexOf(b)
      );
    });
  };

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
        filtrosPrazo,
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
          <Label htmlFor="filtroPrazo">Filtros de Prazo</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FILTROS_PRAZO.map((opcao) => (
              <label
                key={opcao.value}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <Checkbox
                  id={`filtro-${opcao.value}`}
                  checked={filtrosPrazo.includes(opcao.value)}
                  onCheckedChange={() => toggleFiltroPrazo(opcao.value)}
                />
                <span className="flex-1">{opcao.label}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Os filtros selecionados são executados sequencialmente: primeiro Sem Prazo e,
            em seguida, No Prazo.
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
