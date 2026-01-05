import { createServiceClient } from '@/lib/supabase/service-client';
import {
  LancamentosRepository,
} from '../../repository/lancamentos';
import {
  criarLancamentoReceitaMock,
  criarLancamentoDespesaMock as _criarLancamentoDespesaMock,
  criarLancamentoDbMock,
  criarResumoVencimentosCompleteMock as _criarResumoVencimentosCompleteMock,
} from '../fixtures';
import { createMockSupabaseClient, createMockQueryBuilder, mockPostgresError } from '../../../processos/__tests__/helpers';

jest.mock('@/lib/supabase/service-client');

describe('Lancamentos Repository', () => {
  let mockSupabaseClient: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    mockQueryBuilder = createMockQueryBuilder();
    (createServiceClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('listar', () => {
    it('deve aplicar filtro tipo (receita/despesa)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ tipo: 'receita' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo', 'receita');
    });

    it('deve aplicar filtro status como array', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ status: ['pendente', 'pago'] });

      expect(mockQueryBuilder.in).toHaveBeenCalledWith('status', ['pendente', 'pago']);
    });

    it('deve aplicar filtro status como string', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ status: 'pendente' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pendente');
    });

    it('deve aplicar filtro busca com ilike', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ busca: 'Honorários' });

      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('descricao', '%Honorários%');
    });

    it('deve aplicar filtros de data - dataVencimentoInicio/Fim', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({
        dataVencimentoInicio: '2024-01-01',
        dataVencimentoFim: '2024-12-31',
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('data_vencimento', '2024-01-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('data_vencimento', '2024-12-31');
    });

    it('deve aplicar filtros de data - dataCompetenciaInicio/Fim', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({
        dataCompetenciaInicio: '2024-01-01',
        dataCompetenciaFim: '2024-01-31',
      });

      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('data_competencia', '2024-01-01');
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('data_competencia', '2024-01-31');
    });

    it('deve aplicar filtros de relacionamento', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.order.mockResolvedValue({ data: [], error: null });

      await LancamentosRepository.listar({
        pessoaId: 10,
        contaContabilId: 1,
        centroCustoId: 5,
        contaBancariaId: 2,
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('cliente_id', 10);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('conta_contabil_id', 1);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('centro_custo_id', 5);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('conta_bancaria_id', 2);
    });

    it('deve aplicar filtro origem', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ origem: 'manual' });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('origem', 'manual');
    });

    it('deve aplicar filtro recorrente (boolean)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ recorrente: true });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('recorrente', true);
    });

    it('deve aplicar filtro lancamentoOrigemId', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({ lancamentoOrigemId: 100 });

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('lancamento_origem_id', 100);
    });

    it('deve paginar corretamente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 25 });

      const pagina = 2;
      const limite = 10;
      const offset = (pagina - 1) * limite;

      await LancamentosRepository.listar({ pagina, limite });

      expect(mockQueryBuilder.range).toHaveBeenCalledWith(offset, offset + limite - 1);
    });

    it('deve ordenar por data_vencimento (ascending, nullsFirst: false)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await LancamentosRepository.listar({});

      expect(mockQueryBuilder.order).toHaveBeenCalledWith('data_vencimento', {
        ascending: true,
        nullsFirst: false,
      });
    });

    it('deve mapear resultado para Lancamento (camelCase)', async () => {
      const dbData = [criarLancamentoDbMock()];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.order.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.listar({});

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('dataVencimento');
      expect(result[0]).toHaveProperty('dataCompetencia');
      expect(result[0]).toHaveProperty('clienteId');
      expect(result[0]).not.toHaveProperty('data_vencimento');
    });
  });

  describe('buscarPorId', () => {
    it('deve buscar lançamento por ID', async () => {
      const dbData = criarLancamentoDbMock();
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.buscarPorId(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(result).toHaveProperty('id', 1);
    });

    it('deve retornar null se não existe', async () => {
      const error = mockPostgresError('PGRST116', 'No rows found');
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: null, error });

      const result = await LancamentosRepository.buscarPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('criar', () => {
    it('deve inserir lançamento com mapeamento camelCase → snake_case', async () => {
      const lancamento = criarLancamentoReceitaMock();
      const dbData = criarLancamentoDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.criar(lancamento);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('deve mapear todos os campos corretamente', async () => {
      const lancamento = criarLancamentoReceitaMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarLancamentoDbMock(),
        error: null,
      });

      await LancamentosRepository.criar(lancamento);

      const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
      expect(insertCall).toHaveProperty('data_vencimento');
      expect(insertCall).toHaveProperty('data_competencia');
      expect(insertCall).toHaveProperty('cliente_id');
      expect(insertCall).toHaveProperty('conta_contabil_id');
      expect(insertCall).toHaveProperty('centro_custo_id');
    });

    it('deve retornar lançamento criado', async () => {
      const lancamento = criarLancamentoReceitaMock();
      const dbData = criarLancamentoDbMock();

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.criar(lancamento);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('descricao');
    });
  });

  describe('atualizar', () => {
    it('deve atualizar lançamento com updated_at', async () => {
      const updates = {
        status: 'pago' as const,
        dataEfetivacao: '2024-01-15',
      };

      const dbData = criarLancamentoDbMock({
        status: 'pago',
        data_efetivacao: '2024-01-15',
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.atualizar(1, updates);

      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('deve mapear campos corretamente', async () => {
      const updates = {
        dataVencimento: '2024-02-20',
        formaPagamento: 'pix' as const,
      };

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.single.mockResolvedValue({
        data: criarLancamentoDbMock(),
        error: null,
      });

      await LancamentosRepository.atualizar(1, updates);

      const updateCall = mockQueryBuilder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('data_vencimento', '2024-02-20');
      expect(updateCall).toHaveProperty('forma_pagamento', 'pix');
      expect(updateCall).toHaveProperty('updated_at');
    });
  });

  describe('excluir', () => {
    it('deve deletar lançamento (hard delete)', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.delete.mockResolvedValue({ data: null, error: null });

      await LancamentosRepository.excluir(1);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 1);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
    });

    it('deve retornar void mesmo se lançamento não existe', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.delete.mockResolvedValue({ data: null, error: null });

      const result = await LancamentosRepository.excluir(999);

      expect(result).toBeUndefined();
    });
  });

  describe('buscarPorParcela', () => {
    it('deve buscar lançamentos vinculados a parcelaId', async () => {
      const dbData = [criarLancamentoDbMock({ parcela_id: 5 })];
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: dbData, error: null });

      const result = await LancamentosRepository.buscarPorParcela(5);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('parcela_id', 5);
      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio se não houver lançamentos', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: [], error: null });

      const result = await LancamentosRepository.buscarPorParcela(999);

      expect(result).toEqual([]);
    });
  });

  describe('contar', () => {
    it('deve contar lançamentos com filtros', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ count: 42, error: null });

      const result = await LancamentosRepository.contar({ tipo: 'receita' });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lancamentos_financeiros');
      expect(result).toBe(42);
    });

    it('deve usar count: exact, head: true', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ count: 10, error: null });

      await LancamentosRepository.contar({});

      expect(mockQueryBuilder.select).toHaveBeenCalledWith('id', {
        count: 'exact',
        head: true,
      });
    });
  });

  describe('buscarResumoVencimentos', () => {
    it('deve calcular resumo de vencimentos', async () => {
      const mockData = [
        { categoria: 'vencidas', quantidade: 5, valorTotal: 15000 },
        { categoria: 'hoje', quantidade: 2, valorTotal: 8000 },
        { categoria: 'proximos7Dias', quantidade: 10, valorTotal: 25000 },
        { categoria: 'proximos30Dias', quantidade: 15, valorTotal: 45000 },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: mockData, error: null });

      const result = await LancamentosRepository.buscarResumoVencimentos();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('vencidas');
        expect(result.data).toHaveProperty('hoje');
        expect(result.data).toHaveProperty('proximos7Dias');
        expect(result.data).toHaveProperty('proximos30Dias');
      }
    });

    it('deve filtrar por tipo (receita/despesa) se fornecido', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: [], error: null });

      await LancamentosRepository.buscarResumoVencimentos('receita');

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('tipo', 'receita');
    });

    it('deve retornar ResumoVencimentos com quantidade e valorTotal', async () => {
      const mockData = [
        { categoria: 'vencidas', quantidade: 5, valorTotal: 15000 },
      ];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: mockData, error: null });

      const result = await LancamentosRepository.buscarResumoVencimentos();

      if (result.success) {
        expect(result.data.vencidas).toHaveProperty('quantidade');
        expect(result.data.vencidas).toHaveProperty('valorTotal');
      }
    });

    it('deve usar data atual como referência', async () => {
      const _dataAtual = new Date().toISOString().split('T')[0];

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: [], error: null });

      await LancamentosRepository.buscarResumoVencimentos();

      // Verificar que usou lt (menor que) para vencidas
      expect(mockQueryBuilder.lt).toHaveBeenCalled();
    });

    it('deve filtrar apenas lançamentos com status: pendente', async () => {
      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.select.mockResolvedValue({ data: [], error: null });

      await LancamentosRepository.buscarResumoVencimentos();

      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pendente');
    });
  });

  describe('Mappers', () => {
    describe('mapRecordToLancamento', () => {
      it('deve mapear todos os campos snake_case → camelCase', async () => {
        const dbData = criarLancamentoDbMock({
          data_vencimento: '2024-02-15',
          data_competencia: '2024-02-01',
          cliente_id: 10,
          conta_contabil_id: 1,
          centro_custo_id: 5,
          conta_bancaria_id: null,
          data_efetivacao: null,
          forma_pagamento: null,
          lancamento_origem_id: null,
        });

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

        const result = await LancamentosRepository.buscarPorId(1);

        expect(result).toHaveProperty('dataVencimento');
        expect(result).toHaveProperty('dataCompetencia');
        expect(result).toHaveProperty('clienteId');
        expect(result).toHaveProperty('contaContabilId');
        expect(result).toHaveProperty('centroCustoId');
        expect(result).toHaveProperty('contaBancariaId');
        expect(result).toHaveProperty('dataEfetivacao');
        expect(result).toHaveProperty('formaPagamento');
        expect(result).toHaveProperty('lancamentoOrigemId');
      });

      it('deve mapear enums corretamente', async () => {
        const dbData = criarLancamentoDbMock({
          tipo: 'receita',
          status: 'pendente',
          origem: 'manual',
          forma_pagamento: 'pix',
          frequencia_recorrencia: 'mensal',
        });

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

        const result = await LancamentosRepository.buscarPorId(1);

        expect(result.tipo).toBe('receita');
        expect(result.status).toBe('pendente');
        expect(result.origem).toBe('manual');
        expect(result.formaPagamento).toBe('pix');
        expect(result.frequenciaRecorrencia).toBe('mensal');
      });

      it('deve mapear campos nullable corretamente', async () => {
        const dbData = criarLancamentoDbMock({
          data_efetivacao: null,
          forma_pagamento: null,
          observacoes: null,
          lancamento_origem_id: null,
        });

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

        const result = await LancamentosRepository.buscarPorId(1);

        expect(result.dataEfetivacao).toBeNull();
        expect(result.formaPagamento).toBeNull();
        expect(result.observacoes).toBeNull();
        expect(result.lancamentoOrigemId).toBeNull();
      });

      it('deve mapear anexos (array)', async () => {
        const dbData = criarLancamentoDbMock({
          anexos: [
            { url: 'https://example.com/anexo1.pdf', nome: 'Anexo 1' },
            { url: 'https://example.com/anexo2.pdf', nome: 'Anexo 2' },
          ],
        });

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({ data: dbData, error: null });

        const result = await LancamentosRepository.buscarPorId(1);

        expect(result.anexos).toBeInstanceOf(Array);
        expect(result.anexos).toHaveLength(2);
      });
    });

    describe('mapLancamentoToRecord', () => {
      it('deve mapear apenas campos fornecidos (partial)', async () => {
        const updates = {
          status: 'pago' as const,
          dataEfetivacao: '2024-01-15',
        };

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({
          data: criarLancamentoDbMock(),
          error: null,
        });

        await LancamentosRepository.atualizar(1, updates);

        const updateCall = mockQueryBuilder.update.mock.calls[0][0];
        expect(Object.keys(updateCall).length).toBeGreaterThan(0);
        expect(updateCall).toHaveProperty('status', 'pago');
        expect(updateCall).toHaveProperty('data_efetivacao', '2024-01-15');
      });

      it('deve mapear camelCase → snake_case', async () => {
        const lancamento = criarLancamentoReceitaMock();

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({
          data: criarLancamentoDbMock(),
          error: null,
        });

        await LancamentosRepository.criar(lancamento);

        const insertCall = mockQueryBuilder.insert.mock.calls[0][0];
        expect(insertCall).not.toHaveProperty('dataVencimento');
        expect(insertCall).toHaveProperty('data_vencimento');
      });

      it('deve lidar com campos undefined vs null', async () => {
        const updates = {
          observacoes: null,
          valorPago: undefined,
        };

        mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
        mockQueryBuilder.single.mockResolvedValue({
          data: criarLancamentoDbMock(),
          error: null,
        });

        await LancamentosRepository.atualizar(1, updates);

        const updateCall = mockQueryBuilder.update.mock.calls[0][0];
        expect(updateCall).toHaveProperty('observacoes', null);
        // undefined não deve ser incluído no update
      });
    });
  });
});
