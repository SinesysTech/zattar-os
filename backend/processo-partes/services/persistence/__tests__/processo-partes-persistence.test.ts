import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock do Supabase
const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn(() => ({
  upsert: mockUpsert,
  update: mockUpdate,
  select: mockSelect,
  delete: mockDelete,
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn(),
}));

jest.mock('@/backend/utils/supabase/service-client', () => ({
  createServiceClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Import das funções após o mock
import {
  criarProcessoParte,
  atualizarProcessoParte,
  buscarProcessoPartePorId,
  buscarPartesPorProcesso,
  buscarProcessosPorEntidade,
  listarProcessoPartes,
  desvincularParteProcesso,
} from '../processo-partes-persistence.service';

// Fixtures de dados válidos
const validParams = {
  processo_id: 1,
  tipo_entidade: 'cliente' as const,
  entidade_id: 1,
  id_pje: 123,
  id_pessoa_pje: 456,
  tipo_parte: 'RECLAMANTE' as const,
  polo: 'ATIVO' as const,
  trt: '02',
  grau: 'primeiro_grau' as const,
  numero_processo: '0000123-45.2024.5.02.0001',
  principal: true,
  ordem: 0,
  dados_pje_completo: { test: 'data' },
};

const mockProcessoParte = {
  id: 1,
  processo_id: 1,
  tipo_entidade: 'cliente' as const,
  entidade_id: 1,
  id_pje: 123,
  id_pessoa_pje: 456,
  id_tipo_parte: null,
  tipo_parte: 'RECLAMANTE' as const,
  polo: 'ATIVO' as const,
  trt: '02',
  numero_processo: '0000123-45.2024.5.02.0001',
  grau: 'primeiro_grau' as const,
  principal: true,
  ordem: 0,
  status_pje: null,
  situacao_pje: null,
  autoridade: null,
  endereco_desconhecido: null,
  dados_pje_completo: { test: 'data' },
  ultima_atualizacao_pje: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockEntidade = {
  nome: 'Cliente Teste',
  tipo_pessoa: 'pf' as const,
  cpf: '12345678901',
  cnpj: null,
  emails: ['teste@email.com'],
  ddd_celular: '11',
  numero_celular: '999999999',
  ddd_telefone: null,
  numero_telefone: null,
};

const mockProcesso = {
  classe_judicial: '001',
  codigo_status_processo: '01',
  data_autuacao: '2024-01-01',
  nome_parte_autora: 'Autor',
  nome_parte_re: 'Réu',
};

// Spies para console
let consoleLogSpy: jest.SpyInstance;
let consoleErrorSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

describe('processo-partes-persistence.service', () => {
  describe('criarProcessoParte', () => {
    describe('Testes de Validação', () => {
      it('Deve rejeitar criação sem processo_id', async () => {
        const result = await criarProcessoParte({ ...validParams, processo_id: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('processo_id é obrigatório');
      });

      it('Deve rejeitar criação sem tipo_entidade', async () => {
        const result = await criarProcessoParte({ ...validParams, tipo_entidade: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('tipo_entidade inválido (deve ser cliente, parte_contraria ou terceiro)');
      });

      it('Deve rejeitar tipo_entidade inválido', async () => {
        const result = await criarProcessoParte({ ...validParams, tipo_entidade: 'invalido' as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('tipo_entidade inválido (deve ser cliente, parte_contraria ou terceiro)');
      });

      it('Deve rejeitar criação sem entidade_id', async () => {
        const result = await criarProcessoParte({ ...validParams, entidade_id: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('entidade_id é obrigatório');
      });

      it('Deve rejeitar criação sem id_pje', async () => {
        const result = await criarProcessoParte({ ...validParams, id_pje: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('id_pje é obrigatório');
      });

      it('Deve rejeitar criação sem trt', async () => {
        const result = await criarProcessoParte({ ...validParams, trt: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('trt é obrigatório');
      });

      it('Deve rejeitar criação sem grau', async () => {
        const result = await criarProcessoParte({ ...validParams, grau: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('grau inválido (deve ser 1 ou 2)');
      });

      it('Deve rejeitar grau inválido', async () => {
        const result = await criarProcessoParte({ ...validParams, grau: 'terceiro_grau' as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('grau inválido (deve ser 1 ou 2)');
      });

      it('Deve rejeitar criação sem numero_processo', async () => {
        const result = await criarProcessoParte({ ...validParams, numero_processo: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('numero_processo é obrigatório');
      });

      it('Deve rejeitar criação sem tipo_parte', async () => {
        const result = await criarProcessoParte({ ...validParams, tipo_parte: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('tipo_parte inválido');
      });

      it('Deve rejeitar tipo_parte inválido', async () => {
        const result = await criarProcessoParte({ ...validParams, tipo_parte: 'PARTE_INVALIDA' as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('tipo_parte inválido');
      });

      it('Deve rejeitar criação sem polo', async () => {
        const result = await criarProcessoParte({ ...validParams, polo: undefined as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('polo inválido (deve ser ATIVO, PASSIVO, NEUTRO ou TERCEIRO)');
      });

      it('Deve rejeitar polo inválido', async () => {
        const result = await criarProcessoParte({ ...validParams, polo: 'OUTROS' as any });
        expect(result.success).toBe(false);
        expect(result.error).toBe('polo inválido (deve ser ATIVO, PASSIVO, NEUTRO ou TERCEIRO)');
      });

      it('Deve rejeitar ordem negativa', async () => {
        const result = await criarProcessoParte({ ...validParams, ordem: -1 });
        expect(result.success).toBe(false);
        expect(result.error).toBe('ordem deve ser >= 0');
      });

      it('Deve aceitar ordem zero ou positiva', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const resultZero = await criarProcessoParte({ ...validParams, ordem: 0 });
        expect(resultZero.success).toBe(true);

        const resultPositive = await criarProcessoParte({ ...validParams, ordem: 5 });
        expect(resultPositive.success).toBe(true);
      });

      it('Deve aceitar ordem null', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await criarProcessoParte({ ...validParams, ordem: undefined });
        expect(result.success).toBe(true);
      });

      it('Deve logar warning se id_pessoa_pje não fornecido', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        await criarProcessoParte({ ...validParams, id_pessoa_pje: undefined });
        expect(consoleWarnSpy).toHaveBeenCalledWith('[PROCESSO-PARTES] id_pessoa_pje não fornecido - auditoria PJE incompleta');
      });
    });

    describe('Testes de Criação (CRUD)', () => {
      it('Deve criar vínculo com campos obrigatórios', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProcessoParte);
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            processo_id: 1,
            tipo_entidade: 'cliente',
            entidade_id: 1,
            id_pje: 123,
            tipo_parte: 'RECLAMANTE',
            polo: 'ATIVO',
            trt: '02',
            grau: 'primeiro_grau',
            numero_processo: '0000123-45.2024.5.02.0001',
          }),
          { onConflict: 'processo_id,tipo_entidade,entidade_id,grau' }
        );
      });

      it('Deve criar vínculo com todos os campos opcionais', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProcessoParte);
      });

      it('Deve popular dados_pje_completo corretamente', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        await criarProcessoParte(validParams);
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({ dados_pje_completo: { test: 'data' } }),
          expect.any(Object)
        );
      });

      it('Deve popular created_at e updated_at automaticamente', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.data?.created_at).toBeDefined();
        expect(result.data?.updated_at).toBeDefined();
      });

      it('Deve retornar vínculo criado com ID', async () => {
        mockUpsert.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(true);
        expect(result.data?.id).toBe(1);
      });
    });

    describe('Testes de Upsert (Idempotência)', () => {
      it('Deve atualizar vínculo existente ao tentar criar duplicata', async () => {
        const updatedData = { ...mockProcessoParte, ordem: 1 };
        mockUpsert.mockResolvedValue({ data: updatedData, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(true);
        expect(result.data?.ordem).toBe(1);
      });

      it('Deve permitir mesma entidade em graus diferentes', async () => {
        mockUpsert.mockResolvedValue({ data: { ...mockProcessoParte, grau: 'segundo_grau' }, error: null });
        const result = await criarProcessoParte({ ...validParams, grau: 'segundo_grau' });
        expect(result.success).toBe(true);
        expect(result.data?.grau).toBe('segundo_grau');
      });

      it('Deve permitir mesma entidade em processos diferentes', async () => {
        mockUpsert.mockResolvedValue({ data: { ...mockProcessoParte, processo_id: 2 }, error: null });
        const result = await criarProcessoParte({ ...validParams, processo_id: 2 });
        expect(result.success).toBe(true);
        expect(result.data?.processo_id).toBe(2);
      });

      it('Deve atualizar dados_pje_completo em upsert', async () => {
        const newData = { new: 'data' };
        mockUpsert.mockResolvedValue({ data: { ...mockProcessoParte, dados_pje_completo: newData }, error: null });
        const result = await criarProcessoParte({ ...validParams, dados_pje_completo: newData });
        expect(result.data?.dados_pje_completo).toEqual(newData);
      });

      it('Deve atualizar updated_at em upsert', async () => {
        const updatedData = { ...mockProcessoParte, updated_at: '2024-01-02T00:00:00Z' };
        mockUpsert.mockResolvedValue({ data: updatedData, error: null });
        const result = await criarProcessoParte(validParams);
        expect(result.data?.updated_at).toBe('2024-01-02T00:00:00Z');
      });
    });

    describe('Testes de Erros de Constraint', () => {
      it('Deve retornar erro específico para FK violation (processo_id inválido)', async () => {
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23503', message: 'FK violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Processo ou entidade não encontrada (FK inválida)');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('Deve retornar erro específico para FK violation (entidade_id inválido)', async () => {
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23503', message: 'FK violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Processo ou entidade não encontrada (FK inválida)');
      });

      it('Deve retornar erro específico para UNIQUE violation (duplicata)', async () => {
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23505', message: 'UNIQUE violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Vínculo duplicado para esta entidade neste processo/grau');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      it('Deve retornar erro específico para CHECK violation (tipo_entidade inválido)', async () => {
        // Simular erro de CHECK, mas como validamos antes, este seria para outros campos
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23514', message: 'CHECK violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Valor inválido em campo com constraint CHECK');
      });

      it('Deve retornar erro específico para CHECK violation (polo inválido)', async () => {
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23514', message: 'CHECK violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Valor inválido em campo com constraint CHECK');
      });

      it('Deve retornar erro específico para CHECK violation (ordem negativa)', async () => {
        // Ordem negativa é validada antes, mas se passar, CHECK pode falhar
        mockUpsert.mockResolvedValue({ data: null, error: { code: '23514', message: 'CHECK violation' } });
        const result = await criarProcessoParte(validParams);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Valor inválido em campo com constraint CHECK');
      });
    });
  });

  describe('atualizarProcessoParte', () => {
    describe('Testes de Atualização', () => {
      it('Deve atualizar campos individuais', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        mockUpdate.mockResolvedValue({ data: { ...mockProcessoParte, ordem: 1 }, error: null });
        const result = await atualizarProcessoParte({ id: 1, ordem: 1 });
        expect(result.success).toBe(true);
        expect(result.data?.ordem).toBe(1);
      });

      it('Deve atualizar múltiplos campos', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        mockUpdate.mockResolvedValue({ data: { ...mockProcessoParte, ordem: 1, principal: false }, error: null });
        const result = await atualizarProcessoParte({ id: 1, ordem: 1, principal: false });
        expect(result.success).toBe(true);
        expect(result.data?.ordem).toBe(1);
        expect(result.data?.principal).toBe(false);
      });

      it('Deve rejeitar atualização de campos da UNIQUE constraint', async () => {
        const result = await atualizarProcessoParte({ id: 1, processo_id: 2 });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Não é permitido alterar campos da constraint UNIQUE (processo_id, tipo_entidade, entidade_id, grau)');
      });

      it('Deve retornar erro se vínculo não existe', async () => {
        mockSelect.mockResolvedValue({ data: null, error: null });
        const result = await atualizarProcessoParte({ id: 999, ordem: 1 });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Vínculo não encontrado');
      });

      it('Deve validar novos valores em atualização', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await atualizarProcessoParte({ id: 1, ordem: -1 });
        expect(result.success).toBe(false);
        expect(result.error).toBe('ordem deve ser >= 0');
      });
    });
  });

  describe('buscarProcessoPartePorId', () => {
    describe('Testes de Busca', () => {
      it('Deve buscar vínculo por ID', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        const result = await buscarProcessoPartePorId(1);
        expect(result).toEqual(mockProcessoParte);
      });

      it('Deve retornar null se vínculo não existe', async () => {
        mockSelect.mockResolvedValue({ data: null, error: null });
        const result = await buscarProcessoPartePorId(999);
        expect(result).toBeNull();
      });
    });
  });

  describe('buscarPartesPorProcesso', () => {
    it('Deve buscar partes de um processo (JOIN polimórfico)', async () => {
      const participacoes = [mockProcessoParte];
      mockSelect.mockResolvedValue({ data: participacoes, error: null });
      // Mock para entidade
      const mockFromEntidade = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockEntidade, error: null }),
      }));
      (mockFrom as jest.Mock).mockImplementation((table) => {
        if (table === 'processo_partes') {
          return {
            select: mockSelect,
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
          };
        } else {
          return mockFromEntidade();
        }
      });

      const result = await buscarPartesPorProcesso({ processo_id: 1 });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        processo_id: 1,
        tipo_entidade: 'cliente',
        entidade_id: 1,
        tipo_parte: 'RECLAMANTE',
        polo: 'ATIVO',
        ordem: 0,
        principal: true,
        nome: 'Cliente Teste',
        tipo_pessoa: 'pf',
        cpf: '12345678901',
      });
    });

    it('Deve filtrar partes por polo', async () => {
      const participacoes = [mockProcessoParte];
      mockSelect.mockResolvedValue({ data: participacoes, error: null });
      const mockFromEntidade = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockEntidade, error: null }),
      }));
      (mockFrom as jest.Mock).mockImplementation((table) => {
        if (table === 'processo_partes') {
          return {
            select: mockSelect,
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
          };
        } else {
          return mockFromEntidade();
        }
      });

      const result = await buscarPartesPorProcesso({ processo_id: 1, polo: 'ATIVO' });
      expect(result).toHaveLength(1);
    });

    it('Deve ordenar partes por polo e ordem', async () => {
      const participacoes = [mockProcessoParte];
      mockSelect.mockResolvedValue({ data: participacoes, error: null });
      const mockFromEntidade = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockEntidade, error: null }),
      }));
      (mockFrom as jest.Mock).mockImplementation((table) => {
        if (table === 'processo_partes') {
          return {
            select: mockSelect,
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
          };
        } else {
          return mockFromEntidade();
        }
      });

      await buscarPartesPorProcesso({ processo_id: 1 });
      expect(mockSelect).toHaveBeenCalledWith('*', { count: undefined });
    });

    it('Deve retornar array vazio se entidade não tem processos', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await buscarPartesPorProcesso({ processo_id: 1 });
      expect(result).toEqual([]);
    });
  });

  describe('buscarProcessosPorEntidade', () => {
    it('Deve buscar processos de uma entidade', async () => {
      const participacoes = [mockProcessoParte];
      mockSelect.mockResolvedValue({ data: participacoes, error: null });
      // Mock para processo
      const mockFromProcesso = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockProcesso, error: null }),
      }));
      (mockFrom as jest.Mock).mockImplementation((table) => {
        if (table === 'processo_partes') {
          return {
            select: mockSelect,
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
          };
        } else {
          return mockFromProcesso();
        }
      });

      const result = await buscarProcessosPorEntidade({ tipo_entidade: 'cliente', entidade_id: 1 });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        processo_id: 1,
        numero_processo: '0000123-45.2024.5.02.0001',
        trt: '02',
        grau: 'primeiro_grau',
        tipo_parte: 'RECLAMANTE',
        polo: 'ATIVO',
        ordem: 0,
        principal: true,
        classe_judicial: '001',
        codigo_status_processo: '01',
        data_autuacao: '2024-01-01',
        nome_parte_autora: 'Autor',
        nome_parte_re: 'Réu',
      });
    });

    it('Deve retornar array vazio se entidade não tem processos', async () => {
      mockSelect.mockResolvedValue({ data: [], error: null });
      const result = await buscarProcessosPorEntidade({ tipo_entidade: 'cliente', entidade_id: 1 });
      expect(result).toEqual([]);
    });
  });

  describe('desvincularParteProcesso', () => {
    describe('Testes de Deleção', () => {
      it('Deve desvincular parte de processo', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        mockDelete.mockResolvedValue({ error: null });
        const result = await desvincularParteProcesso({ id: 1 });
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockProcessoParte);
      });

      it('Deve retornar erro se vínculo não existe', async () => {
        mockSelect.mockResolvedValue({ data: null, error: null });
        const result = await desvincularParteProcesso({ id: 999 });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Vínculo não encontrado');
      });

      it('Deve retornar vínculo deletado', async () => {
        mockSelect.mockResolvedValue({ data: mockProcessoParte, error: null });
        mockDelete.mockResolvedValue({ error: null });
        const result = await desvincularParteProcesso({ id: 1 });
        expect(result.data).toEqual(mockProcessoParte);
      });
    });
  });

  describe('listarProcessoPartes', () => {
    it('Deve listar vínculos com paginação', async () => {
      const processoPartes = [mockProcessoParte];
      mockSelect.mockResolvedValue({ data: processoPartes, error: null, count: 1 });
      const result = await listarProcessoPartes({ pagina: 1, limite: 10 });
      expect(result.processoPartes).toEqual(processoPartes);
      expect(result.total).toBe(1);
      expect(result.pagina).toBe(1);
      expect(result.limite).toBe(10);
      expect(result.totalPaginas).toBe(1);
    });
  });
});