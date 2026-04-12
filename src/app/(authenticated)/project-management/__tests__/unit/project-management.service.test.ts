import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ok, err, appError } from '@/types';

// Mock the sub-repositories before importing services
jest.mock('../../lib/repositories/project.repository');
jest.mock('../../lib/repositories/task.repository');
jest.mock('../../lib/repositories/team.repository');
jest.mock('../../lib/repositories/reminder.repository');
jest.mock('../../lib/repositories/dashboard.repository');

import * as projectService from '../../lib/services/project.service';
import * as taskService from '../../lib/services/task.service';
import * as teamService from '../../lib/services/team.service';
import * as reminderService from '../../lib/services/reminder.service';
import * as dashboardService from '../../lib/services/dashboard.service';
import * as projectRepo from '../../lib/repositories/project.repository';
import * as taskRepo from '../../lib/repositories/task.repository';
import * as teamRepo from '../../lib/repositories/team.repository';
import * as reminderRepo from '../../lib/repositories/reminder.repository';
import * as dashboardRepo from '../../lib/repositories/dashboard.repository';

const USUARIO_ID = 42;
const PROJETO_ID = '550e8400-e29b-41d4-a716-446655440000';
const TAREFA_ID = '660e8400-e29b-41d4-a716-446655440000';
const MEMBRO_ID = '770e8400-e29b-41d4-a716-446655440000';

