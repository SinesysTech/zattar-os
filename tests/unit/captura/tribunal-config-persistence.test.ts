/**
 * Testes Unitários - Tribunal Config Persistence Service
 *
 * Testa a camada de persistência que busca configurações de tribunais do banco de dados.
 * Usa mocks do Supabase para isolar os testes da dependência do banco.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { TipoAcessoTribunal } from '@/backend/types/captura/trt-types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock do cliente Supabase
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

const mockSupabaseClient = {
  from: mockFrom,
};

// Configurar chain de métodos
mockFrom.mockReturnValue({
  select: mockSelect,
});
mockSelect.mockReturnValue({
  eq: mockEq,
});
mockEq.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
});

// Mock do módulo de service client
jest.mock('@/backend/utils/supabase/service-client', () => ({
  createServiceClient: () => mockSupabaseClient,
}));

// Importar após o mock para que o mock seja aplicado
import {
  getConfigByTribunalAndTipoAcesso,
  getConfigByTRTAndGrau,
  listAllConfigs,
  isValidTribunalCode,
} from '@/backend/captura/services/persistence/tribunal-config-persistence.service';

// =============================================================================
// FIXTURES
// =============================================================================

/**
 * Cria um registro de configuração mock do banco
 */
function criarConfigDbMock(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    sistema: 'PJE',
    tipo_acesso: 'primeiro_grau',
    url_base: 'https://pje.trt1.jus.br',
    url_login_seam: 'https://pje.trt1.jus.br/primeirograu/login.seam',
    url_api: 'https://pje.trt1.jus.br/pje-comum-api/api',
    custom_timeouts: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    tribunal_id: 1,
    tribunais: {
      codigo: 'TRT1',
      nome: 'TRT da 1ª Região',
    },
    ...overrides,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function resetMocks() {
  mockSingle.mockReset();
  mockSelect.mockReset();
  mockEq.mockReset();
  mockFrom.mockReset();

  // Reconfigurar chain
  mockFrom.mockReturnValue({
    select: mockSelect,
  });
  mockSelect.mockReturnValue({
    eq: mockEq,
  });
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  });
}

// =============================================================================
// TESTES: getConfigByTribunalAndTipoAcesso
// =============================================================================

describe('getConfigByTribunalAndTipoAcesso', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('busca com sucesso', () => {
    it('deve retornar configuração quando encontrada no banco', async () => {
      const configDb = criarConfigDbMock();
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      const resultado = await getConfigByTribunalAndTipoAcesso(
        'TRT1',
        'primeiro_grau'
      );

      expect(resultado).not.toBeNull();
      expect(resultado?.tribunal_codigo).toBe('TRT1');
      expect(resultado?.tribunal_nome).toBe('TRT da 1ª Região');
      expect(resultado?.tipo_acesso).toBe('primeiro_grau');
      expect(resultado?.url_base).toBe('https://pje.trt1.jus.br');
    });

    it('deve mapear corretamente os campos do JOIN', async () => {
      const configDb = criarConfigDbMock({
        tribunais: {
          codigo: 'TRT15',
          nome: 'TRT da 15ª Região',
        },
        url_api: 'https://pje.trt15.jus.br/api',
      });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      const resultado = await getConfigByTribunalAndTipoAcesso(
        'TRT15',
        'primeiro_grau'
      );

      expect(resultado?.tribunal_codigo).toBe('TRT15');
      expect(resultado?.tribunal_nome).toBe('TRT da 15ª Região');
      expect(resultado?.url_api).toBe('https://pje.trt15.jus.br/api');
    });

    it('deve retornar customTimeouts quando presente', async () => {
      const customTimeouts = {
        login: 30000,
        redirect: 15000,
        networkIdle: 10000,
        api: 20000,
      };
      const configDb = criarConfigDbMock({ custom_timeouts: customTimeouts });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      const resultado = await getConfigByTribunalAndTipoAcesso(
        'TRT1',
        'primeiro_grau'
      );

      expect(resultado?.custom_timeouts).toEqual(customTimeouts);
    });
  });

  describe('configuração não encontrada', () => {
    it('deve retornar null quando registro não existe (PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const resultado = await getConfigByTribunalAndTipoAcesso(
        'TRT99',
        'primeiro_grau'
      );

      expect(resultado).toBeNull();
    });

    it('deve retornar null quando dados do tribunal estão incompletos', async () => {
      const configDb = criarConfigDbMock({
        tribunais: { codigo: null, nome: null },
      });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      const resultado = await getConfigByTribunalAndTipoAcesso(
        'TRT1',
        'primeiro_grau'
      );

      expect(resultado).toBeNull();
    });
  });

  describe('tratamento de erros', () => {
    it('deve lançar erro quando ocorre erro diferente de PGRST116', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST500', message: 'Database connection error' },
      });

      await expect(
        getConfigByTribunalAndTipoAcesso('TRT1', 'primeiro_grau')
      ).rejects.toThrow('Erro ao buscar configuração do tribunal');
    });
  });
});

