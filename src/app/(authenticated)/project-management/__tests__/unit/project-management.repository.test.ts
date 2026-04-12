import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Helper to create a fresh chainable mock for each test
function createChainableMock(terminalResult: { data?: unknown; count?: number | null; error: unknown | null }) {
    const chain: Record<string, jest.Mock> = {};
    const returnChain = () => chain;

    chain.from = jest.fn(returnChain);
    chain.select = jest.fn(returnChain);
    chain.insert = jest.fn(returnChain);
    chain.update = jest.fn(returnChain);
    chain.delete = jest.fn(returnChain);
    chain.eq = jest.fn(returnChain);
    chain.neq = jest.fn(returnChain);
    chain.in = jest.fn(returnChain);
    chain.is = jest.fn(returnChain);
    chain.or = jest.fn(returnChain);
    chain.gte = jest.fn(returnChain);
    chain.lte = jest.fn(returnChain);
    chain.order = jest.fn(returnChain);
    chain.range = jest.fn(returnChain);
    chain.limit = jest.fn(returnChain);
    chain.single = jest.fn().mockResolvedValue(terminalResult);

    // Make the chain itself thenable so `await chain.eq(...)` resolves
    chain.then = jest.fn((resolve: (v: unknown) => void) => {
        return Promise.resolve(terminalResult).then(resolve);
    });

    return chain;
}

let mockDb: ReturnType<typeof createChainableMock>;

jest.mock('@/lib/supabase', () => ({
    createDbClient: jest.fn(() => mockDb),
}));

const PROJETO_ID = '550e8400-e29b-41d4-a716-446655440000';
const TAREFA_ID = '660e8400-e29b-41d4-a716-446655440000';
const MEMBRO_ID = '770e8400-e29b-41d4-a716-446655440000';
const USUARIO_ID = 42;

