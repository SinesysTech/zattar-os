// @ts-nocheck
/**
 * CARGOS INTEGRATION TESTS
 *
 * Testa CRUD completo com validações de unicidade e usuários vinculados,
 * incluindo invalidação de cache (Redis).
 */

import {
  criarCargo,
  atualizarCargo,
  deletarCargo,
  listarCargos,
  buscarCargo,
} from '../../service';
import {
  listarCargos as listarCargosDb,
  buscarCargoPorId,
  buscarCargoPorNome,
  criarCargo as criarCargoDb,
  atualizarCargo as atualizarCargoDb,
  deletarCargo as deletarCargoDb,
  contarUsuariosComCargo,
  listarUsuariosComCargo,
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Cargos Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar cargo com sucesso', async () => {
    // Arrange: Mock buscarCargoPorNome retornando null, criarCargo
    const cargoInput = {
      nome: 'Advogado Sênior',
      descricao: 'Advogado com mais de 5 anos de experiência',
    };

    const cargoCriado = {
      id: 1,
      nome: 'Advogado Sênior',
      descricao: 'Advogado com mais de 5 anos de experiência',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (buscarCargoPorNome as jest.Mock).mockResolvedValue(null);
    (criarCargoDb as jest.Mock).mockResolvedValue(cargoCriado);

    // Act: Chamar criarCargo
    const result = await criarCargo(cargoInput, 1);

    // Assert: Verificar cargo criado + cache invalidado
    expect(result).toEqual(cargoCriado);
    expect(buscarCargoPorNome).toHaveBeenCalledWith('Advogado Sênior');
    expect(criarCargoDb).toHaveBeenCalledWith(cargoInput, 1);
  });

  it('deve falhar se nome já existir', async () => {
    // Arrange: Mock buscarCargoPorNome retornando cargo existente
    const cargoInput = {
      nome: 'Advogado Sênior',
      descricao: 'Descrição duplicada',
    };

    const cargoExistente = {
      id: 10,
      nome: 'Advogado Sênior',
      descricao: 'Descrição original',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (buscarCargoPorNome as jest.Mock).mockResolvedValue(cargoExistente);

    // Act & Assert: Tentar criar com mesmo nome
    await expect(criarCargo(cargoInput, 1))
      .rejects
      .toThrow(/já existe/);

    expect(criarCargoDb).not.toHaveBeenCalled();
  });

  it('deve normalizar nome antes de validar (trim)', async () => {
    // Arrange: Nome com espaços extras
    const cargoInput = {
      nome: '  Advogado Sênior  ',
      descricao: 'Teste',
    };

    (buscarCargoPorNome as jest.Mock).mockResolvedValue(null);
    (criarCargoDb as jest.Mock).mockResolvedValue({ id: 1, nome: 'Advogado Sênior' });

    // Act
    await criarCargo(cargoInput, 1);

    // Assert: Verificar que foi feito trim
    expect(buscarCargoPorNome).toHaveBeenCalledWith('Advogado Sênior');
  });
});

