/**
 * CONTRATOS INTEGRATION TESTS
 *
 * Testa fluxos completos de criação, atualização e validação de contratos
 * com partes e segmentos, incluindo integrações entre service e repository.
 */

import {
  criarContrato,
  atualizarContrato,
  listarContratos,
  buscarContrato,
} from '../../service';
import {
  saveContrato,
  findContratoById,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
  findAllContratos,
} from '../../repository';
import { ok, appError, err } from '@/types';
import { mockContrato, assertPaginationCorrect, buildMultipleContratos } from '@/testing/integration-helpers';
import type { CreateContratoInput } from '../../domain';

// Mock repository
jest.mock('../../repository');

describe('Contratos Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar contrato com cliente e partes contrárias', async () => {
    // Arrange: Mock repository responses
    const input: CreateContratoInput = {
      clienteId: 1,
      papelClienteNoContrato: 'autora',
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
      partes: [
        {
          tipoEntidade: 'cliente',
          entidadeId: 1,
          papelContratual: 'autora',
          ordem: 0,
        },
        {
          tipoEntidade: 'parte_contraria',
          entidadeId: 2,
          papelContratual: 're',
          ordem: 1,
        },
      ],
    };

    const expectedContrato = mockContrato({
      id: 1,
      clienteId: 1,
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
    });

    (clienteExists as jest.Mock).mockResolvedValue(ok(true));
    (parteContrariaExists as jest.Mock).mockResolvedValue(ok(true));
    (saveContrato as jest.Mock).mockResolvedValue(ok(expectedContrato));

    // Act: Chamar criarContrato do service
    const result = await criarContrato(input);

    // Assert: Verificar chamadas ao repository e dados retornados
    expect(result.success).toBe(true);
    expect(clienteExists).toHaveBeenCalledWith(1); // Validação do cliente principal
    expect(clienteExists).toHaveBeenCalledWith(1); // Validação da parte cliente
    expect(parteContrariaExists).toHaveBeenCalledWith(2); // Validação da parte contrária
    expect(saveContrato).toHaveBeenCalledWith(expect.objectContaining({
      clienteId: 1,
      partes: expect.arrayContaining([
        expect.objectContaining({ tipoEntidade: 'cliente', entidadeId: 1 }),
        expect.objectContaining({ tipoEntidade: 'parte_contraria', entidadeId: 2 }),
      ]),
    }));

    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.clienteId).toBe(1);
    }
  });

  it('deve validar existência de cliente antes de criar', async () => {
    // Arrange: Mock clienteExists retornando false
    const input: CreateContratoInput = {
      clienteId: 999,
      papelClienteNoContrato: 'autora',
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
    };

    (clienteExists as jest.Mock).mockResolvedValue(ok(false));

    // Act: Chamar criarContrato
    const result = await criarContrato(input);

    // Assert: Verificar erro NOT_FOUND
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Cliente');
    }
    expect(saveContrato).not.toHaveBeenCalled();
  });

  it('deve validar partes contrárias nas partes relacionais', async () => {
    // Arrange: Mock parteContrariaExists retornando false
    const input: CreateContratoInput = {
      clienteId: 1,
      papelClienteNoContrato: 'autora',
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
      partes: [
        {
          tipoEntidade: 'parte_contraria',
          entidadeId: 999,
          papelContratual: 're',
          ordem: 0,
        },
      ],
    };

    (clienteExists as jest.Mock).mockResolvedValue(ok(true));
    (parteContrariaExists as jest.Mock).mockResolvedValue(ok(false));

    // Act: Chamar criarContrato com partes
    const result = await criarContrato(input);

    // Assert: Verificar erro NOT_FOUND
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.message).toContain('Parte contrária');
    }
    expect(saveContrato).not.toHaveBeenCalled();
  });

  it('deve falhar com erro de validação se dados inválidos', async () => {
    // Arrange: Input inválido (clienteId negativo)
    const input = {
      clienteId: -1,
      papelClienteNoContrato: 'autora',
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
    } as CreateContratoInput;

    // Act: Chamar criarContrato
    const result = await criarContrato(input);

    // Assert: Verificar erro VALIDATION_ERROR
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(clienteExists).not.toHaveBeenCalled();
    expect(saveContrato).not.toHaveBeenCalled();
  });
});

