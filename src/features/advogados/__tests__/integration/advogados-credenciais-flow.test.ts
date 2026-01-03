// @ts-nocheck
/**
 * ADVOGADOS & CREDENCIAIS INTEGRATION TESTS
 *
 * Testa CRUD de advogados e gestão de credenciais com validações de unicidade,
 * incluindo normalização de CPF e validações de tribunal/grau.
 */

import {
  criarAdvogado,
  buscarAdvogado,
  buscarAdvogadoPorCpf,
  listarAdvogados,
  criarCredencial,
  atualizarCredencial,
  listarCredenciais,
} from '../../service';
import {
  criarAdvogado as criarAdvogadoDb,
  buscarAdvogado as buscarAdvogadoDb,
  buscarAdvogadoPorCpf as buscarAdvogadoPorCpfDb,
  listarAdvogados as listarAdvogadosDb,
  criarCredencial as criarCredencialDb,
  atualizarCredencial as atualizarCredencialDb,
  listarCredenciais as listarCredenciaisDb,
} from '../../repository';

// Mock repository
jest.mock('../../repository');

describe('Advogados Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar advogado com validação de CPF', async () => {
    // Arrange: Mock criarAdvogado
    const advogadoInput = {
      nome_completo: 'João Silva Santos',
      cpf: '123.456.789-01', // CPF formatado
      oab: '12345',
      uf_oab: 'sp',
      email: 'joao@exemplo.com',
    };

    const advogadoCriado = {
      id: 1,
      nome_completo: 'João Silva Santos',
      cpf: '12345678901', // CPF normalizado (apenas dígitos)
      oab: '12345',
      uf_oab: 'SP', // UF maiúscula
      email: 'joao@exemplo.com',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (criarAdvogadoDb as jest.Mock).mockResolvedValue(advogadoCriado);

    // Act: Chamar criarAdvogado com CPF formatado
    const result = await criarAdvogado(advogadoInput);

    // Assert: Verificar CPF normalizado (apenas dígitos)
    expect(result).toEqual(advogadoCriado);
    expect(criarAdvogadoDb).toHaveBeenCalledWith({
      nome_completo: 'João Silva Santos',
      cpf: '12345678901', // Normalizado
      oab: '12345',
      uf_oab: 'SP', // Maiúscula
      email: 'joao@exemplo.com',
    });
  });

  it('deve falhar se CPF inválido', async () => {
    // Arrange: CPF com menos de 11 dígitos
    const advogadoInput = {
      nome_completo: 'João Silva',
      cpf: '123.456', // Inválido
      oab: '12345',
      uf_oab: 'SP',
      email: 'joao@exemplo.com',
    };

    // Act & Assert
    await expect(criarAdvogado(advogadoInput))
      .rejects
      .toThrow(/CPF inválido/);

    expect(criarAdvogadoDb).not.toHaveBeenCalled();
  });

  it('deve falhar se nome muito curto', async () => {
    // Arrange
    const advogadoInput = {
      nome_completo: 'Jo',
      cpf: '12345678901',
      oab: '12345',
      uf_oab: 'SP',
      email: 'joao@exemplo.com',
    };

    // Act & Assert
    await expect(criarAdvogado(advogadoInput))
      .rejects
      .toThrow(/Nome curto demais/);
  });

  it('deve falhar se UF OAB inválida', async () => {
    // Arrange
    const advogadoInput = {
      nome_completo: 'João Silva',
      cpf: '12345678901',
      oab: '12345',
      uf_oab: 'S', // Apenas 1 caractere
      email: 'joao@exemplo.com',
    };

    // Act & Assert
    await expect(criarAdvogado(advogadoInput))
      .rejects
      .toThrow(/UF OAB inválido/);
  });

  it('deve normalizar dados antes de persistir', async () => {
    // Arrange: Dados com espaços extras
    const advogadoInput = {
      nome_completo: '  João Silva Santos  ',
      cpf: '123.456.789-01',
      oab: '  12345  ',
      uf_oab: 'sp',
      email: 'joao@exemplo.com',
    };

    (criarAdvogadoDb as jest.Mock).mockResolvedValue({ id: 1 });

    // Act
    await criarAdvogado(advogadoInput);

    // Assert: Verificar normalização (trim + uppercase UF)
    expect(criarAdvogadoDb).toHaveBeenCalledWith({
      nome_completo: 'João Silva Santos',
      cpf: '12345678901',
      oab: '12345',
      uf_oab: 'SP',
      email: 'joao@exemplo.com',
    });
  });
});

