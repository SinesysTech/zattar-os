/**
 * Tests for Comunica CNJ Server Actions
 *
 * Tests real exported actions with mocked service layer, auth and cache revalidation.
 *
 * Actions usam `requireAuth` from ../../actions/utils (wrapping supabase + checkPermission).
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
jest.mock('next/cache');
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock requireAuth (used by actions)
jest.mock('../../actions/utils', () => ({
  requireAuth: jest.fn(async () => ({ userId: 42 })),
}));

// Mock comunica-cnj service
jest.mock('../../service', () => ({
  buscarComunicacoes: jest.fn(),
  listarComunicacoesCapturadas: jest.fn(),
  sincronizarComunicacoes: jest.fn(),
  obterCertidao: jest.fn(),
  vincularComunicacaoAExpediente: jest.fn(),
  listarTribunaisDisponiveis: jest.fn(),
}));

import { requireAuth } from '../../actions/utils';

// Import REAL actions (after mocks)
import {
  actionConsultarComunicacoes,
  actionListarComunicacoesCapturadas,
  actionSincronizarComunicacoes,
  actionObterCertidao,
  actionVincularExpediente,
  actionListarTribunaisDisponiveis,
} from '../../actions/comunica-cnj-actions';

// Import mocked service
import * as mockCnjService from '../../service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockConsultaResult = {
  comunicacoes: [
    {
      id: 1,
      hash: 'abc123',
      numeroProcesso: '00012345620245010001',
      siglaTribunal: 'TRT1',
      tipoComunicacao: 'Intimação',
      dataDisponibilizacao: '2025-01-15',
    },
  ],
  paginacao: { pagina: 1, itensPorPagina: 100, total: 1, totalPaginas: 1 },
  rateLimit: { limit: 100, remaining: 99 },
};

const mockComunicacoesList = {
  data: [{ id: 1, hash: 'abc123', numeroProcesso: '00012345620245010001' }],
  total: 1,
  page: 1,
  limit: 50,
};

const mockSincronizacaoResult = {
  success: true,
  stats: { total: 5, novos: 3, duplicados: 2, vinculados: 1, expedientesCriados: 0, erros: 0 },
};

const mockTribunais = [
  { id: 'TRT1', nome: 'TRT da 1ª Região', sigla: 'TRT1', jurisdicao: 'RJ' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Comunica CNJ Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ userId: 42 });
  });

  describe('actionConsultarComunicacoes', () => {
    const validParams = { siglaTribunal: 'TRT1', pagina: 1, itensPorPagina: 100 as const };

    it('deve consultar comunicações com sucesso', async () => {
      (mockCnjService.buscarComunicacoes as jest.Mock).mockResolvedValue({
        success: true,
        data: mockConsultaResult,
      });

      const result = await actionConsultarComunicacoes(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConsultaResult);
      expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:consultar']);
      expect(mockCnjService.buscarComunicacoes).toHaveBeenCalledWith(validParams);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionConsultarComunicacoes(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(mockCnjService.buscarComunicacoes).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando service retorna falha', async () => {
      (mockCnjService.buscarComunicacoes as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'API indisponível' },
      });

      const result = await actionConsultarComunicacoes(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API indisponível');
    });

    it('deve retornar erro quando service lança exceção', async () => {
      (mockCnjService.buscarComunicacoes as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const result = await actionConsultarComunicacoes(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout');
    });
  });

  describe('actionListarComunicacoesCapturadas', () => {
    const validParams = { page: 1, limit: 50 };

    it('deve listar comunicações capturadas com sucesso', async () => {
      (mockCnjService.listarComunicacoesCapturadas as jest.Mock).mockResolvedValue({
        success: true,
        data: mockComunicacoesList,
      });

      const result = await actionListarComunicacoesCapturadas(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComunicacoesList);
      expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:listar']);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionListarComunicacoesCapturadas(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      (mockCnjService.listarComunicacoesCapturadas as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Erro no banco' },
      });

      const result = await actionListarComunicacoesCapturadas(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro no banco');
    });
  });

  describe('actionSincronizarComunicacoes', () => {
    const validParams = { numeroOab: '12345', ufOab: 'RJ' };

    it('deve sincronizar comunicações com sucesso', async () => {
      (mockCnjService.sincronizarComunicacoes as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSincronizacaoResult,
      });

      const result = await actionSincronizarComunicacoes(validParams);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSincronizacaoResult);
      expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:capturar']);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionSincronizarComunicacoes(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      (mockCnjService.sincronizarComunicacoes as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Erro de sincronização' },
      });

      const result = await actionSincronizarComunicacoes(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro de sincronização');
    });
  });

  describe('actionObterCertidao', () => {
    it('deve obter certidão em base64 com sucesso', async () => {
      const mockBuffer = Buffer.from('pdf-content');
      (mockCnjService.obterCertidao as jest.Mock).mockResolvedValue({
        success: true,
        data: mockBuffer,
      });

      const result = await actionObterCertidao('hash123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(mockBuffer.toString('base64'));
      expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:visualizar']);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionObterCertidao('hash123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve retornar erro quando certidão não encontrada', async () => {
      (mockCnjService.obterCertidao as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Certidão não encontrada' },
      });

      const result = await actionObterCertidao('invalid-hash');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Certidão não encontrada');
    });
  });

  describe('actionVincularExpediente', () => {
    it('deve vincular expediente com sucesso', async () => {
      (mockCnjService.vincularComunicacaoAExpediente as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await actionVincularExpediente(1, 10);

      expect(result.success).toBe(true);
      expect(requireAuth).toHaveBeenCalledWith(['comunica_cnj:editar', 'expedientes:editar']);
      expect(mockCnjService.vincularComunicacaoAExpediente).toHaveBeenCalledWith(1, 10);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionVincularExpediente(1, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      (mockCnjService.vincularComunicacaoAExpediente as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Comunicação não encontrada' },
      });

      const result = await actionVincularExpediente(999, 10);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Comunicação não encontrada');
    });
  });

  describe('actionListarTribunaisDisponiveis', () => {
    it('deve listar tribunais com sucesso', async () => {
      (mockCnjService.listarTribunaisDisponiveis as jest.Mock).mockResolvedValue({
        success: true,
        data: mockTribunais,
      });

      const result = await actionListarTribunaisDisponiveis();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTribunais);
      expect(requireAuth).toHaveBeenCalledWith([]);
    });

    it('deve retornar erro quando não autenticado', async () => {
      (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await actionListarTribunaisDisponiveis();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('deve retornar erro quando service retorna falha', async () => {
      (mockCnjService.listarTribunaisDisponiveis as jest.Mock).mockResolvedValue({
        success: false,
        error: { message: 'Erro ao listar tribunais' },
      });

      const result = await actionListarTribunaisDisponiveis();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao listar tribunais');
    });
  });
});
