/**
 * Testes unitários dos helpers de resolução de parâmetros do Scheduler de Captura.
 *
 * Testa resolverFiltrosPendentes e resolverDataAudiencias — funções puras exportadas
 * do executar-agendamento.service. São os pontos mais críticos pois determinam
 * quais dados serão capturados a cada execução agendada.
 */

import { describe, it, expect, jest } from '@jest/globals';

// =============================================================================
// MOCKS DE INFRAESTRUTURA (necessários para importar o módulo)
// =============================================================================

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(), set: jest.fn(), delete: jest.fn() })),
}));

jest.mock('../../credentials/credential.service', () => ({
  getCredentialComplete: jest.fn(),
}));

jest.mock('../../services/trt/config', () => ({
  getTribunalConfig: jest.fn(),
}));

jest.mock('../../services/trt/acervo-geral.service', () => ({
  acervoGeralCapture: jest.fn(),
}));

jest.mock('../../services/trt/arquivados.service', () => ({
  arquivadosCapture: jest.fn(),
}));

jest.mock('../../services/trt/audiencias.service', () => ({
  audienciasCapture: jest.fn(),
}));

jest.mock('../../services/trt/pendentes-manifestacao.service', () => ({
  pendentesManifestacaoCapture: jest.fn(),
}));

jest.mock('../../services/trt/pericias.service', () => ({
  periciasCapture: jest.fn(),
}));

jest.mock('../../services/trt/captura-combinada.service', () => ({
  capturaCombinada: jest.fn(),
}));

jest.mock('../../services/trt/capturar-atas-audiencias.service', () => ({
  capturarAtasAudiencias: jest.fn(),
}));

jest.mock('../../services/captura-log.service', () => ({
  iniciarCapturaLog: jest.fn(),
  finalizarCapturaLogSucesso: jest.fn(),
  finalizarCapturaLogErro: jest.fn(),
}));

jest.mock('../../services/persistence/agendamento-persistence.service', () => ({
  atualizarAgendamento: jest.fn(),
}));

jest.mock('../../services/agendamentos/calcular-proxima-execucao.service', () => ({
  recalcularProximaExecucaoAposExecucao: jest.fn(),
}));

jest.mock('../../services/persistence/captura-raw-log.service', () => ({
  registrarCapturaRawLog: jest.fn(),
}));

// Mock date-utils com data fixa para testes determinísticos
const HOJE_FIXO = '2026-05-05';
const ONTEM_FIXO = '2026-05-04';

jest.mock('@/lib/date-utils', () => ({
  todayDateString: jest.fn(() => HOJE_FIXO),
  addDays: jest.fn((dateStr: string, days: number) => {
    // Implementação real simplificada para os testes
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    const yy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }),
}));

// Importar funções testadas APÓS os mocks
import {
  resolverFiltrosPendentes,
  resolverDataAudiencias,
} from '../../services/scheduler/executar-agendamento.service';

// =============================================================================
// TESTES: resolverFiltrosPendentes
// =============================================================================

describe('resolverFiltrosPendentes', () => {
  describe('quando parametros_extras é null (agendamento sem configuração)', () => {
    it('retorna ["sem_prazo"] como padrão', () => {
      expect(resolverFiltrosPendentes(null, null)).toEqual(['sem_prazo']);
    });

    it('retorna ["sem_prazo"] quando ambos undefined', () => {
      expect(resolverFiltrosPendentes(undefined, undefined)).toEqual(['sem_prazo']);
    });
  });

  describe('quando filtroUnico (campo legado singular) é fornecido', () => {
    it('retorna ["sem_prazo"] para filtroPrazo "sem_prazo"', () => {
      expect(resolverFiltrosPendentes(null, 'sem_prazo')).toEqual(['sem_prazo']);
    });

    it('retorna ["no_prazo"] para filtroPrazo "no_prazo"', () => {
      expect(resolverFiltrosPendentes(null, 'no_prazo')).toEqual(['no_prazo']);
    });
  });

  describe('quando filtrosPrazo (array) é fornecido', () => {
    it('retorna ambos em ordem canônica: sem_prazo antes de no_prazo', () => {
      expect(resolverFiltrosPendentes(['no_prazo', 'sem_prazo'])).toEqual(['sem_prazo', 'no_prazo']);
    });

    it('mantém apenas sem_prazo se só ele for passado', () => {
      expect(resolverFiltrosPendentes(['sem_prazo'])).toEqual(['sem_prazo']);
    });

    it('mantém apenas no_prazo se só ele for passado', () => {
      expect(resolverFiltrosPendentes(['no_prazo'])).toEqual(['no_prazo']);
    });

    it('deduplica filtros repetidos', () => {
      expect(resolverFiltrosPendentes(['sem_prazo', 'sem_prazo', 'no_prazo'])).toEqual([
        'sem_prazo',
        'no_prazo',
      ]);
    });
  });

  describe('precedência: filtrosPrazo tem prioridade sobre filtroUnico', () => {
    it('usa filtrosPrazo quando ambos fornecidos', () => {
      expect(resolverFiltrosPendentes(['no_prazo'], 'sem_prazo')).toEqual(['no_prazo']);
    });
  });

  describe('array vazio equivale a null', () => {
    it('array vazio cai no padrão sem_prazo', () => {
      expect(resolverFiltrosPendentes([])).toEqual(['sem_prazo']);
    });
  });
});

// =============================================================================
// TESTES: resolverDataAudiencias
// =============================================================================

describe('resolverDataAudiencias', () => {
  it('retorna a data de hoje para dataRelativa "hoje"', () => {
    expect(resolverDataAudiencias('hoje')).toBe(HOJE_FIXO);
  });

  it('retorna ontem para dataRelativa "ontem"', () => {
    expect(resolverDataAudiencias('ontem')).toBe(ONTEM_FIXO);
  });

  it('retorna undefined quando dataRelativa é null', () => {
    expect(resolverDataAudiencias(null)).toBeUndefined();
  });

  it('retorna undefined quando dataRelativa é undefined', () => {
    expect(resolverDataAudiencias(undefined)).toBeUndefined();
  });

  it('"ontem" é sempre um dia antes de "hoje"', () => {
    const hoje = resolverDataAudiencias('hoje')!;
    const ontem = resolverDataAudiencias('ontem')!;
    const diffMs =
      new Date(hoje).getTime() - new Date(ontem).getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });
});
