/**
 * EXPEDIENTES INTEGRATION TESTS
 *
 * Testa fluxos completos de criação, baixa, reversão e auditoria de expedientes,
 * incluindo integrações com RPC e validações entre camadas.
 */

import {
  criarExpediente,
  realizarBaixa,
  reverterBaixa,
  atribuirResponsavel,
  listarExpedientes,
} from '../../service';
import { GrauTribunal, OrigemExpediente } from '../../domain';
import {
  saveExpediente,
  findExpedienteById,
  baixarExpediente,
  reverterBaixaExpediente,
  processoExists,
  tipoExpedienteExists,
  findAllExpedientes,
} from '../../repository';
import { ok } from '@/types';
import { mockExpediente, assertPaginationCorrect, buildMultipleExpedientes } from '@/testing/integration-helpers';
import { createDbClient } from '@/lib/supabase';

// Mock repository e Supabase
jest.mock('../../repository');
jest.mock('@/lib/supabase');

describe('Expedientes Integration - Criação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar expediente com validação de processo', async () => {
    // Arrange: Mock processoExists e saveExpediente
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      processoId: 1,
    };

    const expectedExpediente = mockExpediente({
      id: 1,
      numeroProcesso: input.numeroProcesso,
      processoId: 1,
    });

    (saveExpediente as jest.Mock).mockResolvedValue(ok(expectedExpediente));

    // Act: Chamar criarExpediente
    const result = await criarExpediente(input);

    // Assert: Verificar criação com processoId
    // Nota: processoExists foi removido do service (FK constraints do Postgres validam).
    expect(result.success).toBe(true);
    expect(processoExists).not.toHaveBeenCalled();
    expect(saveExpediente).toHaveBeenCalledWith(
      expect.objectContaining({
        numero_processo: input.numeroProcesso,
        processo_id: 1,
      })
    );

    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.processoId).toBe(1);
    }
  });

  it('deve criar expediente com tipoExpedienteId fornecido', async () => {
    // Nota: tipoExpedienteExists foi removido do service (FK constraints do Postgres validam).
    // O service delega a validação ao banco e chama saveExpediente diretamente.
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      tipoExpedienteId: 5,
    };

    const expectedExpediente = mockExpediente({ tipoExpedienteId: 5 });
    (saveExpediente as jest.Mock).mockResolvedValue(ok(expectedExpediente));

    // Act: Criar com tipoExpedienteId
    const result = await criarExpediente(input);

    // Assert: Verificar criação direta sem pré-validação
    expect(result.success).toBe(true);
    expect(tipoExpedienteExists).not.toHaveBeenCalled();
    expect(saveExpediente).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_expediente_id: 5,
      })
    );
  });

  it('deve delegar validação de processo ao banco (FK constraint)', async () => {
    // Nota: processoExists foi removido do service para eliminar N+1.
    // A validação é feita via FK constraint do Postgres — se o processo
    // não existir, saveExpediente retorna erro de banco.
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
      processoId: 999,
    };

    const fkError = { success: false as const, error: { code: 'DATABASE_ERROR' as const, message: 'violates foreign key constraint' } };
    (saveExpediente as jest.Mock).mockResolvedValue(fkError);

    // Act
    const result = await criarExpediente(input);

    // Assert: processoExists nunca é chamado; erro vem do banco via saveExpediente
    expect(processoExists).not.toHaveBeenCalled();
    expect(saveExpediente).toHaveBeenCalled();
    expect(result.success).toBe(false);
  });

  it('deve criar expediente sem validações opcionais', async () => {
    // Arrange: Input mínimo
    const input = {
      numeroProcesso: '1234567-89.2023.5.01.0001',
      trt: 'TRT1' as const,
      grau: GrauTribunal.PRIMEIRO_GRAU,
      dataPrazoLegalParte: '2024-12-31',
      origem: OrigemExpediente.MANUAL,
    };

    const expectedExpediente = mockExpediente();
    (saveExpediente as jest.Mock).mockResolvedValue(ok(expectedExpediente));

    // Act
    const result = await criarExpediente(input);

    // Assert
    expect(result.success).toBe(true);
    expect(processoExists).not.toHaveBeenCalled(); // Sem processoId, não valida
    expect(tipoExpedienteExists).not.toHaveBeenCalled(); // Sem tipoExpedienteId, não valida
    expect(saveExpediente).toHaveBeenCalled();
  });
});

