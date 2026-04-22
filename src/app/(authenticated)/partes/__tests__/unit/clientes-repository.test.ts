/**
 * Testes do clientes-repository — contrato com o domain snake_case.
 *
 * Invariantes validados:
 * 1. Dados retornados do repositório usam EXATAMENTE os nomes do domain (snake_case).
 * 2. `tipo_pessoa` sempre em lowercase ('pf' | 'pj'), mesmo se o DB retornar uppercase.
 * 3. Discriminated union PF/PJ: campos exclusivos de um tipo não aparecem no outro.
 * 4. Filtros de listagem aceitam qualquer capitalização de tipo_pessoa via .in().
 */
import { createDbClient } from '@/lib/supabase';
import {
  findClienteById,
  findClienteByCPF,
  findClienteByCNPJ,
  findClientesByNomeParcial,
  findAllClientes,
  countClientes,
  countClientesByDateRange,
} from '../../repositories/clientes-repository';
import {
  criarClienteDbMock,
  criarClienteDbLegacyMock,
  criarEnderecoDbMock,
} from '../fixtures';
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  mockPostgresError,
} from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');
jest.mock('@/lib/redis/cache-utils', () => ({
  CACHE_PREFIXES: { clientes: 'partes:clientes' },
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
  deleteCached: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/redis/invalidation', () => ({
  invalidateClientesCache: jest.fn().mockResolvedValue(undefined),
}));

