/**
 * Testes do partes-contrarias-repository — contrato com o domain snake_case.
 *
 * Invariantes validados:
 * 1. Dados retornados do repositório usam EXATAMENTE os nomes do domain (snake_case).
 * 2. `tipo_pessoa` sempre em lowercase ('pf' | 'pj'), mesmo se o DB retornar uppercase.
 * 3. Discriminated union PF/PJ: campos exclusivos de um tipo não aparecem no outro.
 */
import { createDbClient } from '@/lib/supabase';
import {
  findParteContrariaByCPF,
  findParteContrariaByCNPJ,
  findParteContrariaById,
  findAllPartesContrarias,
} from '../../repositories/partes-contrarias-repository';
import {
  criarParteContrariaDbMock,
} from '../fixtures';
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  mockPostgresError,
} from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

describe('partes-contrarias-repository', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findParteContrariaById — contrato snake_case', () => {
    it('retorna parte contrária com tipo_pessoa normalizado para lowercase', async () => {
      const dbData = criarParteContrariaDbMock({ tipo_pessoa: 'PF' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pf');
        expect(result.data.nome).toBeDefined();
        expect(result.data).not.toHaveProperty('tipoPessoa');
        expect(result.data).not.toHaveProperty('nomeCompleto');
      }
    });

    it('retorna null quando parte contrária não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findParteContrariaById(999);

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });
  });

  describe('findParteContrariaByCPF', () => {
    it('filtra pelo CPF e retorna entidade PF snake_case', async () => {
      const dbData = criarParteContrariaDbMock({ cpf: '98765432100' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCPF('98765432100');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '98765432100');
      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pf');
        expect(result.data.cpf).toBe('98765432100');
      }
    });

    it('retorna null para CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findParteContrariaByCPF('99999999999');

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });
  });

  describe('findParteContrariaByCNPJ', () => {
    it('filtra pelo CNPJ e normaliza tipo_pessoa legacy PJ', async () => {
      const dbData = criarParteContrariaDbMock({
        tipo_pessoa: 'PJ',
        nome: 'Empresa ABC S/A',
        cpf: null,
        cnpj: '98765432000155',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findParteContrariaByCNPJ('98765432000155');

      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pj');
        if (result.data.tipo_pessoa === 'pj') {
          expect(result.data.cnpj).toBe('98765432000155');
          expect(result.data.cpf).toBeNull();
        }
      }
    });
  });

  describe('findAllPartesContrarias — filtros', () => {
    it('filtro tipoPessoa aceita "PJ" e matcha ambas cases via .in()', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ tipoPessoa: 'PJ' });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('tipo_pessoa', ['PJ', 'pj']);
    });

    it('busca geral aplica .or() com ilike em múltiplos campos', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ busca: 'Empresa ABC' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('pagina corretamente com offset e range', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      await findAllPartesContrarias({ pagina: 2, limite: 10 });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19);
    });
  });
});