describe('Project Management Repositories', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // project.repository
    // =========================================================================
    describe('projectRepository', () => {
        // We need to import after mock setup
        let projectRepo: typeof import('../../lib/repositories/project.repository');

        beforeEach(async () => {
            projectRepo = await import('../../lib/repositories/project.repository');
        });

        describe('listProjetos', () => {
            it('deve listar projetos com paginação', async () => {
                const rows = [{
                    id: PROJETO_ID, nome: 'Projeto 1', status: 'ativo', prioridade: 'alta',
                    responsavel: { nome_completo: 'João', avatar_url: null },
                    cliente: { nome: 'Cliente X' },
                    responsavel_id: 1, criado_por: 1, created_at: '', updated_at: '',
                    progresso: 0, tags: [],
                }];
                mockDb = createChainableMock({ data: rows, count: 1, error: null });

                const result = await projectRepo.listProjetos({});

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.data).toHaveLength(1);
                    expect(result.data.pagination.total).toBe(1);
                }
                expect(mockDb.from).toHaveBeenCalledWith('pm_projetos');
            });

            it('deve retornar erro quando query falha', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'DB error', code: '500' } });

                const result = await projectRepo.listProjetos({});

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('DATABASE_ERROR');
                }
            });
        });

        describe('findProjetoById', () => {
            it('deve encontrar projeto por ID', async () => {
                const row = {
                    id: PROJETO_ID, nome: 'Projeto 1', status: 'ativo', prioridade: 'alta',
                    responsavel: { nome_completo: 'João', avatar_url: null },
                    cliente: { nome: 'Cliente X' },
                    responsavel_id: 1, criado_por: 1, created_at: '', updated_at: '',
                    progresso: 0, tags: [],
                };
                mockDb = createChainableMock({ data: row, error: null });

                const result = await projectRepo.findProjetoById(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(mockDb.eq).toHaveBeenCalledWith('id', PROJETO_ID);
            });

            it('deve retornar NOT_FOUND quando projeto não existe', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

                const result = await projectRepo.findProjetoById('nonexistent');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('NOT_FOUND');
                }
            });
        });

        describe('saveProjeto', () => {
            it('deve criar projeto com sucesso', async () => {
                const row = {
                    id: PROJETO_ID, nome: 'Novo', status: 'planejamento', prioridade: 'media',
                    responsavel_id: 1, criado_por: 1, created_at: '', updated_at: '',
                    progresso: 0, tags: [],
                };
                mockDb = createChainableMock({ data: row, error: null });

                const result = await projectRepo.saveProjeto(
                    { nome: 'Novo', responsavelId: 1, status: 'planejamento', prioridade: 'media', tags: [] },
                    1
                );

                expect(result.success).toBe(true);
                expect(mockDb.from).toHaveBeenCalledWith('pm_projetos');
                expect(mockDb.insert).toHaveBeenCalledWith(
                    expect.objectContaining({ nome: 'Novo', criado_por: 1 })
                );
            });

            it('deve retornar erro quando insert falha', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'Insert error', code: '500' } });

                const result = await projectRepo.saveProjeto(
                    { nome: 'X', responsavelId: 1, status: 'planejamento', prioridade: 'media', tags: [] },
                    1
                );

                expect(result.success).toBe(false);
            });
        });

        describe('deleteProjeto', () => {
            it('deve excluir projeto com sucesso', async () => {
                mockDb = createChainableMock({ data: null, error: null });

                const result = await projectRepo.deleteProjeto(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(mockDb.from).toHaveBeenCalledWith('pm_projetos');
                expect(mockDb.delete).toHaveBeenCalled();
            });

            it('deve retornar erro quando delete falha', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'FK constraint', code: '23503' } });

                const result = await projectRepo.deleteProjeto(PROJETO_ID);

                expect(result.success).toBe(false);
            });
        });
    });

    // =========================================================================
    // task.repository
    // =========================================================================
    describe('taskRepository', () => {
        let taskRepo: typeof import('../../lib/repositories/task.repository');

        beforeEach(async () => {
            taskRepo = await import('../../lib/repositories/task.repository');
        });

        describe('listTarefasByProject', () => {
            it('deve listar tarefas de um projeto', async () => {
                const rows = [{
                    id: TAREFA_ID, projeto_id: PROJETO_ID, titulo: 'Tarefa 1',
                    status: 'a_fazer', prioridade: 'media', ordem_kanban: 0,
                    criado_por: 1, created_at: '', updated_at: '',
                    responsavel: null, projeto: { nome: 'Projeto 1' },
                }];
                mockDb = createChainableMock({ data: rows, error: null });
                // Override then to resolve with data array (non-single query)
                mockDb.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ data: rows, error: null }).then(resolve);
                });

                const result = await taskRepo.listTarefasByProject(PROJETO_ID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveLength(1);
                }
                expect(mockDb.from).toHaveBeenCalledWith('pm_tarefas');
                expect(mockDb.eq).toHaveBeenCalledWith('projeto_id', PROJETO_ID);
            });

            it('deve retornar erro quando query falha', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'DB error', code: '500' } });
                mockDb.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } }).then(resolve);
                });

                const result = await taskRepo.listTarefasByProject(PROJETO_ID);

                expect(result.success).toBe(false);
            });
        });

        describe('findTarefaById', () => {
            it('deve encontrar tarefa por ID', async () => {
                const row = {
                    id: TAREFA_ID, projeto_id: PROJETO_ID, titulo: 'Tarefa 1',
                    status: 'a_fazer', prioridade: 'media', ordem_kanban: 0,
                    criado_por: 1, created_at: '', updated_at: '',
                    responsavel: null, projeto: { nome: 'Projeto 1' },
                };
                mockDb = createChainableMock({ data: row, error: null });

                const result = await taskRepo.findTarefaById(TAREFA_ID);

                expect(result.success).toBe(true);
                expect(mockDb.eq).toHaveBeenCalledWith('id', TAREFA_ID);
            });

            it('deve retornar NOT_FOUND quando tarefa não existe', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'Not found', code: 'PGRST116' } });

                const result = await taskRepo.findTarefaById('nonexistent');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('NOT_FOUND');
                }
            });
        });

        describe('saveTarefa', () => {
            it('deve criar tarefa com sucesso', async () => {
                // saveTarefa does two queries: first to get max order, then insert
                let callCount = 0;
                const results = [
                    { data: { ordem_kanban: 5 }, error: null },  // max order query
                    { data: { id: TAREFA_ID, projeto_id: PROJETO_ID, titulo: 'Nova', status: 'a_fazer', prioridade: 'media', ordem_kanban: 6, criado_por: 1, created_at: '', updated_at: '' }, error: null },
                ];

                const chain: Record<string, jest.Mock> = {};
                const returnChain = () => chain;
                chain.from = jest.fn(returnChain);
                chain.select = jest.fn(returnChain);
                chain.insert = jest.fn(returnChain);
                chain.eq = jest.fn(returnChain);
                chain.order = jest.fn(returnChain);
                chain.limit = jest.fn(returnChain);
                chain.single = jest.fn(() => Promise.resolve(results[callCount++]));

                mockDb = chain as ReturnType<typeof createChainableMock>;

                const result = await taskRepo.saveTarefa(
                    { projetoId: PROJETO_ID, titulo: 'Nova', status: 'a_fazer', prioridade: 'media' },
                    1
                );

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.titulo).toBe('Nova');
                }
            });

            it('deve retornar erro quando insert falha', async () => {
                let callCount = 0;
                const results = [
                    { data: null, error: null },  // max order (no existing tasks)
                    { data: null, error: { message: 'Insert error', code: '500' } },
                ];

                const chain: Record<string, jest.Mock> = {};
                const returnChain = () => chain;
                chain.from = jest.fn(returnChain);
                chain.select = jest.fn(returnChain);
                chain.insert = jest.fn(returnChain);
                chain.eq = jest.fn(returnChain);
                chain.order = jest.fn(returnChain);
                chain.limit = jest.fn(returnChain);
                chain.single = jest.fn(() => Promise.resolve(results[callCount++]));

                mockDb = chain as ReturnType<typeof createChainableMock>;

                const result = await taskRepo.saveTarefa(
                    { projetoId: PROJETO_ID, titulo: 'X', status: 'a_fazer', prioridade: 'media' },
                    1
                );

                expect(result.success).toBe(false);
            });
        });

        describe('deleteTarefa', () => {
            it('deve excluir tarefa com sucesso', async () => {
                mockDb = createChainableMock({ data: null, error: null });

                const result = await taskRepo.deleteTarefa(TAREFA_ID);

                expect(result.success).toBe(true);
                expect(mockDb.from).toHaveBeenCalledWith('pm_tarefas');
            });

            it('deve retornar erro quando delete falha', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'Error', code: '500' } });

                const result = await taskRepo.deleteTarefa(TAREFA_ID);

                expect(result.success).toBe(false);
            });
        });

        describe('countTarefasByProject', () => {
            it('deve contar tarefas do projeto', async () => {
                // countTarefasByProject uses Promise.all with two queries
                const chain: Record<string, jest.Mock> = {};
                const returnChain = () => chain;
                chain.from = jest.fn(returnChain);
                chain.select = jest.fn(returnChain);
                chain.eq = jest.fn(returnChain);
                chain.neq = jest.fn(returnChain);
                chain.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ count: 10, error: null }).then(resolve);
                });

                mockDb = chain as ReturnType<typeof createChainableMock>;

                const result = await taskRepo.countTarefasByProject(PROJETO_ID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.total).toBe(10);
                    expect(result.data.concluidas).toBe(10);
                }
            });
        });
    });

    // =========================================================================
    // team.repository
    // =========================================================================
    describe('teamRepository', () => {
        let teamRepo: typeof import('../../lib/repositories/team.repository');

        beforeEach(async () => {
            teamRepo = await import('../../lib/repositories/team.repository');
        });

        describe('listMembrosByProject', () => {
            it('deve listar membros do projeto', async () => {
                const rows = [{
                    id: MEMBRO_ID, projeto_id: PROJETO_ID, usuario_id: USUARIO_ID,
                    papel: 'gerente', adicionado_em: '2024-01-01',
                    usuario: { nome_completo: 'João', avatar_url: null, email_corporativo: 'joao@test.com' },
                }];
                mockDb = createChainableMock({ data: rows, error: null });
                mockDb.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ data: rows, error: null }).then(resolve);
                });

                const result = await teamRepo.listMembrosByProject(PROJETO_ID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveLength(1);
                    expect(result.data[0].usuarioNome).toBe('João');
                }
                expect(mockDb.from).toHaveBeenCalledWith('pm_membros_projeto');
            });
        });

        describe('addMembro', () => {
            it('deve adicionar membro com sucesso', async () => {
                const row = {
                    id: MEMBRO_ID, projeto_id: PROJETO_ID, usuario_id: 5,
                    papel: 'membro', adicionado_em: '2024-01-01',
                };
                mockDb = createChainableMock({ data: row, error: null });

                const result = await teamRepo.addMembro({
                    projetoId: PROJETO_ID, usuarioId: 5, papel: 'membro',
                });

                expect(result.success).toBe(true);
                expect(mockDb.insert).toHaveBeenCalledWith(
                    expect.objectContaining({ projeto_id: PROJETO_ID, usuario_id: 5, papel: 'membro' })
                );
            });

            it('deve retornar CONFLICT para membro duplicado', async () => {
                mockDb = createChainableMock({ data: null, error: { message: 'Duplicate', code: '23505' } });

                const result = await teamRepo.addMembro({
                    projetoId: PROJETO_ID, usuarioId: 5, papel: 'membro',
                });

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('CONFLICT');
                }
            });
        });

        describe('removeMembro', () => {
            it('deve remover membro com sucesso', async () => {
                mockDb = createChainableMock({ data: null, error: null });

                const result = await teamRepo.removeMembro(MEMBRO_ID);

                expect(result.success).toBe(true);
                expect(mockDb.from).toHaveBeenCalledWith('pm_membros_projeto');
            });
        });

        describe('isUserMemberOfProject', () => {
            it('deve retornar true quando usuário é membro', async () => {
                mockDb = createChainableMock({ data: null, count: 1, error: null });
                mockDb.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ count: 1, error: null }).then(resolve);
                });

                const result = await teamRepo.isUserMemberOfProject(PROJETO_ID, USUARIO_ID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(true);
                }
            });

            it('deve retornar false quando usuário não é membro', async () => {
                mockDb = createChainableMock({ data: null, count: 0, error: null });
                mockDb.then = jest.fn((resolve: (v: unknown) => void) => {
                    return Promise.resolve({ count: 0, error: null }).then(resolve);
                });

                const result = await teamRepo.isUserMemberOfProject(PROJETO_ID, 999);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toBe(false);
                }
            });
        });
    });

    // =========================================================================
    // utils
    // =========================================================================
    describe('repository utils', () => {
        let utils: typeof import('../../lib/repositories/utils');

        beforeEach(async () => {
            utils = await import('../../lib/repositories/utils');
        });

        describe('escapeIlike', () => {
            it('deve escapar caracteres especiais do ILIKE', () => {
                expect(utils.escapeIlike('test%value')).toBe('test\\%value');
                expect(utils.escapeIlike('test_value')).toBe('test\\_value');
                expect(utils.escapeIlike('test\\value')).toBe('test\\\\value');
            });

            it('deve retornar string sem alteração quando não há caracteres especiais', () => {
                expect(utils.escapeIlike('normal text')).toBe('normal text');
            });
        });

        describe('validateSortColumn', () => {
            const allowed = ['nome', 'status', 'created_at'] as const;

            it('deve retornar coluna válida', () => {
                expect(utils.validateSortColumn('nome', allowed, 'created_at')).toBe('nome');
            });

            it('deve retornar fallback para coluna inválida', () => {
                expect(utils.validateSortColumn('invalid', allowed, 'created_at')).toBe('created_at');
            });

            it('deve retornar fallback para undefined', () => {
                expect(utils.validateSortColumn(undefined, allowed, 'created_at')).toBe('created_at');
            });
        });
    });
});
