/**
 * Tests for Project Management Server Actions
 *
 * The project-management module has 5 action files with different patterns:
 * - project.actions.ts, task.actions.ts, team.actions.ts: Direct service delegation (no auth in action layer)
 * - reminder.actions.ts: Uses getCurrentUser() for auth + service delegation
 * - file.actions.ts: Uses getCurrentUser() for auth + direct DB operations
 *
 * Tests validate:
 * - Authentication checks (where applicable)
 * - Correct delegation to service layer with proper parameters
 * - Cache revalidation on success
 * - Error propagation from services
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ok, err, appError } from '@/types';

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

const mockUser = { id: 42, nomeCompleto: 'Teste PM', emailCorporativo: 'teste@zattar.com' };

jest.mock('@/lib/auth/server', () => ({
    getCurrentUser: jest.fn(async () => mockUser),
}));

// Mock sub-services
jest.mock('../../lib/services/project.service', () => ({
    listarProjetos: jest.fn(),
    buscarProjeto: jest.fn(),
    criarProjeto: jest.fn(),
    atualizarProjeto: jest.fn(),
    excluirProjeto: jest.fn(),
}));

jest.mock('../../lib/services/task.service', () => ({
    listarTarefasPorProjeto: jest.fn(),
    listarTarefasGlobal: jest.fn(),
    criarTarefa: jest.fn(),
    atualizarTarefa: jest.fn(),
    excluirTarefa: jest.fn(),
    reordenarKanban: jest.fn(),
}));

jest.mock('../../lib/services/team.service', () => ({
    listarMembros: jest.fn(),
    adicionarMembro: jest.fn(),
    removerMembro: jest.fn(),
    alterarPapel: jest.fn(),
}));

jest.mock('../../lib/services/reminder.service', () => ({
    listarLembretes: jest.fn(),
    criarLembrete: jest.fn(),
    concluirLembrete: jest.fn(),
    excluirLembrete: jest.fn(),
}));

// Mock file action dependencies
jest.mock('@/lib/supabase', () => ({
    createDbClient: jest.fn(),
}));

jest.mock('@/lib/storage/supabase-storage.service', () => ({
    uploadToSupabase: jest.fn(),
    deleteFromSupabase: jest.fn(),
}));

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { createDbClient } from '@/lib/supabase';
import { deleteFromSupabase } from '@/lib/storage/supabase-storage.service';

// Import REAL actions (after mocks)
import {
    actionListarProjetos,
    actionBuscarProjeto,
    actionCriarProjeto,
    actionAtualizarProjeto,
    actionExcluirProjeto,
} from '../../actions/project.actions';

import {
    actionListarTarefasPorProjeto,
    actionListarTarefasGlobal,
    actionCriarTarefa,
    actionAtualizarTarefa,
    actionExcluirTarefa,
    actionReordenarKanban,
} from '../../actions/task.actions';

import {
    actionListarMembros,
    actionAdicionarMembro,
    actionRemoverMembro,
    actionAlterarPapel,
} from '../../actions/team.actions';

import {
    actionListarLembretes,
    actionCriarLembrete,
    actionConcluirLembrete,
    actionExcluirLembrete,
} from '../../actions/reminder.actions';

import {
    actionListarAnexos,
    actionUploadAnexo,
    actionExcluirAnexo,
} from '../../actions/file.actions';

// Import mocked services
import * as projectService from '../../lib/services/project.service';
import * as taskService from '../../lib/services/task.service';
import * as teamService from '../../lib/services/team.service';
import * as reminderService from '../../lib/services/reminder.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const mockProjeto = {
    id: VALID_UUID,
    nome: 'Projeto Teste',
    descricao: null,
    status: 'ativo' as const,
    prioridade: 'media' as const,
    dataInicio: null,
    dataPrevisaoFim: null,
    dataConclusao: null,
    clienteId: null,
    processoId: null,
    contratoId: null,
    responsavelId: 42,
    criadoPor: 42,
    orcamento: null,
    valorGasto: null,
    progresso: 0,
    progressoManual: null,
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const mockTarefa = {
    id: VALID_UUID_2,
    projetoId: VALID_UUID,
    titulo: 'Tarefa Teste',
    descricao: null,
    status: 'a_fazer' as const,
    prioridade: 'media' as const,
    responsavelId: null,
    dataPrazo: null,
    dataConclusao: null,
    ordemKanban: 0,
    estimativaHoras: null,
    horasRegistradas: null,
    tarefaPaiId: null,
    criadoPor: 42,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const mockMembro = {
    id: VALID_UUID_2,
    projetoId: VALID_UUID,
    usuarioId: 42,
    papel: 'membro' as const,
    adicionadoEm: '2024-01-01T00:00:00Z',
};

const mockLembrete = {
    id: VALID_UUID,
    projetoId: null,
    tarefaId: null,
    usuarioId: 42,
    texto: 'Lembrete teste',
    dataHora: '2024-06-01T10:00:00Z',
    prioridade: 'media' as const,
    concluido: false,
    createdAt: '2024-01-01T00:00:00Z',
};

const PM_PATH = '/app/project-management';

describe('Project Management Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    });

    // =========================================================================
    // Project Actions
    // =========================================================================
    describe('Project Actions', () => {
        describe('actionListarProjetos', () => {
            it('deve listar projetos delegando ao service', async () => {
                const paginated = { data: [mockProjeto], pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false } };
                (projectService.listarProjetos as jest.Mock).mockResolvedValue(ok(paginated));

                const params = { pagina: 1, limite: 10 };
                const result = await actionListarProjetos(params);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual(paginated);
                }
                expect(projectService.listarProjetos).toHaveBeenCalledWith(params);
            });

            it('deve propagar erro do service', async () => {
                (projectService.listarProjetos as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao listar projetos'))
                );

                const result = await actionListarProjetos({});

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.message).toBe('Erro ao listar projetos');
                }
            });
        });

        describe('actionBuscarProjeto', () => {
            it('deve buscar projeto por ID', async () => {
                (projectService.buscarProjeto as jest.Mock).mockResolvedValue(ok(mockProjeto));

                const result = await actionBuscarProjeto(VALID_UUID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual(mockProjeto);
                }
                expect(projectService.buscarProjeto).toHaveBeenCalledWith(VALID_UUID);
            });

            it('deve propagar erro quando projeto não encontrado', async () => {
                (projectService.buscarProjeto as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Projeto não encontrado'))
                );

                const result = await actionBuscarProjeto('inexistente');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.message).toBe('Projeto não encontrado');
                }
            });
        });

        describe('actionCriarProjeto', () => {
            const validInput = {
                nome: 'Novo Projeto',
                responsavelId: 42,
                status: 'planejamento' as const,
                prioridade: 'media' as const,
                tags: [],
            };

            it('deve criar projeto e revalidar cache', async () => {
                (projectService.criarProjeto as jest.Mock).mockResolvedValue(ok(mockProjeto));

                const result = await actionCriarProjeto(validInput, 42);

                expect(result.success).toBe(true);
                expect(projectService.criarProjeto).toHaveBeenCalledWith(validInput, 42);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (projectService.criarProjeto as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao criar'))
                );

                const result = await actionCriarProjeto(validInput, 42);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionAtualizarProjeto', () => {
            it('deve atualizar projeto e revalidar cache', async () => {
                const updated = { ...mockProjeto, nome: 'Atualizado' };
                (projectService.atualizarProjeto as jest.Mock).mockResolvedValue(ok(updated));

                const result = await actionAtualizarProjeto(VALID_UUID, { nome: 'Atualizado' });

                expect(result.success).toBe(true);
                expect(projectService.atualizarProjeto).toHaveBeenCalledWith(VALID_UUID, { nome: 'Atualizado' });
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects`);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (projectService.atualizarProjeto as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Projeto não encontrado'))
                );

                const result = await actionAtualizarProjeto(VALID_UUID, { nome: 'X' });

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionExcluirProjeto', () => {
            it('deve excluir projeto e revalidar cache', async () => {
                (projectService.excluirProjeto as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await actionExcluirProjeto(VALID_UUID);

                expect(result.success).toBe(true);
                expect(projectService.excluirProjeto).toHaveBeenCalledWith(VALID_UUID);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (projectService.excluirProjeto as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Projeto não encontrado'))
                );

                const result = await actionExcluirProjeto(VALID_UUID);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Task Actions
    // =========================================================================
    describe('Task Actions', () => {
        describe('actionListarTarefasPorProjeto', () => {
            it('deve listar tarefas por projeto', async () => {
                (taskService.listarTarefasPorProjeto as jest.Mock).mockResolvedValue(ok([mockTarefa]));

                const result = await actionListarTarefasPorProjeto(VALID_UUID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual([mockTarefa]);
                }
                expect(taskService.listarTarefasPorProjeto).toHaveBeenCalledWith(VALID_UUID, undefined);
            });

            it('deve passar filtro de status ao service', async () => {
                (taskService.listarTarefasPorProjeto as jest.Mock).mockResolvedValue(ok([mockTarefa]));

                await actionListarTarefasPorProjeto(VALID_UUID, 'a_fazer');

                expect(taskService.listarTarefasPorProjeto).toHaveBeenCalledWith(VALID_UUID, 'a_fazer');
            });

            it('deve propagar erro do service', async () => {
                (taskService.listarTarefasPorProjeto as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao listar tarefas'))
                );

                const result = await actionListarTarefasPorProjeto(VALID_UUID);

                expect(result.success).toBe(false);
            });
        });

        describe('actionListarTarefasGlobal', () => {
            it('deve listar tarefas globais com paginação', async () => {
                const paginated = { data: [mockTarefa], pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false } };
                (taskService.listarTarefasGlobal as jest.Mock).mockResolvedValue(ok(paginated));

                const params = { pagina: 1, limite: 10 };
                const result = await actionListarTarefasGlobal(params);

                expect(result.success).toBe(true);
                expect(taskService.listarTarefasGlobal).toHaveBeenCalledWith(params);
            });
        });

        describe('actionCriarTarefa', () => {
            const validInput = {
                projetoId: VALID_UUID,
                titulo: 'Nova Tarefa',
                status: 'a_fazer' as const,
                prioridade: 'media' as const,
            };

            it('deve criar tarefa e revalidar cache', async () => {
                (taskService.criarTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

                const result = await actionCriarTarefa(validInput, 42);

                expect(result.success).toBe(true);
                expect(taskService.criarTarefa).toHaveBeenCalledWith(validInput, 42);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (taskService.criarTarefa as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao criar tarefa'))
                );

                const result = await actionCriarTarefa(validInput, 42);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionAtualizarTarefa', () => {
            it('deve atualizar tarefa e revalidar cache com projetoId', async () => {
                const updated = { ...mockTarefa, titulo: 'Atualizada' };
                (taskService.atualizarTarefa as jest.Mock).mockResolvedValue(ok(updated));

                const result = await actionAtualizarTarefa(VALID_UUID_2, { titulo: 'Atualizada' }, VALID_UUID);

                expect(result.success).toBe(true);
                expect(taskService.atualizarTarefa).toHaveBeenCalledWith(VALID_UUID_2, { titulo: 'Atualizada' }, VALID_UUID);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
            });

            it('deve revalidar sem projetoId quando não fornecido', async () => {
                (taskService.atualizarTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

                await actionAtualizarTarefa(VALID_UUID_2, { titulo: 'X' });

                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
                // Should NOT revalidate project-specific path
                expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining('/projects/'));
            });

            it('não deve revalidar cache quando service falha', async () => {
                (taskService.atualizarTarefa as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Tarefa não encontrada'))
                );

                const result = await actionAtualizarTarefa(VALID_UUID_2, { titulo: 'X' });

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionExcluirTarefa', () => {
            it('deve excluir tarefa e revalidar cache com projetoId', async () => {
                (taskService.excluirTarefa as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await actionExcluirTarefa(VALID_UUID_2, VALID_UUID);

                expect(result.success).toBe(true);
                expect(taskService.excluirTarefa).toHaveBeenCalledWith(VALID_UUID_2);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
            });

            it('deve revalidar sem projetoId quando não fornecido', async () => {
                (taskService.excluirTarefa as jest.Mock).mockResolvedValue(ok(undefined));

                await actionExcluirTarefa(VALID_UUID_2);

                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
                expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining('/projects/'));
            });
        });

        describe('actionReordenarKanban', () => {
            it('deve reordenar kanban e revalidar cache', async () => {
                (taskService.reordenarKanban as jest.Mock).mockResolvedValue(ok(undefined));

                const items = [
                    { tarefaId: VALID_UUID_2, status: 'em_progresso' as const, ordemKanban: 0 },
                ];
                const result = await actionReordenarKanban(items);

                expect(result.success).toBe(true);
                expect(taskService.reordenarKanban).toHaveBeenCalledWith(items);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/tasks`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (taskService.reordenarKanban as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao reordenar'))
                );

                const result = await actionReordenarKanban([]);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Team Actions
    // =========================================================================
    describe('Team Actions', () => {
        describe('actionListarMembros', () => {
            it('deve listar membros do projeto', async () => {
                (teamService.listarMembros as jest.Mock).mockResolvedValue(ok([mockMembro]));

                const result = await actionListarMembros(VALID_UUID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual([mockMembro]);
                }
                expect(teamService.listarMembros).toHaveBeenCalledWith(VALID_UUID);
            });

            it('deve propagar erro do service', async () => {
                (teamService.listarMembros as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao listar membros'))
                );

                const result = await actionListarMembros(VALID_UUID);

                expect(result.success).toBe(false);
            });
        });

        describe('actionAdicionarMembro', () => {
            const validInput = { projetoId: VALID_UUID, usuarioId: 10, papel: 'membro' as const };

            it('deve adicionar membro e revalidar cache', async () => {
                (teamService.adicionarMembro as jest.Mock).mockResolvedValue(ok(mockMembro));

                const result = await actionAdicionarMembro(validInput);

                expect(result.success).toBe(true);
                expect(teamService.adicionarMembro).toHaveBeenCalledWith(validInput);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (teamService.adicionarMembro as jest.Mock).mockResolvedValue(
                    err(appError('CONFLICT', 'Membro já existe'))
                );

                const result = await actionAdicionarMembro(validInput);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionRemoverMembro', () => {
            it('deve remover membro e revalidar cache', async () => {
                (teamService.removerMembro as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await actionRemoverMembro(VALID_UUID_2, VALID_UUID);

                expect(result.success).toBe(true);
                expect(teamService.removerMembro).toHaveBeenCalledWith(VALID_UUID_2, VALID_UUID);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
            });

            it('não deve revalidar cache quando service falha', async () => {
                (teamService.removerMembro as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Membro não encontrado'))
                );

                const result = await actionRemoverMembro(VALID_UUID_2, VALID_UUID);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionAlterarPapel', () => {
            it('deve alterar papel e revalidar cache quando projetoId fornecido', async () => {
                const updated = { ...mockMembro, papel: 'gerente' as const };
                (teamService.alterarPapel as jest.Mock).mockResolvedValue(ok(updated));

                const result = await actionAlterarPapel(VALID_UUID_2, 'gerente', VALID_UUID);

                expect(result.success).toBe(true);
                expect(teamService.alterarPapel).toHaveBeenCalledWith(VALID_UUID_2, 'gerente');
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}`);
            });

            it('não deve revalidar cache quando projetoId não fornecido', async () => {
                (teamService.alterarPapel as jest.Mock).mockResolvedValue(ok(mockMembro));

                await actionAlterarPapel(VALID_UUID_2, 'observador');

                expect(revalidatePath).not.toHaveBeenCalled();
            });

            it('não deve revalidar cache quando service falha', async () => {
                (teamService.alterarPapel as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Membro não encontrado'))
                );

                const result = await actionAlterarPapel(VALID_UUID_2, 'gerente', VALID_UUID);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // Reminder Actions (uses getCurrentUser for auth)
    // =========================================================================
    describe('Reminder Actions', () => {
        describe('actionListarLembretes', () => {
            it('deve listar lembretes do usuário autenticado', async () => {
                (reminderService.listarLembretes as jest.Mock).mockResolvedValue(ok([mockLembrete]));

                const result = await actionListarLembretes();

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toEqual([mockLembrete]);
                }
                expect(getCurrentUser).toHaveBeenCalled();
                expect(reminderService.listarLembretes).toHaveBeenCalledWith(mockUser.id, undefined);
            });

            it('deve passar opções ao service', async () => {
                (reminderService.listarLembretes as jest.Mock).mockResolvedValue(ok([]));

                await actionListarLembretes({ concluido: false, limite: 5 });

                expect(reminderService.listarLembretes).toHaveBeenCalledWith(mockUser.id, { concluido: false, limite: 5 });
            });

            it('deve retornar erro quando não autenticado', async () => {
                (getCurrentUser as jest.Mock).mockResolvedValue(null);

                const result = await actionListarLembretes();

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('UNAUTHORIZED');
                }
                expect(reminderService.listarLembretes).not.toHaveBeenCalled();
            });
        });

        describe('actionCriarLembrete', () => {
            const validInput = {
                texto: 'Lembrar de revisar',
                dataHora: '2024-06-01T10:00:00Z',
                prioridade: 'alta' as const,
            };

            it('deve criar lembrete e revalidar cache', async () => {
                (reminderService.criarLembrete as jest.Mock).mockResolvedValue(ok(mockLembrete));

                const result = await actionCriarLembrete(validInput);

                expect(result.success).toBe(true);
                expect(getCurrentUser).toHaveBeenCalled();
                expect(reminderService.criarLembrete).toHaveBeenCalledWith(validInput, mockUser.id);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
            });

            it('deve retornar erro quando não autenticado', async () => {
                (getCurrentUser as jest.Mock).mockResolvedValue(null);

                const result = await actionCriarLembrete(validInput);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('UNAUTHORIZED');
                }
                expect(reminderService.criarLembrete).not.toHaveBeenCalled();
            });

            it('não deve revalidar cache quando service falha', async () => {
                (reminderService.criarLembrete as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro ao criar lembrete'))
                );

                const result = await actionCriarLembrete(validInput);

                expect(result.success).toBe(false);
                expect(revalidatePath).not.toHaveBeenCalled();
            });
        });

        describe('actionConcluirLembrete', () => {
            it('deve concluir lembrete e revalidar cache', async () => {
                (reminderService.concluirLembrete as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await actionConcluirLembrete(VALID_UUID, true);

                expect(result.success).toBe(true);
                expect(reminderService.concluirLembrete).toHaveBeenCalledWith(VALID_UUID, true, mockUser.id);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
            });

            it('deve retornar erro quando não autenticado', async () => {
                (getCurrentUser as jest.Mock).mockResolvedValue(null);

                const result = await actionConcluirLembrete(VALID_UUID, true);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('UNAUTHORIZED');
                }
                expect(reminderService.concluirLembrete).not.toHaveBeenCalled();
            });
        });

        describe('actionExcluirLembrete', () => {
            it('deve excluir lembrete e revalidar cache', async () => {
                (reminderService.excluirLembrete as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await actionExcluirLembrete(VALID_UUID);

                expect(result.success).toBe(true);
                expect(reminderService.excluirLembrete).toHaveBeenCalledWith(VALID_UUID, mockUser.id);
                expect(revalidatePath).toHaveBeenCalledWith(PM_PATH);
            });

            it('deve retornar erro quando não autenticado', async () => {
                (getCurrentUser as jest.Mock).mockResolvedValue(null);

                const result = await actionExcluirLembrete(VALID_UUID);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('UNAUTHORIZED');
                }
                expect(reminderService.excluirLembrete).not.toHaveBeenCalled();
            });
        });
    });

    // =========================================================================
    // File Actions (uses getCurrentUser + direct DB)
    // =========================================================================
    describe('File Actions', () => {
        // Helper to create a mock Supabase query builder
        const createMockQueryBuilder = (data: unknown = null, error: unknown = null) => {
            const builder: Record<string, jest.Mock> = {};
            builder.from = jest.fn().mockReturnValue(builder);
            builder.select = jest.fn().mockReturnValue(builder);
            builder.insert = jest.fn().mockReturnValue(builder);
            builder.delete = jest.fn().mockReturnValue(builder);
            builder.eq = jest.fn().mockReturnValue(builder);
            builder.order = jest.fn().mockResolvedValue({ data, error });
            builder.single = jest.fn().mockResolvedValue({ data, error });
            return builder;
        };

        describe('actionListarAnexos', () => {
            it('deve listar anexos do projeto', async () => {
                const rawAnexo = {
                    id: VALID_UUID,
                    projeto_id: VALID_UUID,
                    tarefa_id: null,
                    usuario_id: 42,
                    nome_arquivo: 'doc.pdf',
                    url: 'https://storage.example.com/doc.pdf',
                    tamanho_bytes: 1024,
                    tipo_mime: 'application/pdf',
                    created_at: '2024-01-01T00:00:00Z',
                    usuario: { nome_completo: 'Teste PM' },
                };

                const mockDb = createMockQueryBuilder([rawAnexo]);
                (createDbClient as jest.Mock).mockReturnValue(mockDb);

                const result = await actionListarAnexos(VALID_UUID);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data).toHaveLength(1);
                    expect(result.data[0].nomeArquivo).toBe('doc.pdf');
                }
                expect(createDbClient).toHaveBeenCalled();
            });

            it('deve retornar erro quando DB falha', async () => {
                const mockDb = createMockQueryBuilder(null, { message: 'DB error' });
                (createDbClient as jest.Mock).mockReturnValue(mockDb);

                const result = await actionListarAnexos(VALID_UUID);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('DATABASE_ERROR');
                }
            });
        });

        describe('actionUploadAnexo', () => {
            it('deve retornar erro quando não autenticado', async () => {
                (getCurrentUser as jest.Mock).mockResolvedValue(null);

                const formData = new FormData();
                formData.append('file', new File(['content'], 'test.pdf', { type: 'application/pdf' }));
                formData.append('projetoId', VALID_UUID);

                const result = await actionUploadAnexo(formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('UNAUTHORIZED');
                }
            });

            it('deve retornar erro quando nenhum arquivo enviado', async () => {
                const formData = new FormData();
                formData.append('projetoId', VALID_UUID);

                const result = await actionUploadAnexo(formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
            });

            it('deve retornar erro quando arquivo excede 50MB', async () => {
                const bigContent = new ArrayBuffer(51 * 1024 * 1024);
                const formData = new FormData();
                formData.append('file', new File([bigContent], 'big.pdf', { type: 'application/pdf' }));
                formData.append('projetoId', VALID_UUID);

                const result = await actionUploadAnexo(formData);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                    expect(result.error.message).toContain('50MB');
                }
            });
        });

        describe('actionExcluirAnexo', () => {
            it('deve excluir anexo e revalidar cache', async () => {
                const _mockDb = createMockQueryBuilder();
                // First call: fetch URL
                const fetchBuilder: Record<string, jest.Mock> = {};
                fetchBuilder.from = jest.fn().mockReturnValue(fetchBuilder);
                fetchBuilder.select = jest.fn().mockReturnValue(fetchBuilder);
                fetchBuilder.delete = jest.fn().mockReturnValue(fetchBuilder);
                fetchBuilder.eq = jest.fn().mockReturnValue(fetchBuilder);
                fetchBuilder.single = jest.fn().mockResolvedValue({
                    data: { url: 'https://storage.example.com/storage/v1/object/public/bucket/project-management/file.pdf' },
                    error: null,
                });
                fetchBuilder.order = jest.fn().mockResolvedValue({ data: null, error: null });

                // For delete call, return success
                let callCount = 0;
                const multiDb: Record<string, jest.Mock> = {};
                multiDb.from = jest.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount <= 1) {
                        // First from() call: select URL
                        return {
                            select: jest.fn().mockReturnValue({
                                eq: jest.fn().mockReturnValue({
                                    single: jest.fn().mockResolvedValue({
                                        data: { url: 'https://storage.example.com/storage/v1/object/public/bucket/project-management/file.pdf' },
                                        error: null,
                                    }),
                                }),
                            }),
                        };
                    }
                    // Second from() call: delete
                    return {
                        delete: jest.fn().mockReturnValue({
                            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
                        }),
                    };
                });

                (createDbClient as jest.Mock).mockReturnValue(multiDb);
                (deleteFromSupabase as jest.Mock).mockResolvedValue(undefined);

                const result = await actionExcluirAnexo(VALID_UUID, VALID_UUID);

                expect(result.success).toBe(true);
                expect(revalidatePath).toHaveBeenCalledWith(`${PM_PATH}/projects/${VALID_UUID}/files`);
            });

            it('deve retornar erro quando fetch do anexo falha', async () => {
                const mockDb: Record<string, jest.Mock> = {};
                mockDb.from = jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({
                                data: null,
                                error: { message: 'Anexo não encontrado' },
                            }),
                        }),
                    }),
                });

                (createDbClient as jest.Mock).mockReturnValue(mockDb);

                const result = await actionExcluirAnexo(VALID_UUID, VALID_UUID);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('DATABASE_ERROR');
                }
            });
        });
    });
});