describe('Project Management Services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // projectService
    // =========================================================================
    describe('projectService', () => {
        describe('listarProjetos', () => {
            it('deve delegar ao repository', async () => {
                const mockResult = ok({ data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false } });
                (projectRepo.listProjetos as jest.Mock).mockResolvedValue(mockResult);

                const result = await projectService.listarProjetos({});

                expect(result.success).toBe(true);
                expect(projectRepo.listProjetos).toHaveBeenCalledWith({});
            });
        });

        describe('buscarProjeto', () => {
            it('deve delegar ao repository', async () => {
                const mockProjeto = { id: PROJETO_ID, nome: 'Projeto X' };
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(ok(mockProjeto));

                const result = await projectService.buscarProjeto(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(projectRepo.findProjetoById).toHaveBeenCalledWith(PROJETO_ID);
            });
        });

        describe('criarProjeto', () => {
            const validInput = {
                nome: 'Novo Projeto',
                responsavelId: USUARIO_ID,
            };

            it('deve criar projeto e adicionar criador como gerente', async () => {
                const mockProjeto = { id: PROJETO_ID, nome: 'Novo Projeto' };
                (projectRepo.saveProjeto as jest.Mock).mockResolvedValue(ok(mockProjeto));
                (teamRepo.addMembro as jest.Mock).mockResolvedValue(ok({}));

                const result = await projectService.criarProjeto(validInput, USUARIO_ID);

                expect(result.success).toBe(true);
                expect(projectRepo.saveProjeto).toHaveBeenCalled();
                expect(teamRepo.addMembro).toHaveBeenCalledWith(
                    expect.objectContaining({ usuarioId: USUARIO_ID, papel: 'gerente' })
                );
            });

            it('deve adicionar responsável como gerente se diferente do criador', async () => {
                const input = { ...validInput, responsavelId: 99 };
                const mockProjeto = { id: PROJETO_ID, nome: 'Novo Projeto' };
                (projectRepo.saveProjeto as jest.Mock).mockResolvedValue(ok(mockProjeto));
                (teamRepo.addMembro as jest.Mock).mockResolvedValue(ok({}));

                await projectService.criarProjeto(input, USUARIO_ID);

                // Should be called twice: once for creator, once for responsavel
                expect(teamRepo.addMembro).toHaveBeenCalledTimes(2);
            });

            it('deve retornar erro de validação para input inválido', async () => {
                const result = await projectService.criarProjeto(
                    { nome: '', responsavelId: 0 } as any,
                    USUARIO_ID
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
                expect(projectRepo.saveProjeto).not.toHaveBeenCalled();
            });

            it('deve propagar erro do repository', async () => {
                (projectRepo.saveProjeto as jest.Mock).mockResolvedValue(
                    err(appError('DATABASE_ERROR', 'Erro DB'))
                );

                const result = await projectService.criarProjeto(validInput, USUARIO_ID);

                expect(result.success).toBe(false);
            });
        });

        describe('atualizarProjeto', () => {
            it('deve atualizar projeto com sucesso', async () => {
                const mockProjeto = { id: PROJETO_ID, nome: 'Atualizado' };
                (projectRepo.updateProjeto as jest.Mock).mockResolvedValue(ok(mockProjeto));

                const result = await projectService.atualizarProjeto(PROJETO_ID, { nome: 'Atualizado' });

                expect(result.success).toBe(true);
                expect(projectRepo.updateProjeto).toHaveBeenCalledWith(PROJETO_ID, { nome: 'Atualizado' });
            });

            it('deve retornar erro de validação para input inválido', async () => {
                const result = await projectService.atualizarProjeto(PROJETO_ID, { progressoManual: 200 } as any);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
            });
        });

        describe('excluirProjeto', () => {
            it('deve excluir projeto existente', async () => {
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(ok({ id: PROJETO_ID }));
                (projectRepo.deleteProjeto as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await projectService.excluirProjeto(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(projectRepo.deleteProjeto).toHaveBeenCalledWith(PROJETO_ID);
            });

            it('deve retornar erro se projeto não existe', async () => {
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Não encontrado'))
                );

                const result = await projectService.excluirProjeto(PROJETO_ID);

                expect(result.success).toBe(false);
                expect(projectRepo.deleteProjeto).not.toHaveBeenCalled();
            });
        });

        describe('recalcularProgresso', () => {
            it('deve recalcular progresso baseado em tarefas', async () => {
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: null })
                );
                (taskRepo.countTarefasByProject as jest.Mock).mockResolvedValue(
                    ok({ total: 10, concluidas: 5 })
                );
                (projectRepo.updateProjetoProgresso as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await projectService.recalcularProgresso(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(projectRepo.updateProjetoProgresso).toHaveBeenCalledWith(PROJETO_ID, 50);
            });

            it('deve não recalcular se progressoManual está ativo', async () => {
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: 75 })
                );

                const result = await projectService.recalcularProgresso(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(taskRepo.countTarefasByProject).not.toHaveBeenCalled();
            });

            it('deve retornar 0 quando não há tarefas', async () => {
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: null })
                );
                (taskRepo.countTarefasByProject as jest.Mock).mockResolvedValue(
                    ok({ total: 0, concluidas: 0 })
                );
                (projectRepo.updateProjetoProgresso as jest.Mock).mockResolvedValue(ok(undefined));

                await projectService.recalcularProgresso(PROJETO_ID);

                expect(projectRepo.updateProjetoProgresso).toHaveBeenCalledWith(PROJETO_ID, 0);
            });
        });
    });

    // =========================================================================
    // taskService
    // =========================================================================
    describe('taskService', () => {
        describe('listarTarefasPorProjeto', () => {
            it('deve delegar ao repository', async () => {
                (taskRepo.listTarefasByProject as jest.Mock).mockResolvedValue(ok([]));

                const result = await taskService.listarTarefasPorProjeto(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(taskRepo.listTarefasByProject).toHaveBeenCalledWith(PROJETO_ID, undefined);
            });

            it('deve passar filtro de status', async () => {
                (taskRepo.listTarefasByProject as jest.Mock).mockResolvedValue(ok([]));

                await taskService.listarTarefasPorProjeto(PROJETO_ID, 'em_progresso');

                expect(taskRepo.listTarefasByProject).toHaveBeenCalledWith(PROJETO_ID, 'em_progresso');
            });
        });

        describe('criarTarefa', () => {
            const validInput = {
                projetoId: PROJETO_ID,
                titulo: 'Nova Tarefa',
            };

            it('deve criar tarefa com sucesso', async () => {
                const mockTarefa = { id: TAREFA_ID, titulo: 'Nova Tarefa' };
                (taskRepo.saveTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));
                // recalcularProgresso chain
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: 80 })
                );

                const result = await taskService.criarTarefa(validInput, USUARIO_ID);

                expect(result.success).toBe(true);
                expect(taskRepo.saveTarefa).toHaveBeenCalled();
            });

            it('deve verificar se responsável é membro do projeto', async () => {
                const input = { ...validInput, responsavelId: 99 };
                (teamRepo.isUserMemberOfProject as jest.Mock).mockResolvedValue(ok(false));

                const result = await taskService.criarTarefa(input, USUARIO_ID);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.message).toContain('membro do projeto');
                }
            });

            it('deve retornar erro de validação para input inválido', async () => {
                const result = await taskService.criarTarefa(
                    { projetoId: 'invalid', titulo: '' } as any,
                    USUARIO_ID
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
            });
        });

        describe('atualizarTarefa', () => {
            it('deve atualizar tarefa com sucesso', async () => {
                const mockTarefa = { id: TAREFA_ID, titulo: 'Atualizada' };
                (taskRepo.updateTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));

                const result = await taskService.atualizarTarefa(TAREFA_ID, { titulo: 'Atualizada' });

                expect(result.success).toBe(true);
                expect(taskRepo.updateTarefa).toHaveBeenCalledWith(TAREFA_ID, { titulo: 'Atualizada' });
            });

            it('deve recalcular progresso quando status muda', async () => {
                const mockTarefa = { id: TAREFA_ID, status: 'concluido' };
                (taskRepo.updateTarefa as jest.Mock).mockResolvedValue(ok(mockTarefa));
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: null })
                );
                (taskRepo.countTarefasByProject as jest.Mock).mockResolvedValue(
                    ok({ total: 5, concluidas: 3 })
                );
                (projectRepo.updateProjetoProgresso as jest.Mock).mockResolvedValue(ok(undefined));

                await taskService.atualizarTarefa(TAREFA_ID, { status: 'concluido' }, PROJETO_ID);

                expect(projectRepo.updateProjetoProgresso).toHaveBeenCalled();
            });
        });

        describe('excluirTarefa', () => {
            it('deve excluir tarefa e recalcular progresso', async () => {
                (taskRepo.findTarefaById as jest.Mock).mockResolvedValue(
                    ok({ id: TAREFA_ID, projetoId: PROJETO_ID })
                );
                (taskRepo.deleteTarefa as jest.Mock).mockResolvedValue(ok(undefined));
                (projectRepo.findProjetoById as jest.Mock).mockResolvedValue(
                    ok({ id: PROJETO_ID, progressoManual: 50 })
                );

                const result = await taskService.excluirTarefa(TAREFA_ID);

                expect(result.success).toBe(true);
                expect(taskRepo.deleteTarefa).toHaveBeenCalledWith(TAREFA_ID);
            });

            it('deve retornar erro se tarefa não existe', async () => {
                (taskRepo.findTarefaById as jest.Mock).mockResolvedValue(
                    err(appError('NOT_FOUND', 'Não encontrada'))
                );

                const result = await taskService.excluirTarefa(TAREFA_ID);

                expect(result.success).toBe(false);
                expect(taskRepo.deleteTarefa).not.toHaveBeenCalled();
            });
        });

        describe('reordenarKanban', () => {
            it('deve delegar ao repository', async () => {
                (taskRepo.updateKanbanOrder as jest.Mock).mockResolvedValue(ok(undefined));
                const items = [
                    { tarefaId: TAREFA_ID, status: 'em_progresso' as const, ordemKanban: 0 },
                ];

                const result = await taskService.reordenarKanban(items);

                expect(result.success).toBe(true);
                expect(taskRepo.updateKanbanOrder).toHaveBeenCalledWith(items);
            });
        });
    });

    // =========================================================================
    // teamService
    // =========================================================================
    describe('teamService', () => {
        describe('listarMembros', () => {
            it('deve delegar ao repository', async () => {
                (teamRepo.listMembrosByProject as jest.Mock).mockResolvedValue(ok([]));

                const result = await teamService.listarMembros(PROJETO_ID);

                expect(result.success).toBe(true);
                expect(teamRepo.listMembrosByProject).toHaveBeenCalledWith(PROJETO_ID);
            });
        });

        describe('adicionarMembro', () => {
            it('deve adicionar membro com sucesso', async () => {
                const input = { projetoId: PROJETO_ID, usuarioId: 5, papel: 'membro' as const };
                (teamRepo.addMembro as jest.Mock).mockResolvedValue(ok({ id: MEMBRO_ID }));

                const result = await teamService.adicionarMembro(input);

                expect(result.success).toBe(true);
                expect(teamRepo.addMembro).toHaveBeenCalled();
            });

            it('deve retornar erro de validação para input inválido', async () => {
                const result = await teamService.adicionarMembro({
                    projetoId: 'invalid',
                    usuarioId: 0,
                } as any);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
            });
        });

        describe('removerMembro', () => {
            it('deve remover membro não-gerente', async () => {
                (teamRepo.findMembroById as jest.Mock).mockResolvedValue(
                    ok({ id: MEMBRO_ID, papel: 'membro' })
                );
                (teamRepo.removeMembro as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await teamService.removerMembro(MEMBRO_ID, PROJETO_ID);

                expect(result.success).toBe(true);
                expect(teamRepo.removeMembro).toHaveBeenCalledWith(MEMBRO_ID);
            });

            it('deve impedir remoção do único gerente', async () => {
                (teamRepo.findMembroById as jest.Mock).mockResolvedValue(
                    ok({ id: MEMBRO_ID, papel: 'gerente' })
                );
                (teamRepo.countGerentesByProject as jest.Mock).mockResolvedValue(ok(1));

                const result = await teamService.removerMembro(MEMBRO_ID, PROJETO_ID);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.message).toContain('único gerente');
                }
                expect(teamRepo.removeMembro).not.toHaveBeenCalled();
            });

            it('deve permitir remoção de gerente se há outros', async () => {
                (teamRepo.findMembroById as jest.Mock).mockResolvedValue(
                    ok({ id: MEMBRO_ID, papel: 'gerente' })
                );
                (teamRepo.countGerentesByProject as jest.Mock).mockResolvedValue(ok(2));
                (teamRepo.removeMembro as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await teamService.removerMembro(MEMBRO_ID, PROJETO_ID);

                expect(result.success).toBe(true);
            });
        });

        describe('alterarPapel', () => {
            it('deve alterar papel com sucesso', async () => {
                (teamRepo.updateMembroRole as jest.Mock).mockResolvedValue(
                    ok({ id: MEMBRO_ID, papel: 'observador' })
                );

                const result = await teamService.alterarPapel(MEMBRO_ID, 'observador');

                expect(result.success).toBe(true);
                expect(teamRepo.updateMembroRole).toHaveBeenCalledWith(MEMBRO_ID, 'observador');
            });
        });
    });

    // =========================================================================
    // reminderService
    // =========================================================================
    describe('reminderService', () => {
        describe('listarLembretes', () => {
            it('deve delegar ao repository', async () => {
                (reminderRepo.listLembretesByUser as jest.Mock).mockResolvedValue(ok([]));

                const result = await reminderService.listarLembretes(USUARIO_ID);

                expect(result.success).toBe(true);
                expect(reminderRepo.listLembretesByUser).toHaveBeenCalledWith(USUARIO_ID, undefined);
            });
        });

        describe('criarLembrete', () => {
            it('deve criar lembrete com sucesso', async () => {
                const input = { texto: 'Lembrete', dataHora: '2024-06-15T10:00:00Z' };
                (reminderRepo.saveLembrete as jest.Mock).mockResolvedValue(ok({ id: 'l1' }));

                const result = await reminderService.criarLembrete(input, USUARIO_ID);

                expect(result.success).toBe(true);
                expect(reminderRepo.saveLembrete).toHaveBeenCalled();
            });

            it('deve retornar erro de validação para texto vazio', async () => {
                const result = await reminderService.criarLembrete(
                    { texto: '', dataHora: '2024-01-01' },
                    USUARIO_ID
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe('VALIDATION_ERROR');
                }
            });
        });

        describe('concluirLembrete', () => {
            it('deve concluir lembrete', async () => {
                (reminderRepo.toggleLembreteComplete as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await reminderService.concluirLembrete('l1', true, USUARIO_ID);

                expect(result.success).toBe(true);
                expect(reminderRepo.toggleLembreteComplete).toHaveBeenCalledWith('l1', true, USUARIO_ID);
            });
        });

        describe('excluirLembrete', () => {
            it('deve excluir lembrete', async () => {
                (reminderRepo.deleteLembrete as jest.Mock).mockResolvedValue(ok(undefined));

                const result = await reminderService.excluirLembrete('l1', USUARIO_ID);

                expect(result.success).toBe(true);
                expect(reminderRepo.deleteLembrete).toHaveBeenCalledWith('l1', USUARIO_ID);
            });
        });
    });

    // =========================================================================
    // dashboardService
    // =========================================================================
    describe('dashboardService', () => {
        it('obterResumo deve delegar ao repository', async () => {
            const mockSummary = { projetosAtivos: 5 };
            (dashboardRepo.getDashboardSummary as jest.Mock).mockResolvedValue(ok(mockSummary));

            const result = await dashboardService.obterResumo();

            expect(result.success).toBe(true);
            expect(dashboardRepo.getDashboardSummary).toHaveBeenCalled();
        });

        it('obterProjetosPorPeriodo deve delegar ao repository', async () => {
            (dashboardRepo.getProjetosPorPeriodo as jest.Mock).mockResolvedValue(ok([]));

            const result = await dashboardService.obterProjetosPorPeriodo(6);

            expect(result.success).toBe(true);
            expect(dashboardRepo.getProjetosPorPeriodo).toHaveBeenCalledWith(6);
        });

        it('obterDistribuicaoPorStatus deve delegar ao repository', async () => {
            (dashboardRepo.getDistribuicaoPorStatus as jest.Mock).mockResolvedValue(ok([]));

            const result = await dashboardService.obterDistribuicaoPorStatus();

            expect(result.success).toBe(true);
        });

        it('obterComparativoAnual deve delegar ao repository', async () => {
            (dashboardRepo.getComparativoAnual as jest.Mock).mockResolvedValue(ok([]));

            const result = await dashboardService.obterComparativoAnual();

            expect(result.success).toBe(true);
        });

        it('obterMembrosAtivos deve delegar ao repository', async () => {
            (dashboardRepo.getMembrosAtivos as jest.Mock).mockResolvedValue(ok([]));

            const result = await dashboardService.obterMembrosAtivos(10);

            expect(result.success).toBe(true);
            expect(dashboardRepo.getMembrosAtivos).toHaveBeenCalledWith(10);
        });
    });
});
