'use client';

import { useMemo, useState } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarPartes, GRAUS, TRT_CODIGOS, type CapturaPartesParams } from '@/app/api/captura/captura';
import type { CodigoTRT, GrauTRT } from '@/app/_lib/types/credenciais';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const parseListaProcessos = (value: string): string[] => {
  if (!value) return [];

  const items = value
    .split(/[\n,;]+/)
    .map((item) => item.trim().replace(/\s+/g, ''))
    .filter((item) => item.length > 0);

  return Array.from(new Set(items));
};

const normalizeNumeroProcesso = (value: string): string => value.trim().replace(/\s+/g, '');

export function PartesForm() {
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [trtsSelecionados, setTrtsSelecionados] = useState<CodigoTRT[]>([]);
  const [grausSelecionados, setGrausSelecionados] = useState<GrauTRT[]>([]);
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [numerosProcessoTexto, setNumerosProcessoTexto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
    capture_id?: number;
  }>({ success: null });

  const numerosProcesso = useMemo(() => parseListaProcessos(numerosProcessoTexto), [numerosProcessoTexto]);
  const numeroProcessoUnico = useMemo(() => normalizeNumeroProcesso(numeroProcesso), [numeroProcesso]);
  const totalProcessosManuais = useMemo(() => {
    const extras = numeroProcessoUnico ? 1 : 0;
    const conjunto = new Set(numerosProcesso);
    if (numeroProcessoUnico) {
      conjunto.add(numeroProcessoUnico);
    }
    return conjunto.size;
  }, [numerosProcesso, numeroProcessoUnico]);

  const toggleValor = <T,>(lista: T[], valor: T, ativo: boolean): T[] => {
    if (ativo) {
      if (lista.includes(valor)) return lista;
      return [...lista, valor];
    }
    return lista.filter((item) => item !== valor);
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

    const possuiFiltros =
      trtsSelecionados.length > 0 ||
      grausSelecionados.length > 0 ||
      totalProcessosManuais > 0;

    if (!possuiFiltros) {
      setResult({
        success: false,
        error: 'Selecione pelo menos um TRT, um grau ou informe números de processo para iniciar a captura.',
      });
      return;
    }

    const payload: CapturaPartesParams = {
      advogado_id: advogadoId,
      credencial_ids: credenciaisSelecionadas,
    };

    if (trtsSelecionados.length > 0) {
      payload.trts = trtsSelecionados;
    }
    if (grausSelecionados.length > 0) {
      payload.graus = grausSelecionados;
    }
    if (numeroProcessoUnico) {
      payload.numero_processo = numeroProcessoUnico;
    }
    if (numerosProcesso.length > 0) {
      payload.numeros_processo = numerosProcesso;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      const response = await capturarPartes(payload);

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
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Tribunais (TRT)</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {TRT_CODIGOS.map((codigo) => (
                <label
                  key={codigo}
                  className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={trtsSelecionados.includes(codigo)}
                    onCheckedChange={(checked) =>
                      setTrtsSelecionados((prev) => toggleValor(prev, codigo, checked === true))
                    }
                  />
                  <span>{codigo}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Use os filtros acima para capturar todas as partes dos processos pertencentes aos TRTs selecionados.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Graus</Label>
            <div className="flex flex-wrap gap-3">
              {GRAUS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={grausSelecionados.includes(value)}
                    onCheckedChange={(checked) =>
                      setGrausSelecionados((prev) => toggleValor(prev, value, checked === true))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Combine grau com TRT para restringir os processos capturados. Se nenhum grau for selecionado, ambos serão considerados.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numeroProcesso">Número do processo (único)</Label>
            <Input
              id="numeroProcesso"
              placeholder="0012345-67.2024.5.03.0001"
              value={numeroProcesso}
              onChange={(event) => setNumeroProcesso(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Utilize este campo para capturar as partes de um processo específico.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numerosLista">Lista de processos</Label>
            <Textarea
              id="numerosLista"
              placeholder="Cole um número por linha ou separados por vírgula"
              rows={4}
              value={numerosProcessoTexto}
              onChange={(event) => setNumerosProcessoTexto(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Aceita múltiplos números de processos. Espaços e duplicados são ignorados automaticamente.
            </p>
            {totalProcessosManuais > 0 && (
              <p className="text-xs text-muted-foreground">
                Processos especificados manualmente: <span className="font-medium">{totalProcessosManuais}</span>
              </p>
            )}
          </div>
        </div>
      </CapturaFormBase>

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Partes
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
