'use client';

import { CapturaFormBase, validarCamposCaptura, gerarCombinacoesCaptura } from './captura-form-base';
import { CapturaButton } from './captura-button';
import { CapturaResult } from './captura-result';
import { capturarPendentes, listarCredenciais, FILTROS_PRAZO, type CredencialDisponivel } from '@/lib/api/captura';
import type { CodigoTRT, GrauTRT, FiltroPrazoPendentes } from '@/backend/types/captura/trt-types';
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PendentesForm() {
  const [credenciais, setCredenciais] = useState<CredencialDisponivel[]>([]);
  const [credenciaisSelecionadas, setCredenciaisSelecionadas] = useState<number[]>([]);
  const [tribunaisDisponiveis, setTribunaisDisponiveis] = useState<CodigoTRT[]>([]);
  const [grausDisponiveis, setGrausDisponiveis] = useState<GrauTRT[]>([]);
  const [tribunaisSelecionados, setTribunaisSelecionados] = useState<CodigoTRT[]>([]);
  const [grausSelecionados, setGrausSelecionados] = useState<GrauTRT[]>([]);
  const [todosTribunais, setTodosTribunais] = useState(false);
  const [todosGraus, setTodosGraus] = useState(false);
  const [filtroPrazo, setFiltroPrazo] = useState<FiltroPrazoPendentes>('sem_prazo');
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

      // Executar capturas em paralelo
      const resultados = await Promise.allSettled(
        combinacoes.map((combo) =>
          capturarPendentes({
            ...combo,
            filtroPrazo,
          })
        )
      );

      const sucessos = resultados.filter((r) => r.status === 'fulfilled' && r.value.success);
      const falhas = resultados.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

      if (sucessos.length === 0) {
        const primeiroErro = falhas[0];
        const erroMsg =
          primeiroErro.status === 'rejected'
            ? primeiroErro.reason?.message || 'Erro desconhecido'
            : primeiroErro.value.error || 'Erro desconhecido';
        setResult({ success: false, error: `Todas as capturas falharam. Primeiro erro: ${erroMsg}` });
      } else {
        const dadosAgregados = sucessos.reduce(
          (acc, r) => {
            if (r.status === 'fulfilled' && r.value.data) {
              const data = r.value.data;
              acc.total = (acc.total || 0) + (data.total || 0);
              acc.persistencia = {
                total: (acc.persistencia?.total || 0) + (data.persistencia?.total || 0),
                atualizados: (acc.persistencia?.atualizados || 0) + (data.persistencia?.atualizados || 0),
                erros: (acc.persistencia?.erros || 0) + (data.persistencia?.erros || 0),
              };
            }
            return acc;
          },
          { total: 0, persistencia: { total: 0, atualizados: 0, erros: 0 } } as {
            total: number;
            persistencia: { total: number; atualizados: number; erros: number };
          }
        );

        setResult({
          success: true,
          data: {
            ...dadosAgregados,
            filtroPrazo,
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

      <CapturaResult success={result.success} error={result.error} data={result.data} />
    </div>
  );
}