describe('Cargos Integration - Atualização', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cargoExistente = {
    id: 1,
    nome: 'Advogado Júnior',
    descricao: 'Descrição original',
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('deve atualizar cargo e invalidar cache', async () => {
    // Arrange: Mock buscarCargoPorId, atualizarCargo
    const updateInput = {
      descricao: 'Descrição atualizada',
    };

    const cargoAtualizado = {
      ...cargoExistente,
      descricao: 'Descrição atualizada',
      updatedAt: new Date().toISOString(),
    };

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (atualizarCargoDb as jest.Mock).mockResolvedValue(cargoAtualizado);

    // Act: Chamar atualizarCargo
    const result = await atualizarCargo(1, updateInput);

    // Assert: Verificar atualização + cache invalidado
    expect(result).toEqual(cargoAtualizado);
    expect(buscarCargoPorId).toHaveBeenCalledWith(1);
    expect(atualizarCargoDb).toHaveBeenCalledWith(1, updateInput);
  });

  it('deve validar unicidade ao alterar nome', async () => {
    // Arrange: Mock cargo existente + buscarCargoPorNome retornando outro cargo
    const updateInput = {
      nome: 'Advogado Sênior',
    };

    const outroCargo = {
      id: 2,
      nome: 'Advogado Sênior',
      descricao: 'Outro cargo',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (buscarCargoPorNome as jest.Mock).mockResolvedValue(outroCargo);

    // Act & Assert: Tentar atualizar para nome existente
    await expect(atualizarCargo(1, updateInput))
      .rejects
      .toThrow(/já existe/);

    expect(atualizarCargoDb).not.toHaveBeenCalled();
  });

  it('deve permitir atualizar sem alterar nome', async () => {
    // Arrange: Atualizar apenas descrição
    const updateInput = {
      descricao: 'Nova descrição',
    };

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (atualizarCargoDb as jest.Mock).mockResolvedValue({
      ...cargoExistente,
      descricao: 'Nova descrição',
    });

    // Act
    const result = await atualizarCargo(1, updateInput);

    // Assert: Verificar que não validou nome (não chamou buscarCargoPorNome)
    expect(result).toBeDefined();
    expect(buscarCargoPorNome).not.toHaveBeenCalled();
    expect(atualizarCargoDb).toHaveBeenCalled();
  });

  it('deve permitir manter mesmo nome (case insensitive)', async () => {
    // Arrange: Alterar apenas capitalização
    const updateInput = {
      nome: 'ADVOGADO JÚNIOR', // Mesmo nome, maiúsculas
    };

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (atualizarCargoDb as jest.Mock).mockResolvedValue({
      ...cargoExistente,
      nome: 'ADVOGADO JÚNIOR',
    });

    // Act
    await atualizarCargo(1, updateInput);

    // Assert: Não deve verificar unicidade (é o mesmo cargo)
    expect(buscarCargoPorNome).not.toHaveBeenCalled();
    expect(atualizarCargoDb).toHaveBeenCalled();
  });

  it('deve falhar se cargo não encontrado', async () => {
    // Arrange
    (buscarCargoPorId as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(atualizarCargo(999, { descricao: 'Teste' }))
      .rejects
      .toThrow(/não encontrado/);

    expect(atualizarCargoDb).not.toHaveBeenCalled();
  });
});

describe('Cargos Integration - Deleção', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cargoExistente = {
    id: 1,
    nome: 'Advogado Júnior',
    descricao: 'Descrição',
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('deve deletar cargo sem usuários vinculados', async () => {
    // Arrange: Mock contarUsuariosComCargo retornando 0, deletarCargo
    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (contarUsuariosComCargo as jest.Mock).mockResolvedValue(0);
    (deletarCargoDb as jest.Mock).mockResolvedValue(undefined);

    // Act: Chamar deletarCargo
    await deletarCargo(1);

    // Assert: Verificar deleção + cache invalidado
    expect(buscarCargoPorId).toHaveBeenCalledWith(1);
    expect(contarUsuariosComCargo).toHaveBeenCalledWith(1);
    expect(deletarCargoDb).toHaveBeenCalledWith(1);
  });

  it('deve falhar se houver usuários vinculados', async () => {
    // Arrange: Mock contarUsuariosComCargo retornando 3, listarUsuariosComCargo
    const usuariosVinculados = [
      { id: 10, nome_completo: 'João Silva', email_corporativo: 'joao@exemplo.com' },
      { id: 20, nome_completo: 'Maria Santos', email_corporativo: 'maria@exemplo.com' },
      { id: 30, nome_completo: 'Pedro Costa', email_corporativo: 'pedro@exemplo.com' },
    ];

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargoExistente);
    (contarUsuariosComCargo as jest.Mock).mockResolvedValue(3);
    (listarUsuariosComCargo as jest.Mock).mockResolvedValue(usuariosVinculados);

    // Act & Assert: Tentar deletar
    await expect(deletarCargo(1))
      .rejects
      .toThrow(/usuários associados/);

    // Verificar que o erro contém informações dos usuários
    try {
      await deletarCargo(1);
    } catch (error) {
      const errorData = JSON.parse((error as Error).message);
      expect(errorData.totalUsuarios).toBe(3);
      expect(errorData.usuarios).toHaveLength(3);
      expect(errorData.cargoNome).toBe('Advogado Júnior');
    }

    expect(deletarCargoDb).not.toHaveBeenCalled();
  });

  it('deve falhar se cargo não encontrado', async () => {
    // Arrange
    (buscarCargoPorId as jest.Mock).mockResolvedValue(null);

    // Act & Assert
    await expect(deletarCargo(999))
      .rejects
      .toThrow(/não encontrado/);

    expect(contarUsuariosComCargo).not.toHaveBeenCalled();
    expect(deletarCargoDb).not.toHaveBeenCalled();
  });
});

describe('Cargos Integration - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar cargos com paginação e cache', async () => {
    // Arrange: Mock listarCargos + Redis cache
    const cargos = [
      {
        id: 1,
        nome: 'Advogado Júnior',
        descricao: 'Descrição 1',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        nome: 'Advogado Pleno',
        descricao: 'Descrição 2',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const paginatedResponse = {
      data: cargos,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    };

    (listarCargosDb as jest.Mock).mockResolvedValue(paginatedResponse);

    // Act: Chamar listarCargos
    const result = await listarCargos({ pagina: 1, limite: 10 });

    // Assert: Verificar listagem
    expect(result).toEqual(paginatedResponse);
    expect(result.data).toHaveLength(2);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.total).toBe(2);
    expect(listarCargosDb).toHaveBeenCalledWith({ pagina: 1, limite: 10 });
  });

  it('deve aplicar filtros de busca e ativo', async () => {
    // Arrange: Mock com filtros
    const cargosAtivos = [
      {
        id: 1,
        nome: 'Advogado Júnior',
        descricao: 'Descrição',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const paginatedResponse = {
      data: cargosAtivos,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    (listarCargosDb as jest.Mock).mockResolvedValue(paginatedResponse);

    // Act: Listar com busca + ativo=true
    const result = await listarCargos({
      busca: 'Advogado',
      ativo: true,
    });

    // Assert: Verificar query construída
    expect(result.data).toHaveLength(1);
    expect(listarCargosDb).toHaveBeenCalledWith({
      busca: 'Advogado',
      ativo: true,
    });
  });

  it('deve retornar lista vazia se nenhum cargo encontrado', async () => {
    // Arrange
    const emptyResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    (listarCargosDb as jest.Mock).mockResolvedValue(emptyResponse);

    // Act
    const result = await listarCargos({ busca: 'Inexistente' });

    // Assert
    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });
});

describe('Cargos Integration - Busca por ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar cargo existente por ID', async () => {
    // Arrange
    const cargo = {
      id: 1,
      nome: 'Advogado Júnior',
      descricao: 'Descrição',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (buscarCargoPorId as jest.Mock).mockResolvedValue(cargo);

    // Act
    const result = await buscarCargo(1);

    // Assert
    expect(result).toEqual(cargo);
    expect(buscarCargoPorId).toHaveBeenCalledWith(1);
  });

  it('deve retornar null se cargo não encontrado', async () => {
    // Arrange
    (buscarCargoPorId as jest.Mock).mockResolvedValue(null);

    // Act
    const result = await buscarCargo(999);

    // Assert
    expect(result).toBeNull();
    expect(buscarCargoPorId).toHaveBeenCalledWith(999);
  });
});
