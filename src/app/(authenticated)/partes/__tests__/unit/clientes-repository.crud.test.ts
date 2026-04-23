/**
 * Testes CRUD do clientes-repository — mutações, upserts, agregações e joins.
 *
 * Complementar a `clientes-repository.test.ts` (contrato snake_case + regressão).
 * Cobre funções não testadas na suíte principal:
 *   - saveCliente / updateCliente
 *   - upsertClienteByCPF / upsertClienteByCNPJ
 *   - countClientesByEstado
 *   - findAllClientesComEndereco / findAllClientesComEnderecoEProcessos
 *   - findClienteComEndereco
 *
 * Origem: testes resgatados de `archive/stash-wip-master-31783bce3` (cherry-pick
 * skipado em 2026-04-22), adaptados para o setup atual (tipagem estrita + mocks
 * de Redis).
 */
import { createDbClient } from '@/lib/supabase';
import {
  saveCliente,
  updateCliente,
  upsertClienteByCPF,
  upsertClienteByCNPJ,
  countClientesByEstado,
  findAllClientesComEndereco,
  findAllClientesComEnderecoEProcessos,
  findClienteComEndereco,
} from '../../repositories/clientes-repository';
import {
  criarClientePFMock,
  criarClientePJMock,
  criarClienteDbMock,
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

describe('clientes-repository — CRUD + joins', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('saveCliente', () => {
    it('deve inserir cliente PF com todos os campos', async () => {
      const cliente = criarClientePFMock();
      const dbData = criarClienteDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveCliente(cliente);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve inserir cliente PJ com campos PJ-específicos', async () => {
      const cliente = criarClientePJMock();
      const dbData = criarClienteDbMock({
        tipo_pessoa: 'pj',
        nome: 'Empresa XYZ Ltda',
        nome_social_fantasia: 'XYZ Soluções',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      await saveCliente(cliente);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('cnpj');
      expect(insertCall).toHaveProperty('tipo_pessoa', 'pj');
      expect(insertCall).not.toHaveProperty('cpf');
    });

    it('deve aplicar valores padrão (ativo=true quando não informado)', async () => {
      const cliente = criarClientePFMock({
        ativo: undefined as unknown as boolean,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await saveCliente(cliente);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('ativo', true);
    });

    it('deve falhar para CPF duplicado (constraint violation 23505)', async () => {
      const cliente = criarClientePFMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveCliente(cliente);

      expect(result.success).toBe(false);
    });

    it('deve retornar erro para CNPJ duplicado', async () => {
      const cliente = criarClientePJMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveCliente(cliente);

      expect(result.success).toBe(false);
    });
  });

  describe('updateCliente', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      };

      const dbData = criarClienteDbMock({
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateCliente(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve preservar campos não fornecidos', async () => {
      const updates = { email: 'novo.email@example.com' };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await updateCliente(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(Object.keys(updateCall).length).toBeGreaterThan(0);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        nomeCompleto: 'João Silva Santos Junior',
        dataNascimento: '1980-05-15',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarClienteDbMock(),
        error: null,
      });

      await updateCliente(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_completo');
      expect(updateCall).toHaveProperty('data_nascimento');
    });
  });

  describe('upsertClienteByCPF', () => {
    it('deve criar se não existe (created=true)', async () => {
      const cliente = criarClientePFMock();
      const dbData = criarClienteDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertClienteByCPF(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe (created=false)', async () => {
      const cliente = criarClientePFMock();
      const existingData = criarClienteDbMock({ id: 5 });
      const updatedData = criarClienteDbMock({ id: 5, email: cliente.email });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertClienteByCPF(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('upsertClienteByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const cliente = criarClientePJMock();
      const dbData = criarClienteDbMock({ tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertClienteByCNPJ(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const cliente = criarClientePJMock();
      const existingData = criarClienteDbMock({ id: 5, tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: existingData, error: null });

      const result = await upsertClienteByCNPJ(cliente);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('countClientesByEstado', () => {
    it('deve agrupar por UF', async () => {
      const dbData = [
        { uf: 'SP', count: 25 },
        { uf: 'RJ', count: 10 },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: dbData, error: null });

      const result = await countClientesByEstado();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toHaveProperty('uf', 'SP');
        expect(result.data[0]).toHaveProperty('count', 25);
      }
    });
  });

  describe('findAllClientesComEndereco', () => {
    it('deve fazer join com tabela enderecos', async () => {
      const dbData = [
        {
          ...criarClienteDbMock(),
          enderecos: [criarEnderecoDbMock()],
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({
        data: dbData,
        error: null,
        count: dbData.length,
      });

      const result = await findAllClientesComEndereco();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(result.success).toBe(true);
    });
  });

  describe('findAllClientesComEnderecoEProcessos', () => {
    it('deve fazer join com enderecos e processo_partes', async () => {
      const clienteRow = {
        ...criarClienteDbMock({ id: 1 }),
        enderecos: [criarEnderecoDbMock()],
      };

      const mockClientesQB = createMockQueryBuilder();
      const mockProcessoPartesQB = createMockQueryBuilder();

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'clientes') return mockClientesQB;
        if (table === 'processo_partes') return mockProcessoPartesQB;
        return mockQueryBuilder;
      });

      mockClientesQB.range.mockResolvedValue({
        data: [clienteRow],
        error: null,
        count: 1,
      });
      mockProcessoPartesQB.range.mockResolvedValue({
        data: [
          {
            processo_id: 100,
            numero_processo: '0000000-00.0000.0.00.0000',
            tipo_parte: 'autor',
            polo: 'ativo',
            entidade_id: 1,
          },
        ],
        error: null,
        count: 1,
      });

      const result = await findAllClientesComEnderecoEProcessos();

      expect(result.success).toBe(true);
    });
  });

  describe('findClienteComEndereco', () => {
    it('deve buscar cliente único com endereço', async () => {
      const dbData = {
        ...criarClienteDbMock(),
        enderecos: [criarEnderecoDbMock()],
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findClienteComEndereco(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('clientes');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('enderecos');
      }
    });
  });
});
