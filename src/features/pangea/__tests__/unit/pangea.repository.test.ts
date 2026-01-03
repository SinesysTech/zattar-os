// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarPangeaBuscaResponseMock } from '../fixtures';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Pangea Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarPrecedentesRaw', () => {
    it('deve fazer POST para API do Pangea com filtro', async () => {
      // Arrange
      const filtro = {
        buscaGeral: 'teste',
        orgaos: ['TST'],
        tipos: ['SUM'],
        pagina: 1,
        tamanhoPagina: 10000,
      };

      const responseData = criarPangeaBuscaResponseMock(2);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://pangeabnp.pdpj.jus.br/api/v1/precedentes',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ filtro }),
        }
      );
      expect(result).toEqual(responseData);
    });

    it('deve validar resposta com schema Zod', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };
      const responseData = criarPangeaBuscaResponseMock(1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert
      expect(result.resultados).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.resultados)).toBe(true);
    });

    it('deve lançar erro quando API retorna status não-ok', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      // Act & Assert
      await expect(
        repository.buscarPrecedentesRaw({ filtro })
      ).rejects.toThrow('Falha ao consultar Pangea (500)');
    });

    it('deve lançar erro quando resposta tem formato inesperado', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      // Resposta inválida (faltando campos obrigatórios)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalidField: 'invalid' }),
      });

      // Act & Assert
      await expect(
        repository.buscarPrecedentesRaw({ filtro })
      ).rejects.toThrow('Resposta do Pangea em formato inesperado');
    });

    it('deve lidar com resposta vazia (sem resultados)', async () => {
      // Arrange
      const filtro = { buscaGeral: 'nenhum resultado' };

      const responseData = criarPangeaBuscaResponseMock(0);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert
      expect(result.resultados).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('deve lidar com campos nulos/opcionais na resposta', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      const responseData = {
        aggsEspecies: null,
        aggsOrgaos: null,
        posicao_inicial: null,
        posicao_final: null,
        total: null,
        resultados: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert - schema Zod deve converter nulls para valores padrão
      expect(result.aggsEspecies).toEqual([]);
      expect(result.aggsOrgaos).toEqual([]);
      expect(result.resultados).toEqual([]);
    });

    it('deve preservar highlight e processosParadigma quando presentes', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      const responseData = criarPangeaBuscaResponseMock(1);
      responseData.resultados[0].highlight = {
        tese: '<em>destaque</em>',
      };
      responseData.resultados[0].processosParadigma = [
        { numero: '0000001-00.2024.5.01.0001', link: 'https://example.com' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert
      expect(result.resultados[0].highlight).toBeDefined();
      expect(result.resultados[0].processosParadigma).toHaveLength(1);
    });

    it('deve lidar com network errors', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        repository.buscarPrecedentesRaw({ filtro })
      ).rejects.toThrow('Network error');
    });

    it('deve converter nr de string para number quando aplicável', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      const responseData = criarPangeaBuscaResponseMock(1);
      // API pode retornar nr como string
      (responseData.resultados[0] as any).nr = '123';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert - Zod schema deve converter para number
      expect(typeof result.resultados[0].nr).toBe('number');
      expect(result.resultados[0].nr).toBe(123);
    });

    it('deve aceitar link ausente/null em processosParadigma', async () => {
      // Arrange
      const filtro = { buscaGeral: 'teste' };

      const responseData = criarPangeaBuscaResponseMock(1);
      responseData.resultados[0].processosParadigma = [
        { numero: '0000001-00.2024.5.01.0001', link: null as any },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseData,
      });

      // Act
      const result = await repository.buscarPrecedentesRaw({ filtro });

      // Assert - não deve lançar erro, link deve ser undefined
      expect(result.resultados[0].processosParadigma?.[0].link).toBeUndefined();
    });
  });
});
