import { describe, it, expect } from '@jest/globals';
import {
    cpfSchema,
    emailSchema,
    telefoneSchema,
    enderecoSchema,
    criarUsuarioSchema,
    atualizarUsuarioSchema,
    isUsuarioAtivo,
    isSuperAdmin,
    GENERO_LABELS,
    STATUS_LABELS,
} from '@/app/(authenticated)/usuarios';

/**
 * Testes de domínio do módulo perfil.
 *
 * O módulo perfil é uma camada de apresentação sobre o módulo `usuarios`.
 * Seus schemas Zod e tipos vêm de `usuarios/domain.ts`.
 * Estes testes validam os schemas usados nas operações de perfil
 * (obter e atualizar perfil do usuário autenticado).
 */
describe('Perfil Domain — Schemas Zod (via usuarios)', () => {
    // -------------------------------------------------------------------------
    // cpfSchema
    // -------------------------------------------------------------------------
    describe('cpfSchema', () => {
        it('deve aceitar CPF válido com 11 dígitos', () => {
            expect(cpfSchema.parse('12345678901')).toBe('12345678901');
        });

        it('deve remover caracteres não numéricos e aceitar CPF formatado', () => {
            expect(cpfSchema.parse('123.456.789-01')).toBe('12345678901');
        });

        it('deve rejeitar CPF com menos de 11 dígitos', () => {
            expect(() => cpfSchema.parse('1234567890')).toThrow();
        });

        it('deve rejeitar CPF com mais de 11 dígitos', () => {
            expect(() => cpfSchema.parse('123456789012')).toThrow();
        });

        it('deve rejeitar string vazia', () => {
            expect(() => cpfSchema.parse('')).toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // emailSchema
    // -------------------------------------------------------------------------
    describe('emailSchema', () => {
        it('deve aceitar email válido', () => {
            expect(emailSchema.parse('usuario@empresa.com')).toBe('usuario@empresa.com');
        });

        it('deve rejeitar email sem @', () => {
            expect(() => emailSchema.parse('invalido')).toThrow();
        });

        it('deve rejeitar string vazia', () => {
            expect(() => emailSchema.parse('')).toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // telefoneSchema
    // -------------------------------------------------------------------------
    describe('telefoneSchema', () => {
        it('deve aceitar telefone e remover formatação', () => {
            expect(telefoneSchema.parse('(11) 99999-8888')).toBe('11999998888');
        });

        it('deve aceitar null', () => {
            expect(telefoneSchema.parse(null)).toBeNull();
        });

        it('deve aceitar string vazia e retornar null', () => {
            expect(telefoneSchema.parse('')).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // enderecoSchema
    // -------------------------------------------------------------------------
    describe('enderecoSchema', () => {
        it('deve aceitar endereço completo', () => {
            const endereco = {
                logradouro: 'Rua das Flores',
                numero: '123',
                complemento: 'Sala 1',
                bairro: 'Centro',
                cidade: 'São Paulo',
                estado: 'SP',
                pais: 'Brasil',
                cep: '01234-567',
            };
            const parsed = enderecoSchema.parse(endereco);
            expect(parsed).toBeDefined();
            expect(parsed!.logradouro).toBe('Rua das Flores');
            expect(parsed!.cep).toBe('01234567'); // CEP sem formatação
        });

        it('deve aceitar endereço parcial', () => {
            const parsed = enderecoSchema.parse({ cidade: 'Curitiba' });
            expect(parsed!.cidade).toBe('Curitiba');
        });

        it('deve aceitar null', () => {
            expect(enderecoSchema.parse(null)).toBeNull();
        });

        it('deve aceitar undefined', () => {
            expect(enderecoSchema.parse(undefined)).toBeUndefined();
        });

        it('deve rejeitar estado com mais de 2 letras', () => {
            expect(() => enderecoSchema.parse({ estado: 'São Paulo' })).toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // criarUsuarioSchema (usado indiretamente pelo perfil via service)
    // -------------------------------------------------------------------------
    describe('criarUsuarioSchema', () => {
        const dadosMinimos = {
            nomeCompleto: 'João Silva',
            nomeExibicao: 'João',
            cpf: '123.456.789-01',
            emailCorporativo: 'joao@empresa.com',
        };

        it('deve aceitar dados mínimos válidos', () => {
            const parsed = criarUsuarioSchema.parse(dadosMinimos);
            expect(parsed.nomeCompleto).toBe('João Silva');
            expect(parsed.cpf).toBe('12345678901');
        });

        it('deve aceitar dados completos', () => {
            const dadosCompletos = {
                ...dadosMinimos,
                rg: '12.345.678-9',
                dataNascimento: '1990-01-15',
                genero: 'masculino' as const,
                oab: '123456',
                ufOab: 'SP',
                emailPessoal: 'joao@pessoal.com',
                telefone: '(11) 99999-8888',
                ramal: '1234',
                endereco: { cidade: 'São Paulo', estado: 'SP' },
                cargoId: 1,
                isSuperAdmin: false,
                ativo: true,
            };
            const parsed = criarUsuarioSchema.parse(dadosCompletos);
            expect(parsed.genero).toBe('masculino');
            expect(parsed.ufOab).toBe('SP');
        });

        it('deve rejeitar nome completo com menos de 3 caracteres', () => {
            expect(() => criarUsuarioSchema.parse({ ...dadosMinimos, nomeCompleto: 'AB' })).toThrow();
        });

        it('deve rejeitar nome de exibição com menos de 2 caracteres', () => {
            expect(() => criarUsuarioSchema.parse({ ...dadosMinimos, nomeExibicao: 'A' })).toThrow();
        });

        it('deve rejeitar email corporativo inválido', () => {
            expect(() => criarUsuarioSchema.parse({ ...dadosMinimos, emailCorporativo: 'invalido' })).toThrow();
        });

        it('deve rejeitar gênero inválido', () => {
            expect(() => criarUsuarioSchema.parse({ ...dadosMinimos, genero: 'invalido' })).toThrow();
        });

        it('deve converter ufOab vazia para null', () => {
            const parsed = criarUsuarioSchema.parse({ ...dadosMinimos, ufOab: '' });
            expect(parsed.ufOab).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // atualizarUsuarioSchema (usado pelo perfil para atualizar dados)
    // -------------------------------------------------------------------------
    describe('atualizarUsuarioSchema', () => {
        it('deve aceitar atualização parcial com id', () => {
            const parsed = atualizarUsuarioSchema.parse({ id: 1, nomeExibicao: 'Novo Nome' });
            expect(parsed.id).toBe(1);
            expect(parsed.nomeExibicao).toBe('Novo Nome');
        });

        it('deve aceitar apenas id (sem alterações)', () => {
            const parsed = atualizarUsuarioSchema.parse({ id: 42 });
            expect(parsed.id).toBe(42);
        });

        it('deve rejeitar sem id', () => {
            expect(() => atualizarUsuarioSchema.parse({ nomeExibicao: 'Teste' })).toThrow();
        });
    });

    // -------------------------------------------------------------------------
    // Type Guards
    // -------------------------------------------------------------------------
    describe('isUsuarioAtivo', () => {
        it('deve retornar true para usuário ativo', () => {
            expect(isUsuarioAtivo({ ativo: true })).toBe(true);
        });

        it('deve retornar false para usuário inativo', () => {
            expect(isUsuarioAtivo({ ativo: false })).toBe(false);
        });
    });

    describe('isSuperAdmin', () => {
        it('deve retornar true para super admin', () => {
            expect(isSuperAdmin({ isSuperAdmin: true })).toBe(true);
        });

        it('deve retornar false para usuário comum', () => {
            expect(isSuperAdmin({ isSuperAdmin: false })).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------
    describe('Constantes de domínio', () => {
        it('GENERO_LABELS deve conter todos os gêneros', () => {
            expect(GENERO_LABELS).toHaveProperty('masculino');
            expect(GENERO_LABELS).toHaveProperty('feminino');
            expect(GENERO_LABELS).toHaveProperty('outro');
            expect(GENERO_LABELS).toHaveProperty('prefiro_nao_informar');
        });

        it('STATUS_LABELS deve conter ativo e inativo', () => {
            expect(STATUS_LABELS).toHaveProperty('ativo', 'Ativo');
            expect(STATUS_LABELS).toHaveProperty('inativo', 'Inativo');
        });
    });
});