describe('Expedientes Integration - Baixa', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getUser: jest.MockedFunction<() => Promise<{ data: { user: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock createDbClient
    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve realizar baixa atomicamente via RPC (UPDATE + log numa transação)', async () => {
    // Arrange: service delega tudo a baixarExpediente, que por sua vez
    // chama a RPC atômica baixar_expediente_atomic (log embutido na transação).
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: null,
    });

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    };

    const expedienteBaixado = mockExpediente({
      ...expediente,
      baixadoEm: new Date().toISOString(),
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (baixarExpediente as jest.Mock).mockResolvedValue(ok(expedienteBaixado));

    const result = await realizarBaixa(1, baixaInput, 1);

    expect(result.success).toBe(true);
    expect(findExpedienteById).toHaveBeenCalledWith(1);
    // Nova assinatura: baixarExpediente(id, dados, userId).
    // O userId vai como 3º arg para a RPC atômica registrar o log de auditoria
    // dentro da mesma transação do UPDATE.
    expect(baixarExpediente).toHaveBeenCalledWith(
      1,
      {
        protocoloId: 'PROT-12345',
        justificativaBaixa: 'Protocolo realizado',
        baixadoEm: undefined,
        resultadoDecisao: undefined,
      },
      1
    );
    // Não há mais RPC separada registrar_baixa_expediente no service —
    // tudo acontece em baixar_expediente_atomic dentro do repository.
    expect(mockDb.rpc).not.toHaveBeenCalled();

    if (result.success) {
      expect(result.data.baixadoEm).not.toBeNull();
    }
  });

  it('deve falhar se expediente já estiver baixado', async () => {
    // Arrange: Mock expediente com baixadoEm preenchido
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: '2024-01-15T10:00:00Z',
      protocoloId: 'PROT-ANTERIOR',
    });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
    };

    // Act: Tentar baixar novamente
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert: Verificar erro BAD_REQUEST
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('BAD_REQUEST');
      expect(result.error.message).toContain('já está baixado');
    }
    expect(baixarExpediente).not.toHaveBeenCalled();
    expect(mockDb.rpc).not.toHaveBeenCalled();
  });

  it('deve propagar erro e não persistir nada se RPC atômica falhar (rollback)', async () => {
    // Semântica nova: log e UPDATE são uma única transação. Se o INSERT em
    // logs_alteracao falhar, o UPDATE da tabela expedientes também é revertido.
    // O service recebe erro e repassa — não há mais "log crítico" silencioso.
    const expediente = mockExpediente({ id: 1, baixadoEm: null });

    (findExpedienteById as jest.Mock).mockResolvedValue(ok(expediente));
    (baixarExpediente as jest.Mock).mockResolvedValue({
      success: false as const,
      error: {
        code: 'DATABASE_ERROR' as const,
        message: 'logs_alteracao violated constraint',
      },
    });

    const baixaInput = {
      expedienteId: 1,
      protocoloId: 'PROT-12345',
    };

    const result = await realizarBaixa(1, baixaInput, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('deve validar dados de entrada antes de baixar', async () => {
    // Arrange: Input inválido (nem protocoloId nem justificativa)
    const baixaInput = {
      expedienteId: 1,
    };

    // Act
    const result = await realizarBaixa(1, baixaInput, 1);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(findExpedienteById).not.toHaveBeenCalled();
  });
});

describe('Expedientes Integration - Reversão', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getUser: jest.MockedFunction<() => Promise<{ data: { user: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnThis(),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve reverter baixa atomicamente via RPC (UPDATE + log numa transação)', async () => {
    // Semântica nova: service delega tudo a reverterBaixaExpediente, que chama
    // reverter_baixa_expediente_atomic. A RPC faz o UPDATE e o INSERT em
    // logs_alteracao na mesma transação. Invariantes (existe? está baixado?)
    // são checadas pela RPC, não mais pelo service.
    const expediente = mockExpediente({
      id: 1,
      baixadoEm: '2024-01-15T10:00:00Z',
      protocoloId: 'PROT-12345',
      justificativaBaixa: 'Protocolo realizado',
    });

    const expedienteRevertido = mockExpediente({
      ...expediente,
      baixadoEm: null,
      protocoloId: null,
      justificativaBaixa: null,
    });

    (reverterBaixaExpediente as jest.Mock).mockResolvedValue(ok(expedienteRevertido));

    const result = await reverterBaixa(1, 1);

    expect(result.success).toBe(true);
    expect(reverterBaixaExpediente).toHaveBeenCalledWith(1, 1);
    // Não há mais RPC separada para log — tudo acontece atomicamente no repository.
    expect(mockDb.rpc).not.toHaveBeenCalled();

    if (result.success) {
      expect(result.data.baixadoEm).toBeNull();
    }
  });

  it('deve propagar erro da RPC quando expediente não está baixado', async () => {
    // A RPC reverter_baixa_expediente_atomic faz o check via WHERE baixado_em
    // IS NOT NULL e dá RAISE EXCEPTION se o expediente não estiver baixado.
    (reverterBaixaExpediente as jest.Mock).mockResolvedValue({
      success: false as const,
      error: {
        code: 'DATABASE_ERROR' as const,
        message: 'Expediente 1 não está baixado ou não foi encontrado.',
      },
    });

    const result = await reverterBaixa(1, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('não está baixado');
    }
  });

  it('deve propagar erro e não persistir nada se RPC atômica falhar (rollback)', async () => {
    (reverterBaixaExpediente as jest.Mock).mockResolvedValue({
      success: false as const,
      error: {
        code: 'DATABASE_ERROR' as const,
        message: 'logs_alteracao constraint violated',
      },
    });

    const result = await reverterBaixa(1, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
    }
  });

  it('deve propagar erro da RPC quando expediente não encontrado', async () => {
    (reverterBaixaExpediente as jest.Mock).mockResolvedValue({
      success: false as const,
      error: {
        code: 'DATABASE_ERROR' as const,
        message: 'Expediente 999 não encontrado.',
      },
    });

    const result = await reverterBaixa(999, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('não encontrado');
    }
  });
});

