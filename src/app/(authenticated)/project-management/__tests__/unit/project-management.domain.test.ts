import { describe, it, expect } from '@jest/globals';
import {
    statusProjetoSchema,
    statusTarefaSchema,
    prioridadeSchema,
    papelProjetoSchema,
    createProjetoSchema,
    updateProjetoSchema,
    createTarefaSchema,
    updateTarefaSchema,
    updateKanbanOrderSchema,
    addMembroSchema,
    updateMembroSchema,
    createLembreteSchema,
    createComentarioSchema,
    converterParaProjeto,
    converterParaTarefa,
    converterParaMembro,
    converterParaLembrete,
    converterParaComentario,
    converterParaAnexo,
    STATUS_PROJETO_VALUES,
    STATUS_TAREFA_VALUES,
    PRIORIDADE_VALUES,
    PAPEL_PROJETO_VALUES,
    STATUS_PROJETO_LABELS,
    STATUS_TAREFA_LABELS,
    PRIORIDADE_LABELS,
    PAPEL_PROJETO_LABELS,
    KANBAN_COLUMNS,
} from '../../domain';

describe('Project Management Domain', () => {
    // =========================================================================
    // Enum Schemas
    // =========================================================================
    describe('statusProjetoSchema', () => {
        it('deve aceitar todos os status válidos', () => {
            for (const status of STATUS_PROJETO_VALUES) {
                expect(statusProjetoSchema.parse(status)).toBe(status);
            }
        });

        it('deve rejeitar status inválido', () => {
            expect(() => statusProjetoSchema.parse('invalido')).toThrow();
        });
    });

    describe('statusTarefaSchema', () => {
        it('deve aceitar todos os status válidos', () => {
            for (const status of STATUS_TAREFA_VALUES) {
                expect(statusTarefaSchema.parse(status)).toBe(status);
            }
        });

        it('deve rejeitar status inválido', () => {
            expect(() => statusTarefaSchema.parse('done')).toThrow();
        });
    });

    describe('prioridadeSchema', () => {
        it('deve aceitar todas as prioridades válidas', () => {
            for (const p of PRIORIDADE_VALUES) {
                expect(prioridadeSchema.parse(p)).toBe(p);
            }
        });

        it('deve rejeitar prioridade inválida', () => {
            expect(() => prioridadeSchema.parse('critica')).toThrow();
        });
    });

    describe('papelProjetoSchema', () => {
        it('deve aceitar todos os papéis válidos', () => {
            for (const papel of PAPEL_PROJETO_VALUES) {
                expect(papelProjetoSchema.parse(papel)).toBe(papel);
            }
        });

        it('deve rejeitar papel inválido', () => {
            expect(() => papelProjetoSchema.parse('admin')).toThrow();
        });
    });

    // =========================================================================
    // Labels e constantes
    // =========================================================================
    describe('Labels e constantes', () => {
        it('deve ter labels para todos os status de projeto', () => {
            for (const status of STATUS_PROJETO_VALUES) {
                expect(STATUS_PROJETO_LABELS[status]).toBeDefined();
            }
        });

        it('deve ter labels para todos os status de tarefa', () => {
            for (const status of STATUS_TAREFA_VALUES) {
                expect(STATUS_TAREFA_LABELS[status]).toBeDefined();
            }
        });

        it('deve ter labels para todas as prioridades', () => {
            for (const p of PRIORIDADE_VALUES) {
                expect(PRIORIDADE_LABELS[p]).toBeDefined();
            }
        });

        it('deve ter labels para todos os papéis', () => {
            for (const papel of PAPEL_PROJETO_VALUES) {
                expect(PAPEL_PROJETO_LABELS[papel]).toBeDefined();
            }
        });

        it('KANBAN_COLUMNS deve conter status válidos sem cancelado', () => {
            expect(KANBAN_COLUMNS).not.toContain('cancelado');
            for (const col of KANBAN_COLUMNS) {
                expect(STATUS_TAREFA_VALUES).toContain(col);
            }
        });
    });

    // =========================================================================
    // createProjetoSchema
    // =========================================================================
    describe('createProjetoSchema', () => {
        const validInput = {
            nome: 'Projeto Teste',
            responsavelId: 1,
        };

        it('deve aceitar input mínimo válido', () => {
            const parsed = createProjetoSchema.parse(validInput);
            expect(parsed.nome).toBe('Projeto Teste');
            expect(parsed.responsavelId).toBe(1);
            expect(parsed.status).toBe('planejamento');
            expect(parsed.prioridade).toBe('media');
            expect(parsed.tags).toEqual([]);
        });

        it('deve aceitar input completo', () => {
            const input = {
                ...validInput,
                descricao: 'Descrição do projeto',
                status: 'ativo' as const,
                prioridade: 'alta' as const,
                dataInicio: '2024-01-01',
                dataPrevisaoFim: '2024-12-31',
                clienteId: 10,
                processoId: 20,
                contratoId: 30,
                orcamento: 50000,
                tags: ['urgente', 'juridico'],
            };
            const parsed = createProjetoSchema.parse(input);
            expect(parsed.status).toBe('ativo');
            expect(parsed.tags).toEqual(['urgente', 'juridico']);
        });

        it('deve rejeitar nome vazio', () => {
            expect(() => createProjetoSchema.parse({ ...validInput, nome: '' })).toThrow();
        });

        it('deve rejeitar nome com mais de 255 caracteres', () => {
            expect(() => createProjetoSchema.parse({ ...validInput, nome: 'a'.repeat(256) })).toThrow();
        });

        it('deve rejeitar responsavelId não positivo', () => {
            expect(() => createProjetoSchema.parse({ nome: 'X', responsavelId: 0 })).toThrow();
            expect(() => createProjetoSchema.parse({ nome: 'X', responsavelId: -1 })).toThrow();
        });

        it('deve rejeitar orcamento negativo', () => {
            expect(() => createProjetoSchema.parse({ ...validInput, orcamento: -100 })).toThrow();
        });

        it('deve aceitar descricao null', () => {
            const parsed = createProjetoSchema.parse({ ...validInput, descricao: null });
            expect(parsed.descricao).toBeNull();
        });
    });

    // =========================================================================
    // updateProjetoSchema
    // =========================================================================
    describe('updateProjetoSchema', () => {
        it('deve aceitar atualização parcial', () => {
            const parsed = updateProjetoSchema.parse({ nome: 'Novo nome' });
            expect(parsed.nome).toBe('Novo nome');
        });

        it('deve aceitar objeto vazio', () => {
            const parsed = updateProjetoSchema.parse({});
            expect(parsed).toEqual({});
        });

        it('deve rejeitar progressoManual acima de 100', () => {
            expect(() => updateProjetoSchema.parse({ progressoManual: 101 })).toThrow();
        });

        it('deve rejeitar progressoManual negativo', () => {
            expect(() => updateProjetoSchema.parse({ progressoManual: -1 })).toThrow();
        });

        it('deve aceitar progressoManual null', () => {
            const parsed = updateProjetoSchema.parse({ progressoManual: null });
            expect(parsed.progressoManual).toBeNull();
        });
    });

    // =========================================================================
    // createTarefaSchema
    // =========================================================================
    describe('createTarefaSchema', () => {
        const validInput = {
            projetoId: '550e8400-e29b-41d4-a716-446655440000',
            titulo: 'Tarefa Teste',
        };

        it('deve aceitar input mínimo válido', () => {
            const parsed = createTarefaSchema.parse(validInput);
            expect(parsed.titulo).toBe('Tarefa Teste');
            expect(parsed.status).toBe('a_fazer');
            expect(parsed.prioridade).toBe('media');
        });

        it('deve aceitar input completo', () => {
            const input = {
                ...validInput,
                descricao: 'Descrição da tarefa',
                status: 'em_progresso' as const,
                prioridade: 'urgente' as const,
                responsavelId: 5,
                dataPrazo: '2024-06-30',
                estimativaHoras: 8,
                tarefaPaiId: '660e8400-e29b-41d4-a716-446655440000',
            };
            const parsed = createTarefaSchema.parse(input);
            expect(parsed.status).toBe('em_progresso');
            expect(parsed.estimativaHoras).toBe(8);
        });

        it('deve rejeitar titulo vazio', () => {
            expect(() => createTarefaSchema.parse({ ...validInput, titulo: '' })).toThrow();
        });

        it('deve rejeitar projetoId inválido (não UUID)', () => {
            expect(() => createTarefaSchema.parse({ ...validInput, projetoId: 'not-a-uuid' })).toThrow();
        });

        it('deve rejeitar estimativaHoras negativa', () => {
            expect(() => createTarefaSchema.parse({ ...validInput, estimativaHoras: -1 })).toThrow();
        });
    });

    // =========================================================================
    // updateTarefaSchema
    // =========================================================================
    describe('updateTarefaSchema', () => {
        it('deve aceitar atualização parcial', () => {
            const parsed = updateTarefaSchema.parse({ titulo: 'Novo título' });
            expect(parsed.titulo).toBe('Novo título');
        });

        it('deve aceitar objeto vazio', () => {
            const parsed = updateTarefaSchema.parse({});
            expect(parsed).toEqual({});
        });

        it('deve rejeitar horasRegistradas negativas', () => {
            expect(() => updateTarefaSchema.parse({ horasRegistradas: -1 })).toThrow();
        });
    });

    // =========================================================================
    // updateKanbanOrderSchema
    // =========================================================================
    describe('updateKanbanOrderSchema', () => {
        it('deve aceitar input válido', () => {
            const input = {
                tarefaId: '550e8400-e29b-41d4-a716-446655440000',
                status: 'em_progresso' as const,
                ordemKanban: 2,
            };
            const parsed = updateKanbanOrderSchema.parse(input);
            expect(parsed.ordemKanban).toBe(2);
        });

        it('deve rejeitar ordemKanban negativa', () => {
            expect(() => updateKanbanOrderSchema.parse({
                tarefaId: '550e8400-e29b-41d4-a716-446655440000',
                status: 'a_fazer',
                ordemKanban: -1,
            })).toThrow();
        });

        it('deve rejeitar tarefaId inválido', () => {
            expect(() => updateKanbanOrderSchema.parse({
                tarefaId: 'invalid',
                status: 'a_fazer',
                ordemKanban: 0,
            })).toThrow();
        });
    });

    // =========================================================================
    // addMembroSchema
    // =========================================================================
    describe('addMembroSchema', () => {
        it('deve aceitar input válido', () => {
            const input = {
                projetoId: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: 1,
            };
            const parsed = addMembroSchema.parse(input);
            expect(parsed.papel).toBe('membro');
        });

        it('deve aceitar papel explícito', () => {
            const input = {
                projetoId: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: 1,
                papel: 'gerente' as const,
            };
            const parsed = addMembroSchema.parse(input);
            expect(parsed.papel).toBe('gerente');
        });

        it('deve rejeitar projetoId inválido', () => {
            expect(() => addMembroSchema.parse({ projetoId: 'invalid', usuarioId: 1 })).toThrow();
        });

        it('deve rejeitar usuarioId não positivo', () => {
            expect(() => addMembroSchema.parse({
                projetoId: '550e8400-e29b-41d4-a716-446655440000',
                usuarioId: 0,
            })).toThrow();
        });
    });

    // =========================================================================
    // updateMembroSchema
    // =========================================================================
    describe('updateMembroSchema', () => {
        it('deve aceitar papel válido', () => {
            const parsed = updateMembroSchema.parse({ papel: 'observador' });
            expect(parsed.papel).toBe('observador');
        });

        it('deve rejeitar papel inválido', () => {
            expect(() => updateMembroSchema.parse({ papel: 'admin' })).toThrow();
        });
    });

    // =========================================================================
    // createLembreteSchema
    // =========================================================================
    describe('createLembreteSchema', () => {
        it('deve aceitar input válido', () => {
            const input = {
                texto: 'Lembrar de revisar',
                dataHora: '2024-06-15T10:00:00Z',
            };
            const parsed = createLembreteSchema.parse(input);
            expect(parsed.texto).toBe('Lembrar de revisar');
            expect(parsed.prioridade).toBe('media');
        });

        it('deve rejeitar texto vazio', () => {
            expect(() => createLembreteSchema.parse({ texto: '', dataHora: '2024-01-01' })).toThrow();
        });

        it('deve rejeitar texto com mais de 1000 caracteres', () => {
            expect(() => createLembreteSchema.parse({
                texto: 'a'.repeat(1001),
                dataHora: '2024-01-01',
            })).toThrow();
        });
    });

    // =========================================================================
    // createComentarioSchema
    // =========================================================================
    describe('createComentarioSchema', () => {
        it('deve aceitar input válido', () => {
            const parsed = createComentarioSchema.parse({ conteudo: 'Comentário teste' });
            expect(parsed.conteudo).toBe('Comentário teste');
        });

        it('deve rejeitar conteudo vazio', () => {
            expect(() => createComentarioSchema.parse({ conteudo: '' })).toThrow();
        });

        it('deve rejeitar conteudo com mais de 5000 caracteres', () => {
            expect(() => createComentarioSchema.parse({ conteudo: 'a'.repeat(5001) })).toThrow();
        });
    });

    // =========================================================================
    // Converter functions
    // =========================================================================
    describe('converterParaProjeto', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-1',
                nome: 'Projeto X',
                descricao: null,
                status: 'ativo',
                prioridade: 'alta',
                data_inicio: '2024-01-01',
                data_previsao_fim: '2024-12-31',
                data_conclusao: null,
                cliente_id: 10,
                processo_id: null,
                contrato_id: null,
                responsavel_id: 1,
                criado_por: 1,
                orcamento: 5000,
                valor_gasto: 1000,
                progresso: 50,
                progresso_manual: null,
                tags: ['tag1'],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };
            const projeto = converterParaProjeto(data);
            expect(projeto.dataInicio).toBe('2024-01-01');
            expect(projeto.dataPrevisaoFim).toBe('2024-12-31');
            expect(projeto.responsavelId).toBe(1);
            expect(projeto.tags).toEqual(['tag1']);
            expect(projeto.progresso).toBe(50);
        });

        it('deve usar defaults para campos ausentes', () => {
            const data = {
                id: 'uuid-1',
                nome: 'Projeto',
                status: 'planejamento',
                prioridade: 'media',
                responsavel_id: 1,
                criado_por: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };
            const projeto = converterParaProjeto(data);
            expect(projeto.descricao).toBeNull();
            expect(projeto.progresso).toBe(0);
            expect(projeto.tags).toEqual([]);
        });
    });

    describe('converterParaTarefa', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-t1',
                projeto_id: 'uuid-p1',
                titulo: 'Tarefa X',
                descricao: 'Desc',
                status: 'a_fazer',
                prioridade: 'media',
                responsavel_id: 5,
                data_prazo: '2024-06-30',
                data_conclusao: null,
                ordem_kanban: 3,
                estimativa_horas: 4,
                horas_registradas: 2,
                tarefa_pai_id: null,
                criado_por: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };
            const tarefa = converterParaTarefa(data);
            expect(tarefa.projetoId).toBe('uuid-p1');
            expect(tarefa.dataPrazo).toBe('2024-06-30');
            expect(tarefa.ordemKanban).toBe(3);
            expect(tarefa.estimativaHoras).toBe(4);
        });
    });

    describe('converterParaMembro', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-m1',
                projeto_id: 'uuid-p1',
                usuario_id: 42,
                papel: 'gerente',
                adicionado_em: '2024-01-01T00:00:00Z',
                usuario_nome: 'João',
            };
            const membro = converterParaMembro(data);
            expect(membro.projetoId).toBe('uuid-p1');
            expect(membro.usuarioId).toBe(42);
            expect(membro.papel).toBe('gerente');
            expect(membro.usuarioNome).toBe('João');
        });
    });

    describe('converterParaLembrete', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-l1',
                projeto_id: 'uuid-p1',
                tarefa_id: null,
                usuario_id: 1,
                texto: 'Lembrete',
                data_hora: '2024-06-15T10:00:00Z',
                prioridade: 'alta',
                concluido: false,
                created_at: '2024-01-01T00:00:00Z',
            };
            const lembrete = converterParaLembrete(data);
            expect(lembrete.projetoId).toBe('uuid-p1');
            expect(lembrete.dataHora).toBe('2024-06-15T10:00:00Z');
            expect(lembrete.concluido).toBe(false);
        });
    });

    describe('converterParaComentario', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-c1',
                projeto_id: null,
                tarefa_id: 'uuid-t1',
                usuario_id: 1,
                conteudo: 'Comentário',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            };
            const comentario = converterParaComentario(data);
            expect(comentario.tarefaId).toBe('uuid-t1');
            expect(comentario.conteudo).toBe('Comentário');
        });
    });

    describe('converterParaAnexo', () => {
        it('deve converter snake_case para camelCase', () => {
            const data = {
                id: 'uuid-a1',
                projeto_id: 'uuid-p1',
                tarefa_id: null,
                usuario_id: 1,
                nome_arquivo: 'doc.pdf',
                url: 'https://example.com/doc.pdf',
                tamanho_bytes: 1024,
                tipo_mime: 'application/pdf',
                created_at: '2024-01-01T00:00:00Z',
            };
            const anexo = converterParaAnexo(data);
            expect(anexo.nomeArquivo).toBe('doc.pdf');
            expect(anexo.tamanhoBytes).toBe(1024);
            expect(anexo.tipoMime).toBe('application/pdf');
        });
    });
});
