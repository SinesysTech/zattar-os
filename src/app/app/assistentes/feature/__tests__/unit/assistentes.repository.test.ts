import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as repository from '../../repository';
import { criarAssistenteMock } from '../fixtures';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(() => mockSupabase),
}));

describe('Assistentes Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve listar assistentes ativos', async () => {
      // Arrange
      const assistentes = [
        criarAssistenteMock({ id: 1, ativo: true }),
        criarAssistenteMock({ id: 2, ativo: true }),
      ];

      mockSupabase.single.mockResolvedValue({ data: assistentes, error: null });
      mockSupabase.eq.mockResolvedValue({ data: assistentes, error: null });

      // Act
      const result = await repository.findAll({ ativo: true });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('assistentes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('ativo', true);
      expect(result).toHaveLength(2);
    });

    it('deve aplicar filtro de busca em nome e descrição', async () => {
      // Arrange
      const assistentes = [criarAssistenteMock({ nome: 'Teste Busca' })];
      mockSupabase.eq.mockResolvedValue({ data: assistentes, error: null });

      // Act
      await repository.findAll({ busca: 'Teste', ativo: true });

      // Assert
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('nome.ilike.%Teste%')
      );
    });

    it('deve ordenar por data de criação decrescente', async () => {
      // Arrange
      mockSupabase.eq.mockResolvedValue({ data: [], error: null });

      // Act
      await repository.findAll({ ativo: true });

      // Assert
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('deve retornar array vazio quando sem resultados', async () => {
      // Arrange
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await repository.findAll({ ativo: true });

      // Assert
      expect(result).toEqual([]);
    });

    it('deve lançar erro quando falha no banco', async () => {
      // Arrange
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(repository.findAll({ ativo: true })).rejects.toThrow(
        'Erro ao listar assistentes'
      );
    });
  });

  describe('findById', () => {
    it('deve buscar assistente por ID', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1 });
      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      const result = await repository.findById(1);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('assistentes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(assistente);
    });

    it('deve retornar null quando assistente não encontrado (PGRST116)', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Act
      const result = await repository.findById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('deve lançar erro para outros erros do banco', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      // Act & Assert
      await expect(repository.findById(1)).rejects.toThrow(
        'Erro ao buscar assistente'
      );
    });
  });

  describe('create', () => {
    it('deve criar assistente com sucesso', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      const input = {
        nome: 'Novo Assistente',
        descricao: 'Descrição',
        iframe_code: '<iframe src="test"></iframe>',
        criado_por: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      const result = await repository.create(input);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('assistentes');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Novo Assistente',
          criado_por: 1,
          ativo: true,
        })
      );
      expect(result).toEqual(assistente);
    });

    it('deve fazer trim em campos de texto', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      const input = {
        nome: '  Nome com espaços  ',
        descricao: '  Descrição  ',
        iframe_code: '  <iframe></iframe>  ',
        criado_por: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      await repository.create(input);

      // Assert
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Nome com espaços',
          descricao: 'Descrição',
          iframe_code: '<iframe></iframe>',
        })
      );
    });

    it('deve converter descrição vazia para null', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      const input = {
        nome: 'Teste',
        descricao: '',
        iframe_code: '<iframe></iframe>',
        criado_por: 1,
      };

      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      await repository.create(input);

      // Assert
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          descricao: null,
        })
      );
    });

    it('deve lançar erro quando falha no banco', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(
        repository.create({
          nome: 'Teste',
          iframe_code: '<iframe></iframe>',
          criado_por: 1,
        })
      ).rejects.toThrow('Erro ao criar assistente');
    });
  });

  describe('update', () => {
    it('deve atualizar assistente com sucesso', async () => {
      // Arrange
      const assistente = criarAssistenteMock({ id: 1, nome: 'Atualizado' });
      const input = {
        nome: 'Atualizado',
        ativo: false,
      };

      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      const result = await repository.update(1, input);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('assistentes');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Atualizado',
          ativo: false,
        })
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(assistente);
    });

    it('deve fazer trim em campos atualizados', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      await repository.update(1, {
        nome: '  Nome  ',
        descricao: '  Desc  ',
      });

      // Assert
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Nome',
          descricao: 'Desc',
        })
      );
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      // Arrange
      const assistente = criarAssistenteMock();
      mockSupabase.single.mockResolvedValue({ data: assistente, error: null });

      // Act
      await repository.update(1, { ativo: false });

      // Assert
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false })
      );
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.not.objectContaining({ nome: expect.anything() })
      );
    });

    it('deve lançar erro quando falha no banco', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(repository.update(1, { nome: 'Teste' })).rejects.toThrow(
        'Erro ao atualizar assistente'
      );
    });
  });

  describe('deleteAssistente', () => {
    it('deve deletar assistente com sucesso', async () => {
      // Arrange
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await repository.deleteAssistente(1);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('assistentes');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toBe(true);
    });

    it('deve lançar erro quando falha no banco', async () => {
      // Arrange
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Act & Assert
      await expect(repository.deleteAssistente(1)).rejects.toThrow(
        'Erro ao deletar assistente'
      );
    });
  });
});
