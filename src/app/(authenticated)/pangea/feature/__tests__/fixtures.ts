import type { PangeaBuscaInput, PangeaBuscaResponse, PangeaResultado, PangeaOrgaoDisponivel } from '../domain';

export function criarPangeaBuscaInputMock(
  overrides: Partial<PangeaBuscaInput> = {}
): PangeaBuscaInput {
  return {
    buscaGeral: 'busca teste',
    todasPalavras: '',
    quaisquerPalavras: '',
    semPalavras: '',
    trechoExato: '',
    cancelados: false,
    ordenacao: 'Text',
    nr: '',
    pagina: 1,
    tamanhoPagina: 10000,
    orgaos: [],
    tipos: [],
    ...overrides,
  };
}

export function criarPangeaResultadoMock(
  overrides: Partial<PangeaResultado> = {}
): PangeaResultado {
  return {
    id: '1',
    nr: 1,
    orgao: 'TST',
    tipo: 'SUM',
    situacao: 'Ativo',
    questao: 'Questão teste',
    tese: 'Tese teste',
    ultimaAtualizacao: '2024-01-01',
    possuiDecisoes: true,
    processosParadigma: [],
    ...overrides,
  };
}

export function criarPangeaBuscaResponseMock(
  numeroResultados: number = 2,
  overrides: Partial<PangeaBuscaResponse> = {}
): PangeaBuscaResponse {
  const resultados = Array.from({ length: numeroResultados }, (_, index) =>
    criarPangeaResultadoMock({
      id: `${index + 1}`,
      nr: index + 1,
    })
  );

  return {
    aggsEspecies: [
      { tipo: 'SUM', total: 10 },
      { tipo: 'SV', total: 5 },
    ],
    aggsOrgaos: [
      { tipo: 'TST', total: 15 },
    ],
    posicao_inicial: 1,
    posicao_final: numeroResultados,
    total: numeroResultados,
    resultados,
    ...overrides,
  };
}

export function criarOrgaoDisponivelMock(
  overrides: Partial<PangeaOrgaoDisponivel> = {}
): PangeaOrgaoDisponivel {
  return {
    codigo: 'TST',
    nome: 'Tribunal Superior do Trabalho',
    ...overrides,
  };
}
