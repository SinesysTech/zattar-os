/**
 * Testes Unitários - Config Cache Service
 *
 * Testa a lógica de cache em memória e mapeamento de configurações de tribunais.
 * Verifica TTL, invalidação e comportamento do cache.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import type {
  TribunalConfigDb,
  TipoAcessoTribunal,
} from '@/backend/types/captura/trt-types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock do persistence service
const mockGetConfigByTRTAndGrau = jest.fn();
const mockListAllConfigs = jest.fn();

jest.mock(
  '@/backend/captura/services/persistence/tribunal-config-persistence.service',
  () => ({
    getConfigByTRTAndGrau: mockGetConfigByTRTAndGrau,
    listAllConfigs: mockListAllConfigs,
  })
);

// Importar após mocks
import {
  getTribunalConfig,
  isValidTribunalCode,
  listTribunalCodes,
  clearConfigCache,
} from '@/backend/captura/services/trt/config';

// =============================================================================
// FIXTURES
// =============================================================================

/**
 * Cria um objeto TribunalConfigDb mock
 */
function criarTribunalConfigDb(
  overrides: Partial<TribunalConfigDb> = {}
): TribunalConfigDb {
  return {
    id: '1',
    sistema: 'PJE',
    tipo_acesso: 'primeiro_grau' as TipoAcessoTribunal,
    url_base: 'https://pje.trt1.jus.br',
    url_login_seam: 'https://pje.trt1.jus.br/primeirograu/login.seam',
    url_api: 'https://pje.trt1.jus.br/pje-comum-api/api',
    custom_timeouts: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    tribunal_id: '1',
    tribunal_codigo: 'TRT1',
    tribunal_nome: 'TRT da 1ª Região',
    ...overrides,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function resetMocks() {
  mockGetConfigByTRTAndGrau.mockReset();
  mockListAllConfigs.mockReset();
  clearConfigCache(); // Limpar cache entre testes
}

// =============================================================================
// TESTES: getTribunalConfig
// =============================================================================

describe('getTribunalConfig', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    clearConfigCache();
  });

  describe('busca e mapeamento', () => {
    it('deve retornar ConfigTRT mapeado do banco', async () => {
      const dbConfig = criarTribunalConfigDb();
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      const resultado = await getTribunalConfig('TRT1', 'primeiro_grau');

      expect(resultado).toEqual({
        codigo: 'TRT1',
        nome: 'TRT da 1ª Região',
        grau: 'primeiro_grau',
        tipoAcesso: 'primeiro_grau',
        loginUrl: 'https://pje.trt1.jus.br/primeirograu/login.seam',
        baseUrl: 'https://pje.trt1.jus.br',
        apiUrl: 'https://pje.trt1.jus.br/pje-comum-api/api',
        customTimeouts: undefined,
      });
    });

    it('deve mapear segundo_grau corretamente', async () => {
      const dbConfig = criarTribunalConfigDb({
        tipo_acesso: 'segundo_grau',
        url_login_seam: 'https://pje.trt1.jus.br/segundograu/login.seam',
      });
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      const resultado = await getTribunalConfig('TRT1', 'segundo_grau');

      expect(resultado.grau).toBe('segundo_grau');
      expect(resultado.tipoAcesso).toBe('segundo_grau');
      expect(resultado.loginUrl).toContain('segundograu');
    });

    it('deve mapear unico para tribunal_superior', async () => {
      const dbConfig = criarTribunalConfigDb({
        tipo_acesso: 'unico',
        tribunal_codigo: 'TST',
        tribunal_nome: 'Tribunal Superior do Trabalho',
      });
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      const resultado = await getTribunalConfig('TST', 'tribunal_superior');

      expect(resultado.grau).toBe('tribunal_superior');
      expect(resultado.tipoAcesso).toBe('unico');
      expect(resultado.codigo).toBe('TST');
    });

    it('deve incluir customTimeouts quando presente', async () => {
      const customTimeouts = {
        login: 30000,
        redirect: 15000,
        networkIdle: 10000,
        api: 20000,
      };
      const dbConfig = criarTribunalConfigDb({
        custom_timeouts: customTimeouts,
      });
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      const resultado = await getTribunalConfig('TRT1', 'primeiro_grau');

      expect(resultado.customTimeouts).toEqual(customTimeouts);
    });
  });

  describe('cache', () => {
    it('deve usar cache na segunda chamada (não consultar banco)', async () => {
      const dbConfig = criarTribunalConfigDb();
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      // Primeira chamada - busca do banco
      await getTribunalConfig('TRT1', 'primeiro_grau');
      expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1);

      // Segunda chamada - deve usar cache
      await getTribunalConfig('TRT1', 'primeiro_grau');
      expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1); // Não aumentou
    });

    it('deve cachear por tribunal+grau separadamente', async () => {
      const dbConfig1g = criarTribunalConfigDb({ tipo_acesso: 'primeiro_grau' });
      const dbConfig2g = criarTribunalConfigDb({
        tipo_acesso: 'segundo_grau',
        url_login_seam: 'https://pje.trt1.jus.br/segundograu/login.seam',
      });
      mockGetConfigByTRTAndGrau
        .mockResolvedValueOnce(dbConfig1g)
        .mockResolvedValueOnce(dbConfig2g);

      // Buscar primeiro grau
      const resultado1g = await getTribunalConfig('TRT1', 'primeiro_grau');
      expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1);

      // Buscar segundo grau - deve ir ao banco (cache miss)
      const resultado2g = await getTribunalConfig('TRT1', 'segundo_grau');
      expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(2);

      // Verificar que são diferentes
      expect(resultado1g.grau).toBe('primeiro_grau');
      expect(resultado2g.grau).toBe('segundo_grau');
    });

    it('deve diferenciar cache por tribunal', async () => {
      const dbConfigTRT1 = criarTribunalConfigDb({
        tribunal_codigo: 'TRT1',
        tribunal_nome: 'TRT 1ª Região',
      });
      const dbConfigTRT2 = criarTribunalConfigDb({
        tribunal_codigo: 'TRT2',
        tribunal_nome: 'TRT 2ª Região',
      });
      mockGetConfigByTRTAndGrau
        .mockResolvedValueOnce(dbConfigTRT1)
        .mockResolvedValueOnce(dbConfigTRT2);

      await getTribunalConfig('TRT1', 'primeiro_grau');
      await getTribunalConfig('TRT2', 'primeiro_grau');

      expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(2);
    });
  });

  describe('erro quando não encontrada', () => {
    it('deve lançar erro quando configuração não existe', async () => {
      mockGetConfigByTRTAndGrau.mockResolvedValue(null);

      await expect(
        getTribunalConfig('TRT99', 'primeiro_grau')
      ).rejects.toThrow('Configuração não encontrada para tribunal TRT99');
    });

    it('deve incluir grau na mensagem de erro', async () => {
      mockGetConfigByTRTAndGrau.mockResolvedValue(null);

      await expect(
        getTribunalConfig('TRT1', 'segundo_grau')
      ).rejects.toThrow('segundo_grau');
    });
  });
});

