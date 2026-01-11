/**
 * Testes Property-Based para Utilitários
 *
 * Valida conversões de case, manipulação de classes CSS e geração de avatares
 * usando property-based testing com fast-check.
 */

import * as fc from 'fast-check';
import {
  cn,
  fromSnakeToCamel,
  fromCamelToSnake,
  camelToSnakeKey,
  generateAvatarFallback,
} from '@/lib/utils';

describe('Utils - Property-Based Tests', () => {
  describe('cn (Class Names)', () => {
    it('deve combinar classes simples', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
    });

    it('deve remover classes duplicadas', () => {
      expect(cn('btn', 'btn')).toBe('btn');
    });

    it('deve lidar com classes condicionais', () => {
      expect(cn('btn', false && 'hidden', 'active')).toBe('btn active');
      expect(cn('btn', true && 'hidden', 'active')).toBe('btn hidden active');
    });

    it('deve mesclar classes conflitantes do Tailwind', () => {
      // twMerge deve resolver conflitos de classes Tailwind
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('deve lidar com arrays de classes', () => {
      expect(cn(['btn', 'btn-primary'])).toBe('btn btn-primary');
    });

    it('deve lidar com objetos de classes', () => {
      expect(cn({ btn: true, 'btn-primary': true })).toBe('btn btn-primary');
      expect(cn({ btn: true, 'btn-primary': false })).toBe('btn');
    });

    it('deve lidar com valores null/undefined', () => {
      expect(cn('btn', null, undefined, 'active')).toBe('btn active');
    });

    it('deve lidar com string vazia', () => {
      expect(cn('')).toBe('');
      expect(cn('', '')).toBe('');
    });

    it('Property: sempre retorna string', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string()),
          (classes) => {
            const result = cn(...classes);
            expect(typeof result).toBe('string');
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('camelToSnakeKey', () => {
    it('Property: sempre retorna snake_case válido', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          (str) => {
            const result = camelToSnakeKey(str);
            // Deve conter apenas letras minúsculas, números e underscores
            expect(result).toMatch(/^[a-z0-9_]+$/);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('Property: não deve ter underscores consecutivos', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
          (str) => {
            const result = camelToSnakeKey(str);
            expect(result).not.toMatch(/__/);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve converter camelCase para snake_case', () => {
      expect(camelToSnakeKey('nomeCompleto')).toBe('nome_completo');
      expect(camelToSnakeKey('emailCorporativo')).toBe('email_corporativo');
      expect(camelToSnakeKey('dataNascimento')).toBe('data_nascimento');
    });

    it('deve lidar com múltiplas maiúsculas consecutivas', () => {
      expect(camelToSnakeKey('URLCompleta')).toBe('u_r_l_completa');
      expect(camelToSnakeKey('HTTPSProtocol')).toBe('h_t_t_p_s_protocol');
    });

    it('deve lidar com string já em minúsculas', () => {
      expect(camelToSnakeKey('nome')).toBe('nome');
      expect(camelToSnakeKey('email')).toBe('email');
    });

    it('deve lidar com string vazia', () => {
      expect(camelToSnakeKey('')).toBe('');
    });

    it('deve lidar com números', () => {
      expect(camelToSnakeKey('item1Nome')).toBe('item1_nome');
      expect(camelToSnakeKey('valor2024')).toBe('valor2024');
    });
  });

  describe('fromSnakeToCamel', () => {
    it('Property: conversão snake -> camel -> snake é idempotente', () => {
      fc.assert(
        fc.property(
          fc.record({
            nome_completo: fc.string(),
            email_corporativo: fc.string(),
            data_nascimento: fc.string(),
            valor_causa: fc.double(),
            id_usuario: fc.integer(),
          }),
          (obj) => {
            const camel = fromSnakeToCamel(obj);
            const snake = fromCamelToSnake(camel);
            expect(snake).toEqual(obj);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve converter objeto simples', () => {
      const input = {
        nome_completo: 'João Silva',
        email_corporativo: 'joao@example.com',
        data_nascimento: '1990-01-01',
      };

      const expected = {
        nomeCompleto: 'João Silva',
        emailCorporativo: 'joao@example.com',
        dataNascimento: '1990-01-01',
      };

      expect(fromSnakeToCamel(input)).toEqual(expected);
    });

    it('deve converter objeto aninhado', () => {
      const input = {
        usuario_dados: {
          nome_completo: 'João Silva',
          endereco_completo: {
            nome_rua: 'Rua A',
            numero_casa: '123',
          },
        },
      };

      const expected = {
        usuarioDados: {
          nomeCompleto: 'João Silva',
          enderecoCompleto: {
            nomeRua: 'Rua A',
            numeroCasa: '123',
          },
        },
      };

      expect(fromSnakeToCamel(input)).toEqual(expected);
    });

    it('deve converter arrays de objetos', () => {
      const input = {
        lista_usuarios: [
          { nome_completo: 'João', idade_anos: 30 },
          { nome_completo: 'Maria', idade_anos: 25 },
        ],
      };

      const expected = {
        listaUsuarios: [
          { nomeCompleto: 'João', idadeAnos: 30 },
          { nomeCompleto: 'Maria', idadeAnos: 25 },
        ],
      };

      expect(fromSnakeToCamel(input)).toEqual(expected);
    });

    it('deve manter valores primitivos inalterados', () => {
      expect(fromSnakeToCamel(null)).toBeNull();
      expect(fromSnakeToCamel(undefined)).toBeUndefined();
      expect(fromSnakeToCamel(123)).toBe(123);
      expect(fromSnakeToCamel('string')).toBe('string');
      expect(fromSnakeToCamel(true)).toBe(true);
    });

    it('deve manter arrays de primitivos inalterados', () => {
      expect(fromSnakeToCamel([1, 2, 3])).toEqual([1, 2, 3]);
      expect(fromSnakeToCamel(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('deve lidar com objeto vazio', () => {
      expect(fromSnakeToCamel({})).toEqual({});
    });

    it('deve lidar com array vazio', () => {
      expect(fromSnakeToCamel([])).toEqual([]);
    });

    it('deve converter chaves com números', () => {
      const input = {
        item_1_nome: 'Item 1',
        valor_2024_total: 1000,
      };

      const expected = {
        item1Nome: 'Item 1',
        valor2024Total: 1000,
      };

      expect(fromSnakeToCamel(input)).toEqual(expected);
    });

    it('deve lidar com múltiplos underscores', () => {
      const input = {
        nome_completo_usuario: 'João Silva',
      };

      const expected = {
        nomeCompletoUsuario: 'João Silva',
      };

      expect(fromSnakeToCamel(input)).toEqual(expected);
    });
  });

  describe('fromCamelToSnake', () => {
    it('Property: conversão camel -> snake -> camel é idempotente', () => {
      fc.assert(
        fc.property(
          fc.record({
            nomeCompleto: fc.string(),
            emailCorporativo: fc.string(),
            dataNascimento: fc.string(),
            valorCausa: fc.double(),
            idUsuario: fc.integer(),
          }),
          (obj) => {
            const snake = fromCamelToSnake(obj);
            const camel = fromSnakeToCamel(snake);
            expect(camel).toEqual(obj);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve converter objeto simples', () => {
      const input = {
        nomeCompleto: 'João Silva',
        emailCorporativo: 'joao@example.com',
        dataNascimento: '1990-01-01',
      };

      const expected = {
        nome_completo: 'João Silva',
        email_corporativo: 'joao@example.com',
        data_nascimento: '1990-01-01',
      };

      expect(fromCamelToSnake(input)).toEqual(expected);
    });

    it('deve converter objeto aninhado', () => {
      const input = {
        usuarioDados: {
          nomeCompleto: 'João Silva',
          enderecoCompleto: {
            nomeRua: 'Rua A',
            numeroCasa: '123',
          },
        },
      };

      const expected = {
        usuario_dados: {
          nome_completo: 'João Silva',
          endereco_completo: {
            nome_rua: 'Rua A',
            numero_casa: '123',
          },
        },
      };

      expect(fromCamelToSnake(input)).toEqual(expected);
    });

    it('deve converter arrays de objetos', () => {
      const input = {
        listaUsuarios: [
          { nomeCompleto: 'João', idadeAnos: 30 },
          { nomeCompleto: 'Maria', idadeAnos: 25 },
        ],
      };

      const expected = {
        lista_usuarios: [
          { nome_completo: 'João', idade_anos: 30 },
          { nome_completo: 'Maria', idade_anos: 25 },
        ],
      };

      expect(fromCamelToSnake(input)).toEqual(expected);
    });

    it('deve manter valores primitivos inalterados', () => {
      expect(fromCamelToSnake(null)).toBeNull();
      expect(fromCamelToSnake(undefined)).toBeUndefined();
      expect(fromCamelToSnake(123)).toBe(123);
      expect(fromCamelToSnake('string')).toBe('string');
      expect(fromCamelToSnake(true)).toBe(true);
    });

    it('deve manter arrays de primitivos inalterados', () => {
      expect(fromCamelToSnake([1, 2, 3])).toEqual([1, 2, 3]);
      expect(fromCamelToSnake(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('deve lidar com objeto vazio', () => {
      expect(fromCamelToSnake({})).toEqual({});
    });

    it('deve lidar com array vazio', () => {
      expect(fromCamelToSnake([])).toEqual([]);
    });
  });

  describe('generateAvatarFallback', () => {
    it('Property: sempre retorna 1-2 caracteres maiúsculos ou "??"', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (name) => {
            const result = generateAvatarFallback(name);
            // Retorna 1-2 caracteres dependendo do input
            // Nome com 1 letra -> 1 char, nomes maiores -> até 2 chars
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result.length).toBeLessThanOrEqual(2);
            expect(result).toMatch(/^[\p{L}\p{N}?]{1,2}$/u);
          }
        ),
        { numRuns: 500 }
      );
    });

    it('deve retornar "??" para null', () => {
      expect(generateAvatarFallback(null)).toBe('??');
    });

    it('deve retornar "??" para undefined', () => {
      expect(generateAvatarFallback(undefined)).toBe('??');
    });

    it('deve retornar "??" para string vazia', () => {
      expect(generateAvatarFallback('')).toBe('??');
    });

    it('deve retornar "??" para string apenas com espaços', () => {
      expect(generateAvatarFallback('   ')).toBe('??');
    });

    it('deve gerar iniciais de nome completo', () => {
      expect(generateAvatarFallback('João Silva')).toBe('JS');
      expect(generateAvatarFallback('Maria Santos Oliveira')).toBe('MS');
      expect(generateAvatarFallback('Pedro Henrique Costa')).toBe('PH');
    });

    it('deve gerar iniciais de nome único', () => {
      expect(generateAvatarFallback('João')).toBe('JO');
      expect(generateAvatarFallback('Maria')).toBe('MA');
      expect(generateAvatarFallback('X')).toBe('X');
    });

    it('deve lidar com múltiplos espaços', () => {
      expect(generateAvatarFallback('João    Silva')).toBe('JS');
      expect(generateAvatarFallback('  João   Silva  ')).toBe('JS');
    });

    it('deve converter para maiúsculas', () => {
      expect(generateAvatarFallback('joão silva')).toBe('JS');
      expect(generateAvatarFallback('maria santos')).toBe('MS');
    });

    it('deve pegar apenas as 2 primeiras iniciais', () => {
      expect(generateAvatarFallback('Ana Beatriz Carolina Daniela')).toBe('AB');
    });

    it('deve lidar com nomes com caracteres especiais', () => {
      expect(generateAvatarFallback('José André')).toBe('JA');
      expect(generateAvatarFallback('María José')).toBe('MJ');
    });

    it('deve lidar com nomes com números', () => {
      expect(generateAvatarFallback('Usuario 123')).toBe('U1');
    });
  });

  describe('Edge Cases - Casos Extremos', () => {
    describe('fromSnakeToCamel e fromCamelToSnake', () => {
      it('deve lidar com objetos profundamente aninhados', () => {
        const deepObject = {
          nivel_1: {
            nivel_2: {
              nivel_3: {
                nivel_4: {
                  valor_final: 'teste',
                },
              },
            },
          },
        };

        const camel = fromSnakeToCamel(deepObject);
        const snake = fromCamelToSnake(camel);
        expect(snake).toEqual(deepObject);
      });

      it('deve lidar com arrays aninhados', () => {
        const input = {
          lista_items: [
            {
              sub_lista: [
                { nome_item: 'Item 1' },
                { nome_item: 'Item 2' },
              ],
            },
          ],
        };

        const camel = fromSnakeToCamel(input);
        const snake = fromCamelToSnake(camel);
        expect(snake).toEqual(input);
      });

      it('deve lidar com valores especiais', () => {
        const input = {
          valor_null: null,
          valor_undefined: undefined,
          valor_zero: 0,
          valor_false: false,
          valor_empty_string: '',
          valor_empty_array: [],
          valor_empty_object: {},
        };

        const camel = fromSnakeToCamel(input);
        expect(camel).toEqual({
          valorNull: null,
          valorUndefined: undefined,
          valorZero: 0,
          valorFalse: false,
          valorEmptyString: '',
          valorEmptyArray: [],
          valorEmptyObject: {},
        });
      });

      it('deve lidar com datas', () => {
        const date = new Date('2024-01-15');
        const input = {
          data_criacao: date,
        };

        const camel = fromSnakeToCamel(input);
        expect(camel).toEqual({
          dataCriacao: date,
        });
      });
    });

    describe('camelToSnakeKey', () => {
      it('deve lidar com string começando com maiúscula', () => {
        expect(camelToSnakeKey('NomeCompleto')).toBe('_nome_completo');
      });

      it('deve lidar com maiúsculas únicas', () => {
        expect(camelToSnakeKey('a')).toBe('a');
        expect(camelToSnakeKey('A')).toBe('_a');
      });
    });

    describe('generateAvatarFallback', () => {
      it('deve lidar com nomes muito longos', () => {
        const longName = 'A'.repeat(1000);
        const result = generateAvatarFallback(longName);
        expect(result).toHaveLength(2);
      });

      it('deve lidar com caracteres Unicode', () => {
        expect(generateAvatarFallback('João José')).toBe('JJ');
        expect(generateAvatarFallback('Владимир Путин')).toBe('ВП');
        expect(generateAvatarFallback('张三 李四')).toBe('张李');
      });

      it('deve lidar com emojis', () => {
        const result = generateAvatarFallback('😀 Test');
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('Integração - Casos Reais', () => {
    it('deve converter payload do Supabase para camelCase', () => {
      const supabasePayload = {
        id: 1,
        nome_completo: 'João Silva',
        email_corporativo: 'joao@example.com',
        data_nascimento: '1990-01-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      const result = fromSnakeToCamel(supabasePayload);

      expect(result).toEqual({
        id: 1,
        nomeCompleto: 'João Silva',
        emailCorporativo: 'joao@example.com',
        dataNascimento: '1990-01-01',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
      });

      // Deve gerar avatar correto
      expect(generateAvatarFallback(result.nomeCompleto)).toBe('JS');
    });

    it('deve converter payload para insert no Supabase', () => {
      const formData = {
        nomeCompleto: 'Maria Santos',
        emailCorporativo: 'maria@example.com',
        dataNascimento: '1995-05-15',
      };

      const result = fromCamelToSnake(formData);

      expect(result).toEqual({
        nome_completo: 'Maria Santos',
        email_corporativo: 'maria@example.com',
        data_nascimento: '1995-05-15',
      });
    });

    it('deve converter processo completo com relações', () => {
      const processo = {
        id_processo: 1,
        numero_processo: '0001234-56.2024.8.26.0100',
        valor_causa: 50000.00,
        data_distribuicao: '2024-01-15',
        cliente_dados: {
          nome_completo: 'João Silva',
          cpf_cliente: '12345678901',
        },
        documentos_lista: [
          { nome_arquivo: 'peticao.pdf', data_upload: '2024-01-15' },
          { nome_arquivo: 'procuracao.pdf', data_upload: '2024-01-16' },
        ],
      };

      const camel = fromSnakeToCamel(processo);

      expect(camel).toEqual({
        idProcesso: 1,
        numeroProcesso: '0001234-56.2024.8.26.0100',
        valorCausa: 50000.00,
        dataDistribuicao: '2024-01-15',
        clienteDados: {
          nomeCompleto: 'João Silva',
          cpfCliente: '12345678901',
        },
        documentosLista: [
          { nomeArquivo: 'peticao.pdf', dataUpload: '2024-01-15' },
          { nomeArquivo: 'procuracao.pdf', dataUpload: '2024-01-16' },
        ],
      });

      // Conversão reversa deve retornar ao original
      expect(fromCamelToSnake(camel)).toEqual(processo);
    });

    it('deve lidar com classes CSS complexas', () => {
      const buttonClasses = cn(
        'btn',
        'px-4 py-2',
        'bg-blue-500 hover:bg-blue-600',
        'text-white font-bold',
        'rounded-lg shadow-md',
        false && 'disabled:opacity-50',
        true && 'transition-colors'
      );

      expect(buttonClasses).toContain('btn');
      expect(buttonClasses).toContain('px-4');
      expect(buttonClasses).toContain('bg-blue-500');
      expect(buttonClasses).toContain('transition-colors');
      expect(buttonClasses).not.toContain('disabled:opacity-50');
    });
  });
});