describe('Contratos Integration - Atualização', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve atualizar contrato e preservar dados anteriores', async () => {
    // Arrange: Mock findContratoById e updateContrato
    const existingContrato = mockContrato({
      id: 1,
      status: 'em_contratacao',
      observacoes: 'Observação original',
    });

    const updateInput = {
      status: 'contratado' as const,
      observacoes: 'Contrato assinado',
    };

    const updatedContrato = mockContrato({
      ...existingContrato,
      ...updateInput,
      dadosAnteriores: {
        status: 'em_contratacao',
        observacoes: 'Observação original',
      },
    });

    (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));
    (updateContratoRepo as jest.Mock).mockResolvedValue(ok(updatedContrato));

    // Act: Chamar atualizarContrato
    const result = await atualizarContrato(1, updateInput);

    // Assert: Verificar dados_anteriores preservados
    expect(result.success).toBe(true);
    expect(findContratoById).toHaveBeenCalledWith(1);
    expect(updateContratoRepo).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 'contratado',
        observacoes: 'Contrato assinado',
      })
    );

    if (result.success) {
      expect(result.data.dadosAnteriores).toBeDefined();
      expect(result.data.dadosAnteriores).toEqual({
        status: 'em_contratacao',
        observacoes: 'Observação original',
      });
    }
  });

  it('deve atualizar partes e recriar vínculos', async () => {
    // Arrange: Mock contrato existente com partes
    const existingContrato = mockContrato({
      id: 1,
      partes: [
        {
          id: 1,
          contratoId: 1,
          tipoEntidade: 'cliente',
          entidadeId: 1,
          papelContratual: 'autora',
          ordem: 0,
          nomeSnapshot: null,
          cpfCnpjSnapshot: null,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const updateInput = {
      partes: [
        {
          tipoEntidade: 'cliente' as const,
          entidadeId: 2,
          papelContratual: 'autora' as const,
          ordem: 0,
        },
      ],
    };

    (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));
    (clienteExists as jest.Mock).mockResolvedValue(ok(true));
    (updateContratoRepo as jest.Mock).mockResolvedValue(ok({
      ...existingContrato,
      partes: [
        {
          id: 2,
          contratoId: 1,
          tipoEntidade: 'cliente',
          entidadeId: 2,
          papelContratual: 'autora',
          ordem: 0,
          nomeSnapshot: null,
          cpfCnpjSnapshot: null,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    // Act: Atualizar com novas partes
    const result = await atualizarContrato(1, updateInput);

    // Assert: Verificar validação de cliente + update chamado
    expect(result.success).toBe(true);
    expect(clienteExists).toHaveBeenCalledWith(2);
    expect(updateContratoRepo).toHaveBeenCalledWith(1, expect.objectContaining({
      partes: expect.arrayContaining([
        expect.objectContaining({ entidadeId: 2 }),
      ]),
    }));
  });

  it('deve falhar se contrato não existir', async () => {
    // Arrange: Mock findContratoById retornando null
    (findContratoById as jest.Mock).mockResolvedValue(ok(null));

    // Act: Tentar atualizar contrato inexistente
    const result = await atualizarContrato(999, { observacoes: 'Teste' });

    // Assert: Verificar erro NOT_FOUND
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(updateContratoRepo).not.toHaveBeenCalled();
  });

  it('deve falhar se nenhum campo fornecido para atualização', async () => {
    // Arrange
    const existingContrato = mockContrato({ id: 1 });
    (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));

    // Act: Chamar atualizarContrato com objeto vazio
    const result = await atualizarContrato(1, {});

    // Assert: Verificar erro BAD_REQUEST
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toContain('Nenhum campo');
    }
    expect(updateContratoRepo).not.toHaveBeenCalled();
  });
});

describe('Contratos Integration - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar contratos com paginação', async () => {
    // Arrange: Mock findAllContratos
    const contratos = buildMultipleContratos(15);
    const paginatedResponse = {
      data: contratos.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasMore: true,
      },
    };

    (findAllContratos as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Chamar listarContratos com params
    const result = await listarContratos({ pagina: 1, limite: 10 });

    // Assert: Verificar paginação correta
    expect(result.success).toBe(true);
    if (result.success) {
      assertPaginationCorrect(result.data, 1, 10, 15);
      expect(result.data.data).toHaveLength(10);
      expect(findAllContratos).toHaveBeenCalledWith(
        expect.objectContaining({ pagina: 1, limite: 10 })
      );
    }
  });

  it('deve aplicar filtros de busca, status e cliente', async () => {
    // Arrange: Mock repository com filtros
    const contratos = buildMultipleContratos(5, {
      status: 'contratado',
      clienteId: 1,
    });

    const paginatedResponse = {
      data: contratos,
      pagination: {
        page: 1,
        limit: 50,
        total: 5,
        totalPages: 1,
        hasMore: false,
      },
    };

    (findAllContratos as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Chamar listarContratos com múltiplos filtros
    const result = await listarContratos({
      busca: 'consultoria',
      status: 'contratado',
      clienteId: 1,
    });

    // Assert: Verificar query construída corretamente
    expect(result.success).toBe(true);
    expect(findAllContratos).toHaveBeenCalledWith(
      expect.objectContaining({
        busca: 'consultoria',
        status: 'contratado',
        clienteId: 1,
        pagina: 1,
        limite: 50,
      })
    );

    if (result.success) {
      expect(result.data.data).toHaveLength(5);
      result.data.data.forEach(contrato => {
        expect(contrato.status).toBe('contratado');
        expect(contrato.clienteId).toBe(1);
      });
    }
  });

  it('deve sanitizar parâmetros de paginação (mínimos e máximos)', async () => {
    // Arrange
    const paginatedResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    (findAllContratos as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Chamar com valores fora dos limites
    const result = await listarContratos({
      pagina: -5, // Deve ser sanitizado para 1
      limite: 500, // Deve ser sanitizado para 100
    });

    // Assert: Verificar sanitização
    expect(result.success).toBe(true);
    expect(findAllContratos).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1,
        limite: 100,
      })
    );
  });

  it('deve aplicar ordenação customizada', async () => {
    // Arrange
    const contratos = buildMultipleContratos(3);
    const paginatedResponse = {
      data: contratos,
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        totalPages: 1,
        hasMore: false,
      },
    };

    (findAllContratos as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Chamar com ordenação
    const result = await listarContratos({
      ordenarPor: 'cadastrado_em',
      ordem: 'desc',
    });

    // Assert: Verificar ordenação aplicada
    expect(result.success).toBe(true);
    expect(findAllContratos).toHaveBeenCalledWith(
      expect.objectContaining({
        ordenarPor: 'cadastrado_em',
        ordem: 'desc',
      })
    );
  });
});

describe('Contratos Integration - Busca por ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar contrato existente por ID', async () => {
    // Arrange
    const contrato = mockContrato({ id: 1 });
    (findContratoById as jest.Mock).mockResolvedValue(ok(contrato));

    // Act
    const result = await buscarContrato(1);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toBeNull();
      expect(result.data?.id).toBe(1);
    }
    expect(findContratoById).toHaveBeenCalledWith(1);
  });

  it('deve retornar null se contrato não encontrado', async () => {
    // Arrange
    (findContratoById as jest.Mock).mockResolvedValue(ok(null));

    // Act
    const result = await buscarContrato(999);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it('deve falhar com ID inválido', async () => {
    // Act
    const result = await buscarContrato(-1);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('BAD_REQUEST');
    }
    expect(findContratoById).not.toHaveBeenCalled();
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = appError('DATABASE_ERROR', 'Erro de conexão');
    (findContratoById as jest.Mock).mockResolvedValue(err(dbError));

    // Act
    const result = await buscarContrato(1);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toBe('Erro de conexão');
    }
  });
});