// =============================================================================
// TESTES: clearConfigCache
// =============================================================================

describe('clearConfigCache', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    clearConfigCache();
  });

  it('deve limpar todo o cache quando chamada sem parâmetros', async () => {
    const dbConfig = criarTribunalConfigDb();
    mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

    // Popular cache
    await getTribunalConfig('TRT1', 'primeiro_grau');
    await getTribunalConfig('TRT2', 'primeiro_grau');

    // Limpar cache
    clearConfigCache();

    // Próximas chamadas devem ir ao banco
    mockGetConfigByTRTAndGrau.mockClear();
    await getTribunalConfig('TRT1', 'primeiro_grau');
    await getTribunalConfig('TRT2', 'primeiro_grau');

    expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(2);
  });

  it('deve limpar cache de um tribunal específico', async () => {
    const dbConfig1 = criarTribunalConfigDb({ tribunal_codigo: 'TRT1' });
    const dbConfig2 = criarTribunalConfigDb({ tribunal_codigo: 'TRT2' });
    mockGetConfigByTRTAndGrau
      .mockResolvedValueOnce(dbConfig1)
      .mockResolvedValueOnce(dbConfig2)
      .mockResolvedValueOnce(dbConfig1);

    // Popular cache
    await getTribunalConfig('TRT1', 'primeiro_grau');
    await getTribunalConfig('TRT2', 'primeiro_grau');

    // Limpar apenas TRT1
    clearConfigCache('TRT1');

    mockGetConfigByTRTAndGrau.mockClear();
    mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig1);

    // TRT1 deve ir ao banco (cache limpo)
    await getTribunalConfig('TRT1', 'primeiro_grau');
    expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1);

    // TRT2 deve usar cache
    await getTribunalConfig('TRT2', 'primeiro_grau');
    expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1); // Não aumentou
  });

  it('deve limpar cache de tribunal e grau específicos', async () => {
    const dbConfig1g = criarTribunalConfigDb({ tipo_acesso: 'primeiro_grau' });
    const dbConfig2g = criarTribunalConfigDb({ tipo_acesso: 'segundo_grau' });
    mockGetConfigByTRTAndGrau
      .mockResolvedValueOnce(dbConfig1g)
      .mockResolvedValueOnce(dbConfig2g)
      .mockResolvedValueOnce(dbConfig1g);

    // Popular cache com dois graus
    await getTribunalConfig('TRT1', 'primeiro_grau');
    await getTribunalConfig('TRT1', 'segundo_grau');

    // Limpar apenas primeiro_grau
    clearConfigCache('TRT1', 'primeiro_grau');

    mockGetConfigByTRTAndGrau.mockClear();
    mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig1g);

    // primeiro_grau deve ir ao banco
    await getTribunalConfig('TRT1', 'primeiro_grau');
    expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1);

    // segundo_grau deve usar cache
    await getTribunalConfig('TRT1', 'segundo_grau');
    expect(mockGetConfigByTRTAndGrau).toHaveBeenCalledTimes(1); // Não aumentou
  });
});

