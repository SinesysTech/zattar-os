'use client';

import { CapturaFormBase, validarCamposCaptura, gerarCombinacoesCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarAudiencias, listarCredenciais, type CredencialDisponivel } from '@/lib/api/captura';
import type { CodigoTRT, GrauTRT } from '@/backend/types/captura/trt-types';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function AudienciasForm() {
  const [credenciais, setCredenciais] = useState<CredencialDisponivel[]>([]);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [tribunaisDisponiveis, setTribunaisDisponiveis] = useState<CodigoTRT[]>([]);
  const [grausDisponiveis, setGrausDisponiveis] = useState<GrauTRT[]>([]);
  const [tribunaisSelecionados, setTribunaisSelecionados] = useState<CodigoTRT[]>([]);
  const [grausSelecionados, setGrausSelecionados] = useState<GrauTRT[]>([]);
  const [todosTribunais, setTodosTribunais] = useState(false);
  const [todosGraus, setTodosGraus] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCredenciais, setIsLoadingCredenciais] = useState(true);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
    data?: unknown;
  }>({ success: null });

  useEffect(() => {
    const carregarCredenciais = async () => {
      setIsLoadingCredenciais(true);
      const response = await listarCredenciais();
      if (response.success && response.data) {
        setCredenciais(response.data.credenciais);
        setTribunaisDisponiveis(response.data.tribunais_disponiveis);
        setGrausDisponiveis(response.data.graus_disponiveis);
      } else {
        setResult({ success: false, error: response.error || 'Erro ao carregar credenciais' });
      }
      setIsLoadingCredenciais(false);
    };
    carregarCredenciais();
  }, []);

  const handleCaptura = async () => {
    if (!validarCamposCaptura(credenciaisSelecionadas, tribunaisSelecionados, grausSelecionados, todosTribunais, todosGraus)) {
      setResult({ success: false, error: 'Selecione pelo menos uma credencial, tribunal e grau' });
      return;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      const combinacoes = gerarCombinacoesCaptura(
        credenciais,
        credenciaisSelecionadas,
        tribunaisSelecionados,
        grausSelecionados,
        todosTribunais,
        todosGraus
      );

      if (combinacoes.length === 0) {
        setResult({ success: false, error: 'Nenhuma combinação válida encontrada' });
        setIsLoading(false);
        return;
      }

      // Para audiências, executar uma por vez (não em paralelo)
      const resultados = [];
      for (const combo of combinacoes) {
        const params: {
          advogado_id: number;
          trt_codigo: CodigoTRT;
          grau: GrauTRT;
          dataInicio?: string;
          dataFim?: string;
        } = { ...combo };

        if (dataInicio) params.dataInicio = dataInicio;
        if (dataFim) params.dataFim = dataFim;

        const response = await capturarAudiencias(params);
        resultados.push(response);
      }

      const sucessos = resultados.filter((r) => r.success);
      const falhas = resultados.filter((r) => !r.success);

      if (sucessos.length === 0) {
        const primeiroErro = falhas[0];
        setResult({ success: false, error: primeiroErro.error || 'Erro desconhecido' });
      } else {
        const dadosAgregados = sucessos.reduce(
          (acc, r) => {
            if (r.data) {
              const data = r.data;
              acc.total = (acc.total || 0) + (data.total || 0);
              acc.persistencia = {
                total: (acc.persistencia?.total || 0) + (data.persistencia?.total || 0),
                atualizados: (acc.persistencia?.atualizados || 0) + (data.persistencia?.atualizados || 0),
                erros: (acc.persistencia?.erros || 0) + (data.persistencia?.erros || 0),
                orgaosJulgadoresCriados: (acc.persistencia?.orgaosJulgadoresCriados || 0) + (data.persistencia?.orgaosJulgadoresCriados || 0),
              };
            }
            return acc;
          },
          { total: 0, persistencia: { total: 0, atualizados: 0, erros: 0, orgaosJulgadoresCriados: 0 } } as {
            total: number;
            persistencia: { total: number; atualizados: number; erros: number; orgaosJulgadoresCriados: number };
          }
        );

        setResult({
          success: true,
          data: {
            ...dadosAgregados,
            dataInicio: dataInicio || undefined,
            dataFim: dataFim || undefined,
            combinacoes_executadas: sucessos.length,
            combinacoes_falhadas: falhas.length,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setResult({ success: false, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCredenciais) {
    return <div className="text-sm text-muted-foreground">Carregando credenciais...</div>;
  }

  return (
    <div className="space-y-6">
      <CapturaFormBase
        credenciais={credenciais}
        credenciaisSelecionadas={credenciaisSelecionadas}
        tribunaisDisponiveis={tribunaisDisponiveis}
        grausDisponiveis={grausDisponiveis}
        tribunaisSelecionados={tribunaisSelecionados}
        grausSelecionados={grausSelecionados}
        todosTribunais={todosTribunais}
        todosGraus={todosGraus}
        onCredenciaisChange={setCredenciaisSelecionadas}
        onTribunaisChange={(tribunais, todos) => {
          setTribunaisSelecionados(tribunais);
          setTodosTribunais(todos);
        }}
        onGrausChange={(graus, todos) => {
          setGrausSelecionados(graus);
          setTodosGraus(todos);
        }}
        permiteMultiplaSelecao={false}
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

      <CapturaResult success={result.success} error={result.error} data={result.data} />
    </div>
  );
}