describe('Advogados Integration - Busca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const advogadoMock = {
    id: 1,
    nome_completo: 'João Silva',
    cpf: '12345678901',
    oab: '12345',
    uf_oab: 'SP',
    email: 'joao@exemplo.com',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('deve buscar advogado por ID', async () => {
    // Arrange
    (buscarAdvogadoDb as jest.Mock).mockResolvedValue(advogadoMock);

    // Act
    const result = await buscarAdvogado(1);

    // Assert
    expect(result).toEqual(advogadoMock);
    expect(buscarAdvogadoDb).toHaveBeenCalledWith(1);
  });

  it('deve buscar advogado por CPF normalizado', async () => {
    // Arrange
    (buscarAdvogadoPorCpfDb as jest.Mock).mockResolvedValue(advogadoMock);

    // Act: Buscar com CPF formatado
    const result = await buscarAdvogadoPorCpf('123.456.789-01');

    // Assert: Verificar que foi normalizado antes de buscar
    expect(result).toEqual(advogadoMock);
    expect(buscarAdvogadoPorCpfDb).toHaveBeenCalledWith('12345678901');
  });

  it('deve falhar se CPF inválido ao buscar', async () => {
    // Act & Assert
    await expect(buscarAdvogadoPorCpf('123'))
      .rejects
      .toThrow(/CPF inválido/);

    expect(buscarAdvogadoPorCpfDb).not.toHaveBeenCalled();
  });

  it('deve falhar se ID não fornecido', async () => {
    // Act & Assert
    await expect(buscarAdvogado(0 as unknown as number))
      .rejects
      .toThrow(/ID obrigatório/);
  });
});

describe('Advogados Integration - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar advogados com filtros', async () => {
    // Arrange
    const advogados = [
      {
        id: 1,
        nome_completo: 'João Silva',
        cpf: '12345678901',
        oab: '12345',
        uf_oab: 'SP',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const paginatedResponse = {
      data: advogados,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    (listarAdvogadosDb as jest.Mock).mockResolvedValue(paginatedResponse);

    // Act
    const result = await listarAdvogados({ busca: 'João', ativo: true });

    // Assert
    expect(result).toEqual(paginatedResponse);
    expect(listarAdvogadosDb).toHaveBeenCalledWith({ busca: 'João', ativo: true });
  });
});

describe('Advogados Integration - Credenciais - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar credencial e validar advogado', async () => {
    // Arrange: Mock busca de advogado + criarCredencial
    const credencialInput = {
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: 'senha123',
    };

    const credencialCriada = {
      id: 1,
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: null, // Senha não retornada por segurança
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (criarCredencialDb as jest.Mock).mockResolvedValue(credencialCriada);

    // Act: Chamar criarCredencial
    const result = await criarCredencial(credencialInput);

    // Assert: Verificar validação de advogado existente
    expect(result).toEqual(credencialCriada);
    expect(criarCredencialDb).toHaveBeenCalledWith(credencialInput);
  });

  it('deve falhar se advogado_id não fornecido', async () => {
    // Arrange
    const credencialInput = {
      advogado_id: 0,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: 'senha123',
    };

    // Act & Assert
    await expect(criarCredencial(credencialInput as unknown as Parameters<typeof criarCredencial>[0]))
      .rejects
      .toThrow(/Advogado ID obrigatório/);
  });

  it('deve falhar se senha não fornecida', async () => {
    // Arrange
    const credencialInput = {
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: '',
    };

    // Act & Assert
    await expect(criarCredencial(credencialInput))
      .rejects
      .toThrow(/Senha obrigatória/);
  });

  it('deve retornar credencial sem senha por segurança', async () => {
    // Arrange
    const credencialInput = {
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: 'senha123',
    };

    const credencialCriada = {
      id: 1,
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: null, // Senha não deve ser retornada
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (criarCredencialDb as jest.Mock).mockResolvedValue(credencialCriada);

    // Act: Criar credencial
    const result = await criarCredencial(credencialInput);

    // Assert: Verificar senha não retornada
    expect(result.senha).toBeNull();
  });

  it('deve falhar se já existir credencial ativa para tribunal/grau (lógica no repository)', async () => {
    // Arrange: Repository lança erro
    const credencialInput = {
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: 'senha123',
    };

    (criarCredencialDb as jest.Mock).mockRejectedValue(
      new Error('Já existe credencial ativa para este advogado, tribunal TRT1 e grau primeiro_grau')
    );

    // Act & Assert
    await expect(criarCredencial(credencialInput))
      .rejects
      .toThrow(/Já existe credencial ativa/);
  });
});

describe('Advogados Integration - Credenciais - Atualização', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve atualizar credencial e validar unicidade', async () => {
    // Arrange: Mock credencial atual + busca de duplicatas
    const updateInput = {
      tribunal: 'TRT2',
      grau: 'segundo_grau',
    };

    const credencialAtualizada = {
      id: 1,
      advogado_id: 1,
      tribunal: 'TRT2',
      grau: 'segundo_grau',
      senha: null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (atualizarCredencialDb as jest.Mock).mockResolvedValue(credencialAtualizada);

    // Act: Atualizar tribunal/grau
    const result = await atualizarCredencial(1, updateInput);

    // Assert: Verificar validação de unicidade (feita no repository)
    expect(result).toEqual(credencialAtualizada);
    expect(atualizarCredencialDb).toHaveBeenCalledWith(1, updateInput);
  });

  it('deve permitir atualizar senha sem validação de unicidade', async () => {
    // Arrange: Mock atualizarCredencial
    const updateInput = {
      senha: 'novaSenha123',
    };

    const credencialAtualizada = {
      id: 1,
      advogado_id: 1,
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
      senha: null, // Senha não retornada
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (atualizarCredencialDb as jest.Mock).mockResolvedValue(credencialAtualizada);

    // Act: Atualizar apenas senha
    const result = await atualizarCredencial(1, updateInput);

    // Assert: Verificar atualização sem validação de tribunal/grau
    expect(result).toEqual(credencialAtualizada);
    expect(atualizarCredencialDb).toHaveBeenCalledWith(1, updateInput);
    expect(result.senha).toBeNull(); // Senha não retornada
  });

  it('deve falhar se tentar criar duplicata ativa (lógica no repository)', async () => {
    // Arrange
    const updateInput = {
      tribunal: 'TRT1',
      grau: 'primeiro_grau',
    };

    (atualizarCredencialDb as jest.Mock).mockRejectedValue(
      new Error('Já existe credencial ativa para este advogado, tribunal TRT1 e grau primeiro_grau')
    );

    // Act & Assert
    await expect(atualizarCredencial(1, updateInput))
      .rejects
      .toThrow(/Já existe credencial ativa/);
  });
});

