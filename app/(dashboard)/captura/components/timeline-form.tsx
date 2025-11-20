'use client';

import { useState } from 'react';
import { CapturaFormBase, validarCamposCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarTimeline, type TimelineParams, type FiltroDocumentosTimeline } from '@/lib/api/captura';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

/**
 * Componente de formulário para captura de timeline de processo
 *
 * Permite capturar a timeline completa (movimentos e documentos) de um processo específico,
 * com opções de download de documentos e filtros avançados.
 *
 * @example
 * ```tsx
 * <TimelineForm />
 * ```
 */
export function TimelineForm() {
  // Estados do formulário base
  const [advogadoId, setAdvogadoId] = useState<number | null>(null);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);

  // Estados específicos da timeline
  const [processoId, setProcessoId] = useState('');
  const [baixarDocumentos, setBaixarDocumentos] = useState(true);

  // Estados dos filtros avançados
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [apenasAssinados, setApenasAssinados] = useState(true);
  const [apenasNaoSigilosos, setApenasNaoSigilosos] = useState(true);
  const [tiposDocumento, setTiposDocumento] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
  }>({ success: null });

  /**
   * Handler para iniciar captura de timeline
   */
  const handleCaptura = async () => {
    // Validar campos obrigatórios
    if (!validarCamposCaptura(advogadoId, credenciaisSelecionadas)) {
      setResult({
        success: false,
        error: 'Selecione um advogado e pelo menos uma credencial',
      });
      return;
    }

    if (!processoId.trim()) {
      setResult({
        success: false,
        error: 'Informe o número do processo',
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
      // Buscar credencial para obter TRT e grau
      // Por enquanto, vamos usar a primeira credencial da lista
      // TODO: Implementar lógica para buscar detalhes da credencial
      // Por hora, vamos assumir que temos essa informação

      // Montar filtro de documentos (apenas se baixar documentos estiver habilitado)
      let filtroDocumentos: FiltroDocumentosTimeline | undefined;

      if (baixarDocumentos) {
        filtroDocumentos = {
          apenasAssinados,
          apenasNaoSigilosos,
        };

        // Adicionar tipos se especificado
        if (tiposDocumento.trim()) {
          filtroDocumentos.tipos = tiposDocumento
            .split(',')
            .map((tipo) => tipo.trim())
            .filter((tipo) => tipo.length > 0);
        }

        // Adicionar datas se especificado
        if (dataInicial) {
          filtroDocumentos.dataInicial = new Date(dataInicial).toISOString();
        }
        if (dataFinal) {
          filtroDocumentos.dataFinal = new Date(dataFinal).toISOString();
        }
      }

      // Construir parâmetros
      // NOTA: Como precisamos do trtCodigo e grau da credencial,
      // vamos precisar fazer uma chamada para buscar esses detalhes
      // Por enquanto, vou deixar hardcoded para TRT3 primeiro grau
      // TODO: Implementar busca de detalhes da credencial
      const params: TimelineParams = {
        processoId: processoId.trim(),
        trtCodigo: 'TRT3', // TODO: Obter da credencial
        grau: 'primeiro_grau', // TODO: Obter da credencial
        advogadoId,
        baixarDocumentos,
        filtroDocumentos,
      };

      const response = await capturarTimeline(params);

      if (!response.success) {
        setResult({
          success: false,
          error: response.error || 'Erro ao capturar timeline',
        });
      } else {
        setResult({
          success: true,
          data: response.data,
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
        {/* Campos específicos da timeline */}
        <div className="space-y-3">
          <Label htmlFor="processo-id">Número do Processo *</Label>
          <Input
            id="processo-id"
            placeholder="Ex: 2887163"
            value={processoId}
            onChange={(e) => setProcessoId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="baixar-documentos"
            checked={baixarDocumentos}
            onCheckedChange={(checked) => setBaixarDocumentos(checked === true)}
            disabled={isLoading}
          />
          <Label
            htmlFor="baixar-documentos"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Baixar documentos (PDFs)
          </Label>
        </div>

        {/* Filtros Avançados (apenas se baixar documentos) */}
        {baixarDocumentos && (
          <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  filtrosAbertos ? 'rotate-180' : ''
                }`}
              />
              Filtros Avançados
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apenas-assinados"
                  checked={apenasAssinados}
                  onCheckedChange={(checked) => setApenasAssinados(checked === true)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="apenas-assinados"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Apenas documentos assinados
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apenas-nao-sigilosos"
                  checked={apenasNaoSigilosos}
                  onCheckedChange={(checked) => setApenasNaoSigilosos(checked === true)}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="apenas-nao-sigilosos"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Apenas documentos não sigilosos
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipos-documento" className="text-sm">
                  Tipos de Documento (separados por vírgula)
                </Label>
                <Input
                  id="tipos-documento"
                  placeholder="Ex: Certidão, Petição, Sentença"
                  value={tiposDocumento}
                  onChange={(e) => setTiposDocumento(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data-inicial" className="text-sm">
                    Data Inicial
                  </Label>
                  <Input
                    id="data-inicial"
                    type="date"
                    value={dataInicial}
                    onChange={(e) => setDataInicial(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-final" className="text-sm">
                    Data Final
                  </Label>
                  <Input
                    id="data-final"
                    type="date"
                    value={dataFinal}
                    onChange={(e) => setDataFinal(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CapturaFormBase>

      <CapturaButton isLoading={isLoading} onClick={handleCaptura}>
        Iniciar Captura de Timeline
      </CapturaButton>

      <CapturaResult
        success={result.success}
        error={result.error}
        data={result.data as any}
      />
    </div>
  );
}
