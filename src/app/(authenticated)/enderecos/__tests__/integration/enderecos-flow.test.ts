import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarEnderecoMock } from '../fixtures';
import { ok as _ok } from '@/types';

// Mock Supabase
type MockSupabaseClient = {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
};

const mockSupabaseClient = {} as MockSupabaseClient;
mockSupabaseClient.from = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.select = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.insert = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.update = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.upsert = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.eq = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.or = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.order = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.range = jest.fn(() => mockSupabaseClient);
mockSupabaseClient.single = jest.fn();

jest.mock('@/lib/supabase', () => ({
  createDbClient: jest.fn(() => mockSupabaseClient),
}));

describe('Endereços - Fluxos de Integração', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient.single.mockReset();
    mockSupabaseClient.range.mockReset();
    mockSupabaseClient.order.mockReset();
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.upsert.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.or.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.range.mockReturnValue(mockSupabaseClient);
  });

  describe('Fluxo CRUD Completo', () => {
    it('deve criar → buscar → atualizar → deletar endereço', async () => {
      // Arrange
      const enderecoCriado = criarEnderecoMock({ id: 1 });
      const enderecoAtualizado = criarEnderecoMock({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      // Mock criar
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: enderecoCriado,
        error: null,
      });

      // Mock buscar
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: enderecoCriado,
        error: null,
      });

      // Mock atualizar
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: enderecoAtualizado,
        error: null,
      });

      // Act - Criar
      const resultCriar = await repository.criarEndereco({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      });

      expect(resultCriar.success).toBe(true);

      // Act - Buscar
      const resultBuscar = await repository.buscarEnderecoPorId(1);

      expect(resultBuscar.success).toBe(true);
      if (resultBuscar.success) {
        expect(resultBuscar.data.id).toBe(1);
      }

      // Act - Atualizar
      const resultAtualizar = await repository.atualizarEndereco({
        id: 1,
        logradouro: 'Rua Atualizada',
      });

      expect(resultAtualizar.success).toBe(true);
      if (resultAtualizar.success) {
        expect(resultAtualizar.data.logradouro).toBe('Rua Atualizada');
      }

      // Mock deletar
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      // Act - Deletar
      const resultDeletar = await repository.deletarEndereco(1);

      expect(resultDeletar.success).toBe(true);
    });
  });

  describe('Fluxo de Listagem com Paginação', () => {
    it('deve criar múltiplos endereços → listar com paginação → filtrar', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({ id: 1, logradouro: 'Rua A' }),
        criarEnderecoMock({ id: 2, logradouro: 'Rua B' }),
        criarEnderecoMock({ id: 3, logradouro: 'Rua C' }),
      ];

      // Mock criar múltiplos
      for (let i = 0; i < 3; i++) {
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: enderecos[i],
          error: null,
        });
      }

      // Mock listar com paginação
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: enderecos.slice(0, 2),
        error: null,
        count: 3,
      });

      // Act - Criar
      for (let i = 0; i < 3; i++) {
        const result = await repository.criarEndereco({
          entidade_tipo: 'cliente',
          entidade_id: 100,
          logradouro: `Rua ${String.fromCharCode(65 + i)}`,
          municipio: 'São Paulo',
          estado: 'SP',
          cep: '01310100',
        });

        expect(result.success).toBe(true);
      }

      // Act - Listar
      const resultListar = await repository.listarEnderecos({
        pagina: 1,
        limite: 2,
      });

      expect(resultListar.success).toBe(true);
      if (resultListar.success) {
        expect(resultListar.data.enderecos).toHaveLength(2);
        expect(resultListar.data.total).toBe(3);
        expect(resultListar.data.totalPaginas).toBe(2);
      }
    });
  });

  describe('Fluxo de Busca por Entidade', () => {
    it('deve buscar endereços por entidade → validar ordenação', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({
          id: 1,
          correspondencia: true,
          situacao: 'A',
        }),
        criarEnderecoMock({
          id: 2,
          correspondencia: false,
          situacao: 'I',
        }),
      ];

      mockSupabaseClient.order.mockResolvedValueOnce({
        data: enderecos,
        error: null,
      });

      // Act
      const result = await repository.buscarEnderecosPorEntidade({
        entidade_tipo: 'cliente',
        entidade_id: 100,
      });

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        // Verifica se foi ordenado por correspondencia desc, situacao asc
        expect(mockSupabaseClient.order).toHaveBeenCalledWith('correspondencia', {
          ascending: false,
        });
      }
    });
  });

  describe('Fluxo de Upsert por id_pje', () => {
    it('deve fazer upsert → validar conflito e atualização', async () => {
      // Arrange
      const enderecoInicial = criarEnderecoMock({
        id: 1,
        id_pje: 123,
        logradouro: 'Rua Inicial',
      });

      const enderecoAtualizado = criarEnderecoMock({
        id: 1,
        id_pje: 123,
        logradouro: 'Rua Atualizada',
      });

      // Mock primeiro upsert (insert)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: enderecoInicial,
        error: null,
      });

      // Mock segundo upsert (update em conflito)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: enderecoAtualizado,
        error: null,
      });

      // Act - Primeiro upsert (cria)
      const resultCriar = await repository.upsertEnderecoPorIdPje({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        id_pje: 123,
        logradouro: 'Rua Inicial',
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      });

      expect(resultCriar.success).toBe(true);
      if (resultCriar.success) {
        expect(resultCriar.data.logradouro).toBe('Rua Inicial');
      }

      // Act - Segundo upsert (atualiza em conflito)
      const resultAtualizar = await repository.upsertEnderecoPorIdPje({
        entidade_tipo: 'cliente',
        entidade_id: 100,
        id_pje: 123,
        logradouro: 'Rua Atualizada',
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      });

      expect(resultAtualizar.success).toBe(true);
      if (resultAtualizar.success) {
        expect(resultAtualizar.data.logradouro).toBe('Rua Atualizada');
      }

      // Assert - Verificar chamadas upsert
      expect(mockSupabaseClient.upsert).toHaveBeenCalledTimes(2);
      expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ id_pje: 123 }),
        {
          onConflict: 'id_pje,entidade_tipo,entidade_id',
          ignoreDuplicates: false,
        }
      );
    });
  });

  describe('Fluxo de Filtros Complexos', () => {
    it('deve aplicar múltiplos filtros e busca', async () => {
      // Arrange
      const enderecos = [
        criarEnderecoMock({
          id: 1,
          entidade_tipo: 'cliente',
          municipio: 'São Paulo',
          ativo: true,
        }),
      ];

      mockSupabaseClient.range.mockResolvedValueOnce({
        data: enderecos,
        error: null,
        count: 1,
      });

      // Act
      const result = await repository.listarEnderecos({
        entidade_tipo: 'cliente',
        ativo: true,
        busca: 'São Paulo',
        pagina: 1,
        limite: 50,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('entidade_tipo', 'cliente');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('ativo', true);
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('São Paulo')
      );
    });
  });
});