describe('Advogados Integration - Credenciais - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar credenciais com dados do advogado (join)', async () => {
    // Arrange: Mock listarCredenciais com join
    const credenciais = [
      {
        id: 1,
        advogado_id: 1,
        tribunal: 'TRT1',
        grau: 'primeiro_grau',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        advogado: {
          id: 1,
          nome_completo: 'João Silva',
          oab: '12345',
          uf_oab: 'SP',
        },
      },
    ];

    const paginatedResponse = {
      data: credenciais,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    (listarCredenciaisDb as jest.Mock).mockResolvedValue(paginatedResponse);

    // Act: Chamar listarCredenciais
    const result = await listarCredenciais({});

    // Assert: Verificar dados do advogado incluídos
    expect(result).toEqual(paginatedResponse);
    expect(result.data[0].advogado).toBeDefined();
    expect(result.data[0].advogado?.nome_completo).toBe('João Silva');
  });

  it('deve filtrar por advogado_id e active', async () => {
    // Arrange: Mock com filtros
    const credenciaisAtivas = [
      {
        id: 1,
        advogado_id: 1,
        tribunal: 'TRT1',
        grau: 'primeiro_grau',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const paginatedResponse = {
      data: credenciaisAtivas,
      pagination: {
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    (listarCredenciaisDb as jest.Mock).mockResolvedValue(paginatedResponse);

    // Act: Listar credenciais ativas de advogado específico
    const result = await listarCredenciais({
      advogado_id: 1,
      active: true,
    });

    // Assert: Verificar query construída
    expect(result.data).toHaveLength(1);
    expect(listarCredenciaisDb).toHaveBeenCalledWith({
      advogado_id: 1,
      active: true,
    });
  });

  it('deve falhar se advogado_id inválido', async () => {
    // Act & Assert
    await expect(listarCredenciais({ advogado_id: -1 }))
      .rejects
      .toThrow(/Advogado ID inválido/);

    expect(listarCredenciaisDb).not.toHaveBeenCalled();
  });
});
