/**
 * Testes CRUD do partes-contrarias-repository — mutações e upserts.
 *
 * Complementar a `partes-contrarias-repository.test.ts` (contrato snake_case +
 * filtros de listagem). Cobre funções não testadas na suíte principal:
 *   - saveParteContraria / updateParteContraria
 *   - upsertParteContrariaByCPF / upsertParteContrariaByCNPJ
 *   - findAllPartesContrarias (filtros + paginação)
 *
 * Origem: testes resgatados de `archive/stash-wip-master-31783bce3` (cherry-pick
 * skipado em 2026-04-22), adaptados para o setup atual (tipagem estrita).
 */
import { createDbClient } from '@/lib/supabase';
import {
  saveParteContraria,
  updateParteContraria,
  upsertParteContrariaByCPF,
  upsertParteContrariaByCNPJ,
  findAllPartesContrarias,
} from '../../repositories/partes-contrarias-repository';
import {
  criarParteContrariaPFMock,
  criarParteContrariaPJMock,
  criarParteContrariaDbMock,
} from '../fixtures';
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
  mockPostgresError,
} from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

describe('partes-contrarias-repository — CRUD + filtros', () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('saveParteContraria', () => {
    it('deve inserir parte contrária PF', async () => {
      const parte = criarParteContrariaPFMock();
      const dbData = criarParteContrariaDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveParteContraria(parte);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('partes_contrarias');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve inserir parte contrária PJ com campos PJ-específicos', async () => {
      const parte = criarParteContrariaPJMock();
      const dbData = criarParteContrariaDbMock({
        tipo_pessoa: 'pj',
        nome: 'Empresa ABC S/A',
        nome_social_fantasia: 'ABC Corp',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      await saveParteContraria(parte);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('cnpj');
      expect(insertCall).toHaveProperty('tipo_pessoa', 'pj');
      expect(insertCall).not.toHaveProperty('cpf');
    });

    it('deve falhar para CPF duplicado (constraint violation)', async () => {
      const parte = criarParteContrariaPFMock();
      const error = mockPostgresError('23505', 'Unique constraint violation');

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await saveParteContraria(parte);

      expect(result.success).toBe(false);
    });

    it('deve mapear para snake_case no insert', async () => {
      const parte = criarParteContrariaPFMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarParteContrariaDbMock(),
        error: null,
      });

      await saveParteContraria(parte);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome');
      expect(insertCall).toHaveProperty('tipo_pessoa');
    });
  });

  describe('updateParteContraria', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        email: 'novo.email@example.com',
        telefone: '(21) 99999-8888',
      };

      const dbData = criarParteContrariaDbMock({
        email: 'novo.email@example.com',
        telefone: '(21) 99999-8888',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateParteContraria(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve mapear camelCase → snake_case no update', async () => {
      const updates = {
        nomeCompleto: 'Maria Oliveira Silva',
        observacoes: 'Atualização de dados',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarParteContrariaDbMock(),
        error: null,
      });

      await updateParteContraria(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_completo');
      expect(updateCall).toHaveProperty('observacoes');
    });
  });

  describe('findAllPartesContrarias — filtros e paginação', () => {
    it('deve aplicar filtro de nome via ilike', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ nome: 'Maria' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome_completo', '%Maria%');
    });

    it('deve aplicar filtro de CPF/CNPJ via .or()', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ cpfCnpj: '987.654.321-00' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve aplicar busca geral via .or()', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({ busca: 'Empresa ABC' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado mapeado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllPartesContrarias({
        ordenarPor: 'nomeCompleto',
        ordem: 'asc',
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome_completo', {
        ascending: true,
      });
    });

    it('deve paginar corretamente via range', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await findAllPartesContrarias({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar contagem total', async () => {
      const dbData = [criarParteContrariaDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllPartesContrarias({});

      if (result.success) {
        expect(result.total).toBe(1);
      }
    });
  });

  describe('upsertParteContrariaByCPF', () => {
    it('deve criar se não existe (created=true)', async () => {
      const parte = criarParteContrariaPFMock();
      const dbData = criarParteContrariaDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertParteContrariaByCPF(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe (created=false)', async () => {
      const parte = criarParteContrariaPFMock();
      const existingData = criarParteContrariaDbMock({ id: 5 });
      const updatedData = criarParteContrariaDbMock({ id: 5, email: parte.email });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertParteContrariaByCPF(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('upsertParteContrariaByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const parte = criarParteContrariaPJMock();
      const dbData = criarParteContrariaDbMock({ tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertParteContrariaByCNPJ(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const parte = criarParteContrariaPJMock();
      const existingData = criarParteContrariaDbMock({ id: 5, tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: existingData, error: null });

      const result = await upsertParteContrariaByCNPJ(parte);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });
});