describe('clientes-repository', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findClienteById — contrato snake_case e discriminated union PF/PJ', () => {
    it('retorna cliente com tipo_pessoa em lowercase mesmo quando o DB tem UPPERCASE (legacy)', async () => {
      const dbData = criarClienteDbLegacyMock(); // tipo_pessoa: 'PF'
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pf');
      }
    });

    it('retorna cliente PF com todos os campos PF do domain em snake_case', async () => {
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'pf',
        cpf: '12345678900',
        rg: '12.345.678-9',
        data_nascimento: '1980-05-15',
        sexo: 'masculino',
        genero: 'masculino',
        estado_civil: 'casado',
        nacionalidade: 'Brasileira',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      expect(result.success).toBe(true);
      if (result.success && result.data && result.data.tipo_pessoa === 'pf') {
        expect(result.data.cpf).toBe('12345678900');
        expect(result.data.rg).toBe('12.345.678-9');
        expect(result.data.data_nascimento).toBe('1980-05-15');
        expect(result.data.sexo).toBe('masculino');
        expect(result.data.nacionalidade).toBe('Brasileira');
        expect(result.data.cnpj).toBeNull();
        // Não deve vazar formato camelCase do utilitário legado:
        expect(result.data).not.toHaveProperty('tipoPessoa');
        expect(result.data).not.toHaveProperty('dataNascimento');
        expect(result.data).not.toHaveProperty('dddCelular');
      }
    });

    it('retorna cliente PJ com campos específicos PJ e cpf=null', async () => {
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'pj',
        nome: 'Empresa XYZ Ltda',
        cpf: null,
        cnpj: '12345678000190',
        data_abertura: '2010-01-01',
        ramo_atividade: 'Tecnologia',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(2);

      expect(result.success).toBe(true);
      if (result.success && result.data && result.data.tipo_pessoa === 'pj') {
        expect(result.data.cnpj).toBe('12345678000190');
        expect(result.data.cpf).toBeNull();
        expect(result.data.data_abertura).toBe('2010-01-01');
        expect(result.data.ramo_atividade).toBe('Tecnologia');
      }
    });

    it('preserva telefone composto em ddd_celular + numero_celular (snake_case)', async () => {
      const dbData = criarClienteDbMock({
        ddd_celular: '11',
        numero_celular: '987654321',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      if (result.success && result.data) {
        expect(result.data.ddd_celular).toBe('11');
        expect(result.data.numero_celular).toBe('987654321');
      }
    });

    it('lança para tipo_pessoa inválido no DB', async () => {
      const dbData = criarClienteDbMock({ tipo_pessoa: 'invalido' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      expect(result.success).toBe(false);
    });

    it('retorna null quando cliente não existe (PGRST116)', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findClienteById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('retorna erro para falhas genéricas do DB', async () => {
      const error = mockPostgresError('42P01', 'Table does not exist');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findClienteById(1);

      expect(result.success).toBe(false);
    });
  });

  describe('findClienteByCPF', () => {
    it('filtra pelo CPF e retorna entidade em snake_case', async () => {
      const dbData = criarClienteDbMock({ cpf: '12345678900' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCPF('12345678900');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '12345678900');
      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pf');
        expect(result.data.cpf).toBe('12345678900');
      }
    });

    it('retorna null quando CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findClienteByCPF('99999999999');

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toBeNull();
    });
  });

  describe('findClienteByCNPJ', () => {
    it('filtra pelo CNPJ e normaliza tipo_pessoa legacy em UPPERCASE', async () => {
      const dbData = criarClienteDbLegacyMock({
        tipo_pessoa: 'PJ',
        nome: 'Empresa XYZ Ltda',
        cpf: null,
        cnpj: '12345678000190',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteByCNPJ('12345678000190');

      if (result.success && result.data) {
        expect(result.data.tipo_pessoa).toBe('pj');
        if (result.data.tipo_pessoa === 'pj') {
          expect(result.data.cnpj).toBe('12345678000190');
          expect(result.data.cpf).toBeNull();
        }
      }
    });
  });

  describe('findClientesByNomeParcial', () => {
    it('aplica ILIKE e ordena por nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.limit.mockResolvedValue({ data: [criarClienteDbMock()], error: null });

      await findClientesByNomeParcial('João');

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome', '%João%');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome');
    });

    it('respeita limite configurado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.limit.mockResolvedValue({ data: [], error: null });

      await findClientesByNomeParcial('João', 20);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });

    it('retorna lista vazia para nome em branco', async () => {
      const result = await findClientesByNomeParcial('   ');

      expect(result.success).toBe(true);
      if (result.success) expect(result.data).toEqual([]);
    });
  });

  describe('findAllClientes — filtros tolerantes a case', () => {
    it('aplica filtro de nome com ILIKE', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ nome: 'João' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome', '%João%');
    });

    it('filtro tipoPessoa aceita "PF" e matcha ambas as cases no DB (.in)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ tipoPessoa: 'PF' });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('tipo_pessoa', ['pf', 'PF']);
    });

    it('filtro tipoPessoa aceita "pj" lowercase e monta .in() defensivamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ tipoPessoa: 'pj' });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('tipo_pessoa', ['pj', 'PJ']);
    });

    it('aplica flag de ativo', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllClientes({ ativo: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('aplica paginação com offset + range', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      await findAllClientes({ pagina: 2, limite: 10 });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 19);
    });
  });

  describe('contagens', () => {
    it('countClientes retorna o total exato', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ count: 42, error: null });

      const result = await countClientes();

      if (result.success) expect(result.data).toBe(42);
    });

    it('countClientesByDateRange aplica filtros de data', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.lte.mockResolvedValue({ count: 15, error: null });

      const result = await countClientesByDateRange('2024-01-01', '2024-12-31');

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('created_at', '2024-12-31');
      expect(result.success).toBe(true);
    });
  });

  describe('regressão — bug #1: detalhe de cliente não carregava por quebra do contrato', () => {
    it('campos que o ProfileShell consome em snake_case existem e tipo_pessoa compara com "pf"', async () => {
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'PF', // legacy uppercase
        nome: 'Rai Da silva magno',
        sexo: 'masculino',
        nacionalidade: 'Brasileira',
        emails: ['raidasilvamagno@gmail.com'],
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteById(1);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // Contrato consumido por cliente-info-section.tsx:
        expect(result.data.tipo_pessoa === 'pf').toBe(true);
        expect(result.data.nome).toBe('Rai Da silva magno');
        if (result.data.tipo_pessoa === 'pf') {
          expect(result.data.sexo).toBe('masculino');
          expect(result.data.nacionalidade).toBe('Brasileira');
        }
        expect(result.data.emails).toEqual(['raidasilvamagno@gmail.com']);
      }
    });
  });
});