// =============================================================================
// TESTES: isValidTribunalCode
// =============================================================================

describe('isValidTribunalCode', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('deve retornar true quando tribunal existe na lista', async () => {
    mockListAllConfigs.mockResolvedValue([
      criarTribunalConfigDb({ tribunal_codigo: 'TRT1' }),
      criarTribunalConfigDb({ tribunal_codigo: 'TRT2' }),
    ]);

    const resultado = await isValidTribunalCode('TRT1');

    expect(resultado).toBe(true);
  });

  it('deve retornar false quando tribunal não existe', async () => {
    mockListAllConfigs.mockResolvedValue([
      criarTribunalConfigDb({ tribunal_codigo: 'TRT1' }),
    ]);

    const resultado = await isValidTribunalCode('TRT99');

    expect(resultado).toBe(false);
  });

  it('deve retornar false quando ocorre erro', async () => {
    mockListAllConfigs.mockRejectedValue(new Error('Connection error'));

    const resultado = await isValidTribunalCode('TRT1');

    expect(resultado).toBe(false);
  });
});

// =============================================================================
// TESTES: listTribunalCodes
// =============================================================================

describe('listTribunalCodes', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('deve retornar lista de códigos únicos ordenados', async () => {
    mockListAllConfigs.mockResolvedValue([
      criarTribunalConfigDb({ tribunal_codigo: 'TRT3' }),
      criarTribunalConfigDb({ tribunal_codigo: 'TRT1' }),
      criarTribunalConfigDb({
        tribunal_codigo: 'TRT1',
        tipo_acesso: 'segundo_grau',
      }), // Duplicado
      criarTribunalConfigDb({ tribunal_codigo: 'TRT2' }),
    ]);

    const resultado = await listTribunalCodes();

    expect(resultado).toEqual(['TRT1', 'TRT2', 'TRT3']);
  });

  it('deve retornar array vazio quando não há configurações', async () => {
    mockListAllConfigs.mockResolvedValue([]);

    const resultado = await listTribunalCodes();

    expect(resultado).toEqual([]);
  });

  it('deve retornar array vazio quando ocorre erro', async () => {
    mockListAllConfigs.mockRejectedValue(new Error('Database error'));

    const resultado = await listTribunalCodes();

    expect(resultado).toEqual([]);
  });
});

// =============================================================================
// TESTES: Mapeamento tipo_acesso → grau
// =============================================================================

describe('Mapeamento tipo_acesso para grau', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    clearConfigCache();
  });

  const casosMapping: Array<{
    tipoAcesso: TipoAcessoTribunal;
    grauEsperado: string;
  }> = [
    { tipoAcesso: 'primeiro_grau', grauEsperado: 'primeiro_grau' },
    { tipoAcesso: 'segundo_grau', grauEsperado: 'segundo_grau' },
    { tipoAcesso: 'unificado', grauEsperado: 'primeiro_grau' },
    { tipoAcesso: 'unico', grauEsperado: 'tribunal_superior' },
  ];

  casosMapping.forEach(({ tipoAcesso, grauEsperado }) => {
    it(`deve mapear tipo_acesso '${tipoAcesso}' para grau '${grauEsperado}'`, async () => {
      const dbConfig = criarTribunalConfigDb({ tipo_acesso: tipoAcesso });
      mockGetConfigByTRTAndGrau.mockResolvedValue(dbConfig);

      // Usar grau correspondente na chamada
      const grauChamada =
        grauEsperado === 'tribunal_superior' ? 'tribunal_superior' : grauEsperado;
      const resultado = await getTribunalConfig('TRT1', grauChamada as 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior');

      expect(resultado.grau).toBe(grauEsperado);
      expect(resultado.tipoAcesso).toBe(tipoAcesso);
    });
  });
});
