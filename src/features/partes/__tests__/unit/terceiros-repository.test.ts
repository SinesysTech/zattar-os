// @ts-nocheck
import { createDbClient } from '@/lib/supabase';
import {
  findTerceiroById,
  findTerceiroByCPF,
  findTerceiroByCNPJ,
  saveTerceiro,
  updateTerceiro,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
  findAllTerceiros,
} from '../../repositories/terceiros-repository';
import {
  criarTerceiroPFMock,
  criarTerceiroPJMock,
  criarTerceiroDbMock,
} from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase');

describe('Terceiros Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createDbClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('findTerceiroById', () => {
    it('deve buscar terceiro por ID', async () => {
      const dbData = criarTerceiroDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroById(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('nomeCompleto');
        expect(result.data.id).toBe(1);
      }
    });

    it('deve retornar null se não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await findTerceiroById(999);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findTerceiroByCPF', () => {
    it('deve buscar por CPF', async () => {
      const dbData = criarTerceiroDbMock({ cpf: '111.222.333-44' });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCPF('111.222.333-44');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cpf', '111.222.333-44');
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.cpf).toBe('111.222.333-44');
      }
    });

    it('deve validar mapeamento camelCase', async () => {
      const dbData = criarTerceiroDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCPF('111.222.333-44');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('nomeCompleto');
        expect(result.data).toHaveProperty('tipoPessoa');
        expect(result.data).not.toHaveProperty('nome_completo');
      }
    });

    it('deve retornar null para CPF não encontrado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await findTerceiroByCPF('999.999.999-99');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('findTerceiroByCNPJ', () => {
    it('deve buscar por CNPJ', async () => {
      const dbData = criarTerceiroDbMock({
        tipo_pessoa: 'PJ',
        cnpj: '22.333.444/0001-55',
        razao_social: 'Escritório de Advocacia Silva & Santos',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCNPJ('22.333.444/0001-55');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cnpj', '22.333.444/0001-55');
      expect(result.success).toBe(true);
    });

    it('deve validar mapeamento de campos PJ', async () => {
      const dbData = criarTerceiroDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
      });
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValue({ data: dbData, error: null });

      const result = await findTerceiroByCNPJ('22.333.444/0001-55');

      if (result.success && result.data) {
        expect(result.data).toHaveProperty('razaoSocial');
        expect(result.data).toHaveProperty('nomeFantasia');
      }
    });
  });

  describe('saveTerceiro', () => {
    it('deve criar terceiro PF', async () => {
      const terceiro = criarTerceiroPFMock();
      const dbData = criarTerceiroDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveTerceiro(terceiro);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('terceiros');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve criar terceiro sem documento', async () => {
      const terceiro = criarTerceiroPFMock({
        cpf: null,
        cnpj: null,
      });
      const dbData = criarTerceiroDbMock({ cpf: null, cnpj: null });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveTerceiro(terceiro);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.cpf).toBeNull();
        expect(result.data.cnpj).toBeNull();
      }
    });

    it('deve criar terceiro PJ com campos específicos', async () => {
      const terceiro = criarTerceiroPJMock();
      const dbData = criarTerceiroDbMock({
        tipo_pessoa: 'PJ',
        razao_social: 'Escritório de Advocacia Silva & Santos',
        nome_fantasia: 'Silva & Santos Advogados',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await saveTerceiro(terceiro);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('razao_social');
      expect(insertCall).toHaveProperty('nome_fantasia');
    });

    it('deve mapear camelCase → snake_case', async () => {
      const terceiro = criarTerceiroPFMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarTerceiroDbMock(),
        error: null,
      });

      await saveTerceiro(terceiro);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('nome_completo');
      expect(insertCall).toHaveProperty('tipo_pessoa');
    });
  });

  describe('updateTerceiro', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updates = {
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      };

      const dbData = criarTerceiroDbMock({
        email: 'novo.email@example.com',
        telefone: '(11) 99999-8888',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await updateTerceiro(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve mapear camelCase → snake_case', async () => {
      const updates = {
        nomeCompleto: 'Pedro Costa Silva',
        observacoes: 'Nova observação',
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarTerceiroDbMock(),
        error: null,
      });

      await updateTerceiro(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('nome_completo');
      expect(updateCall).toHaveProperty('observacoes');
    });
  });

  describe('upsertTerceiroByCPF', () => {
    it('deve criar se não existe', async () => {
      const terceiro = criarTerceiroPFMock();
      const dbData = criarTerceiroDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertTerceiroByCPF(terceiro);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const terceiro = criarTerceiroPFMock();
      const existingData = criarTerceiroDbMock({ id: 5 });
      const updatedData = criarTerceiroDbMock({ id: 5, email: terceiro.email });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: updatedData, error: null });

      const result = await upsertTerceiroByCPF(terceiro);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('upsertTerceiroByCNPJ', () => {
    it('deve criar se não existe', async () => {
      const terceiro = criarTerceiroPJMock();
      const dbData = criarTerceiroDbMock({ tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await upsertTerceiroByCNPJ(terceiro);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(true);
      }
    });

    it('deve atualizar se existe', async () => {
      const terceiro = criarTerceiroPJMock();
      const existingData = criarTerceiroDbMock({ id: 5, tipo_pessoa: 'PJ' });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: existingData,
        error: null,
      });
      mockQueryBuilder.single.mockResolvedValue({ data: existingData, error: null });

      const result = await upsertTerceiroByCNPJ(terceiro);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.created).toBe(false);
      }
    });
  });

  describe('findAllTerceiros', () => {
    it('deve aplicar filtro de nome', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ nome: 'Pedro' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('nome_completo', '%Pedro%');
    });

    it('deve aplicar filtro de CPF/CNPJ', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ cpfCnpj: '111.222.333-44' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve aplicar filtro de tipoPessoa', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ tipoPessoa: 'PF' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo_pessoa', 'PF');
    });

    it('deve aplicar busca geral', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({ busca: 'Silva Santos' });

      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('deve ordenar por campo especificado', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await findAllTerceiros({
        ordenarPor: 'nomeCompleto',
        ordem: 'asc',
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('nome_completo', {
        ascending: true,
      });
    });

    it('deve paginar corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await findAllTerceiros({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve retornar contagem total', async () => {
      const dbData = [criarTerceiroDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: dbData, error: null, count: 1 });

      const result = await findAllTerceiros({});

      if (result.success) {
        expect(result.total).toBe(1);
      }
    });
  });
});
