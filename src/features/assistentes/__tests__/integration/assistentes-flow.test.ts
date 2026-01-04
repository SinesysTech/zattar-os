import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import { criarAssistenteMock } from '../fixtures';

jest.mock('../../repository');

describe('Assistentes Integration - CRUD Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar fluxo completo: criar → listar → buscar → atualizar → deletar', async () => {
    // ========================================================================
    // 1. CRIAR assistente
    // ========================================================================
    const inputCriar = {
      nome: 'Assistente Integração',
      descricao: 'Teste de integração completo',
      iframe_code: '<iframe src="https://integration-test.com"></iframe>',
    };

    const assistenteCriado = criarAssistenteMock({
      id: 100,
      ...inputCriar,
      criado_por: 1,
    });

    (repository.create as jest.Mock).mockResolvedValue(assistenteCriado);

    const resultCriar = await service.criarAssistente(inputCriar, 1);

    expect(resultCriar.id).toBe(100);
    expect(resultCriar.nome).toBe('Assistente Integração');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Assistente Integração',
        criado_por: 1,
      })
    );

    // ========================================================================
    // 2. LISTAR assistentes (deve incluir o criado)
    // ========================================================================
    const assistentesLista = [
      assistenteCriado,
      criarAssistenteMock({ id: 101 }),
    ];

    (repository.findAll as jest.Mock).mockResolvedValue(assistentesLista);

    const resultListar = await service.listarAssistentes({ ativo: true });

    expect(resultListar).toHaveLength(2);
    expect(resultListar[0].id).toBe(100);
    expect(repository.findAll).toHaveBeenCalledWith({ ativo: true });

    // ========================================================================
    // 3. BUSCAR assistente específico por ID
    // ========================================================================
    (repository.findById as jest.Mock).mockResolvedValue(assistenteCriado);

    const resultBuscar = await service.buscarAssistentePorId(100);

    expect(resultBuscar).not.toBeNull();
    expect(resultBuscar?.id).toBe(100);
    expect(resultBuscar?.nome).toBe('Assistente Integração');
    expect(repository.findById).toHaveBeenCalledWith(100);

    // ========================================================================
    // 4. ATUALIZAR assistente
    // ========================================================================
    const assistenteAtualizado = criarAssistenteMock({
      ...assistenteCriado,
      nome: 'Assistente Atualizado',
      descricao: 'Descrição atualizada',
    });

    (repository.findById as jest.Mock).mockResolvedValue(assistenteCriado);
    (repository.update as jest.Mock).mockResolvedValue(assistenteAtualizado);

    const resultAtualizar = await service.atualizarAssistente(100, {
      nome: 'Assistente Atualizado',
      descricao: 'Descrição atualizada',
    });

    expect(resultAtualizar.nome).toBe('Assistente Atualizado');
    expect(resultAtualizar.descricao).toBe('Descrição atualizada');
    expect(repository.update).toHaveBeenCalledWith(
      100,
      expect.objectContaining({
        nome: 'Assistente Atualizado',
        descricao: 'Descrição atualizada',
      })
    );

    // ========================================================================
    // 5. DELETAR assistente (soft delete)
    // ========================================================================
    (repository.findById as jest.Mock).mockResolvedValue(assistenteAtualizado);
    (repository.deleteAssistente as jest.Mock).mockResolvedValue(true);

    const resultDeletar = await service.deletarAssistente(100);

    expect(resultDeletar).toBe(true);
    expect(repository.deleteAssistente).toHaveBeenCalledWith(100);

    // ========================================================================
    // 6. VERIFICAR que assistente não é mais encontrado após delete
    // ========================================================================
    (repository.findById as jest.Mock).mockResolvedValue(null);

    const resultBuscarDepoisDelete = await service.buscarAssistentePorId(100);

    expect(resultBuscarDepoisDelete).toBeNull();
  });

  it('deve executar fluxo de busca com filtros', async () => {
    // Arrange
    const assistentes = [
      criarAssistenteMock({ id: 1, nome: 'Assistente IA Chat' }),
      criarAssistenteMock({ id: 2, nome: 'Assistente IA Resumo' }),
    ];

    (repository.findAll as jest.Mock).mockResolvedValue(assistentes);

    // Act - buscar com filtro
    const result = await service.listarAssistentes({
      busca: 'IA',
      ativo: true,
    });

    // Assert
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalledWith({
      busca: 'IA',
      ativo: true,
    });
  });

  it('deve lidar com tentativa de atualizar assistente inexistente', async () => {
    // Arrange
    (repository.findById as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.atualizarAssistente(999, { nome: 'Teste' })
    ).rejects.toThrow('Assistente não encontrado');

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deve lidar com tentativa de deletar assistente inexistente', async () => {
    // Arrange
    (repository.findById as jest.Mock).mockResolvedValue(null);

    // Act
    const result = await service.deletarAssistente(999);

    // Assert
    expect(result).toBe(false);
    expect(repository.deleteAssistente).not.toHaveBeenCalled();
  });

  it('deve validar dados ao criar assistente', async () => {
    // Arrange - dados inválidos (nome muito longo)
    const inputInvalido = {
      nome: 'A'.repeat(201),
      iframe_code: '<iframe></iframe>',
    };

    // Act & Assert
    await expect(
      service.criarAssistente(inputInvalido, 1)
    ).rejects.toThrow('Dados inválidos');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('deve sanitizar iframe_code ao criar', async () => {
    // Arrange
    const inputComScript = {
      nome: 'Teste',
      iframe_code: '<iframe src="test"></iframe><script>alert("xss")</script>',
    };

    const assistenteCriado = criarAssistenteMock();
    (repository.create as jest.Mock).mockResolvedValue(assistenteCriado);

    // Act
    await service.criarAssistente(inputComScript, 1);

    // Assert
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        iframe_code: expect.not.stringContaining('script'),
      })
    );
  });

  it('deve permitir criar múltiplos assistentes', async () => {
    // Arrange & Act
    const assistente1 = criarAssistenteMock({ id: 1, nome: 'Assistente 1' });
    const assistente2 = criarAssistenteMock({ id: 2, nome: 'Assistente 2' });

    (repository.create as jest.Mock)
      .mockResolvedValueOnce(assistente1)
      .mockResolvedValueOnce(assistente2);

    const result1 = await service.criarAssistente(
      {
        nome: 'Assistente 1',
        iframe_code: '<iframe></iframe>',
      },
      1
    );

    const result2 = await service.criarAssistente(
      {
        nome: 'Assistente 2',
        iframe_code: '<iframe></iframe>',
      },
      1
    );

    // Assert
    expect(result1.id).toBe(1);
    expect(result2.id).toBe(2);
    expect(repository.create).toHaveBeenCalledTimes(2);
  });
});