// =============================================================================
// TESTES: getConfigByTRTAndGrau
// =============================================================================

describe('getConfigByTRTAndGrau', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('mapeamento de grau para tipo_acesso', () => {
    it('deve mapear primeiro_grau para primeiro_grau', async () => {
      const configDb = criarConfigDbMock({ tipo_acesso: 'primeiro_grau' });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      await getConfigByTRTAndGrau('TRT1', 'primeiro_grau');

      // Verificar que eq foi chamado com 'primeiro_grau'
      expect(mockEq).toHaveBeenCalledWith('tipo_acesso', 'primeiro_grau');
    });

    it('deve mapear segundo_grau para segundo_grau', async () => {
      const configDb = criarConfigDbMock({ tipo_acesso: 'segundo_grau' });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      await getConfigByTRTAndGrau('TRT1', 'segundo_grau');

      expect(mockEq).toHaveBeenCalledWith('tipo_acesso', 'segundo_grau');
    });

    it('deve mapear tribunal_superior para unico', async () => {
      const configDb = criarConfigDbMock({ tipo_acesso: 'unico' });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      await getConfigByTRTAndGrau('TST', 'tribunal_superior');

      expect(mockEq).toHaveBeenCalledWith('tipo_acesso', 'unico');
    });
  });

  describe('retorno de configuração', () => {
    it('deve retornar configuração válida do TRT', async () => {
      const configDb = criarConfigDbMock({
        tribunais: { codigo: 'TRT3', nome: 'TRT da 3ª Região' },
      });
      mockSingle.mockResolvedValue({ data: configDb, error: null });

      const resultado = await getConfigByTRTAndGrau('TRT3', 'primeiro_grau');

      expect(resultado).not.toBeNull();
      expect(resultado?.tribunal_codigo).toBe('TRT3');
    });

    it('deve retornar null quando TRT não existe', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const resultado = await getConfigByTRTAndGrau('TRT99', 'primeiro_grau');

      expect(resultado).toBeNull();
    });
  });
});

// =============================================================================
// TESTES: listAllConfigs
// =============================================================================

describe('listAllConfigs', () => {
  beforeEach(() => {
    resetMocks();
    // Configurar chain sem single() para listagem
    mockSelect.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it('deve retornar array vazio quando não há configurações', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });

    const resultado = await listAllConfigs();

    expect(resultado).toEqual([]);
  });

  it('deve retornar todas as configurações disponíveis', async () => {
    const configs = [
      criarConfigDbMock({
        id: 1,
        tribunais: { codigo: 'TRT1', nome: 'TRT 1ª Região' },
      }),
      criarConfigDbMock({
        id: 2,
        tribunais: { codigo: 'TRT2', nome: 'TRT 2ª Região' },
        tipo_acesso: 'segundo_grau',
      }),
    ];
    mockSelect.mockResolvedValue({ data: configs, error: null });

    const resultado = await listAllConfigs();

    expect(resultado).toHaveLength(2);
    expect(resultado[0].tribunal_codigo).toBe('TRT1');
    expect(resultado[1].tribunal_codigo).toBe('TRT2');
  });

  it('deve filtrar registros com dados incompletos', async () => {
    const configs = [
      criarConfigDbMock({
        id: 1,
        tribunais: { codigo: 'TRT1', nome: 'TRT 1ª Região' },
      }),
      criarConfigDbMock({
        id: 2,
        tribunais: { codigo: null, nome: null }, // Dados incompletos
      }),
    ];
    mockSelect.mockResolvedValue({ data: configs, error: null });

    const resultado = await listAllConfigs();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].tribunal_codigo).toBe('TRT1');
  });

  it('deve lançar erro quando query falha', async () => {
    mockSelect.mockResolvedValue({
      data: null,
      error: { message: 'Connection timeout' },
    });

    await expect(listAllConfigs()).rejects.toThrow(
      'Erro ao listar configurações de tribunais'
    );
  });
});

// =============================================================================
// TESTES: isValidTribunalCode
// =============================================================================

describe('isValidTribunalCode', () => {
  beforeEach(() => {
    resetMocks();
    // Configurar chain para count query
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockResolvedValue({ count: 0, error: null });
  });

  it('deve retornar true quando tribunal existe', async () => {
    mockEq.mockResolvedValue({ count: 2, error: null }); // 2 configs (1g e 2g)

    const resultado = await isValidTribunalCode('TRT1');

    expect(resultado).toBe(true);
  });

  it('deve retornar false quando tribunal não existe', async () => {
    mockEq.mockResolvedValue({ count: 0, error: null });

    const resultado = await isValidTribunalCode('TRT99');

    expect(resultado).toBe(false);
  });

  it('deve retornar false quando ocorre erro', async () => {
    mockEq.mockResolvedValue({
      count: null,
      error: { message: 'Query error' },
    });

    const resultado = await isValidTribunalCode('TRT1');

    expect(resultado).toBe(false);
  });
});