describe('Expedientes Integration - Atribuição de Responsável', () => {
  let mockDb: {
    rpc: jest.MockedFunction<(...args: unknown[]) => Promise<{ data: unknown; error: unknown }>>;
    auth: {
      getUser: jest.MockedFunction<() => Promise<{ data: { user: unknown }; error: unknown }>>;
    };
    from: jest.MockedFunction<(...args: unknown[]) => unknown>;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
          }),
        }),
      }),
    };

    (createDbClient as jest.Mock).mockReturnValue(mockDb);
  });

  it('deve atribuir responsável via RPC', async () => {
    // Arrange: Mock db.rpc('atribuir_responsavel_pendente')
    // Act: Chamar atribuirResponsavel
    const result = await atribuirResponsavel(1, 5);

    // Assert: Verificar chamada RPC com parâmetros corretos
    expect(result.success).toBe(true);
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: 5,
      p_usuario_executou_id: 1,
    });
  });

  it('deve permitir remover responsável (null)', async () => {
    // Act
    const result = await atribuirResponsavel(1, null);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: null,
      p_usuario_executou_id: 1,
    });
  });

  it('deve falhar se RPC retornar erro', async () => {
    // Arrange
    const rpcError = { message: 'Expediente não encontrado', code: 'P0001' };
    mockDb.rpc.mockResolvedValue({ data: null, error: rpcError });

    // Act
    const result = await atribuirResponsavel(999, 5);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('DATABASE_ERROR');
      expect(result.error.message).toContain('Expediente não encontrado');
    }
  });

  it('deve usar usuarioExecutouId se fornecido', async () => {
    // Act: Passar usuarioExecutouId explicitamente
    await atribuirResponsavel(1, 5, 99);

    // Assert: Verificar que não busca sessão
    expect(mockDb.auth.getUser).not.toHaveBeenCalled();
    expect(mockDb.rpc).toHaveBeenCalledWith('atribuir_responsavel_pendente', {
      p_pendente_id: 1,
      p_responsavel_id: 5,
      p_usuario_executou_id: 99,
    });
  });
});

describe('Expedientes Integration - Listagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar expedientes com paginação', async () => {
    // Arrange
    const expedientes = buildMultipleExpedientes(20);
    const paginatedResponse = {
      data: expedientes.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasMore: true,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act
    const result = await listarExpedientes({ pagina: 1, limite: 10 });

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      assertPaginationCorrect(result.data, 1, 10, 20);
      expect(result.data.data).toHaveLength(10);
    }
  });

  it('deve aplicar filtros de TRT, grau e baixado', async () => {
    // Arrange
    const expedientes = buildMultipleExpedientes(3, {
      trt: 'TRT2',
      grau: 'segundo_grau',
      baixadoEm: null,
    });

    const paginatedResponse = {
      data: expedientes,
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        totalPages: 1,
        hasMore: false,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act
    const result = await listarExpedientes({
      trt: 'TRT2',
      grau: GrauTribunal.SEGUNDO_GRAU,
      baixado: false,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        trt: 'TRT2',
        grau: GrauTribunal.SEGUNDO_GRAU,
        baixado: false,
        pagina: 1,
        limite: 50,
      })
    );
  });

  it('deve sanitizar parâmetros de paginação', async () => {
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

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Valores fora dos limites
    const result = await listarExpedientes({
      pagina: -10,
      limite: 500,
    });

    // Assert
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1, // Sanitizado
        limite: 500, // Passado direto (service não limita)
      })
    );
  });

  it('deve aplicar ordenação padrão por data_prazo_legal_parte asc', async () => {
    // Arrange
    const paginatedResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    (findAllExpedientes as jest.Mock).mockResolvedValue(ok(paginatedResponse));

    // Act: Sem especificar ordenação
    const result = await listarExpedientes({});

    // Assert: Verificar defaults
    expect(result.success).toBe(true);
    expect(findAllExpedientes).toHaveBeenCalledWith(
      expect.objectContaining({
        ordenarPor: 'data_prazo_legal_parte',
        ordem: 'asc',
      })
    );
  });
});
