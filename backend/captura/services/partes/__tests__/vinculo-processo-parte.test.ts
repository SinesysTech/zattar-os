import { criarVinculoProcessoParte } from '../partes-capture.service';
import { vincularParteProcesso } from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import type { ProcessoParaCaptura } from '../partes-capture.service';
import type { PartePJE } from '@/backend/api/pje-trt/partes/types';
import type { TipoParteClassificacao } from './types';

// Mock the persistence service
jest.mock('@/backend/processo-partes/services/persistence/processo-partes-persistence.service', () => ({
  vincularParteProcesso: jest.fn(),
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('criarVinculoProcessoParte', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  // Fixtures
  const mockProcesso: ProcessoParaCaptura = {
    id: 123,
    numero_processo: '0000123-45.2024.5.02.0001',
    id_pje: 456,
    trt: '02',
    grau: 'primeiro_grau',
  };

  const mockParte: PartePJE = {
    idParte: 789,
    idPessoa: 101112,
    nome: 'João Silva',
    tipoParte: 'RECLAMANTE',
    polo: 'ATIVO',
    principal: true,
    dadosCompletos: { endereco: {}, status: 'ATIVO' },
    emails: ['joao@example.com'],
    telefones: [{ ddd: '11', numero: '999999999' }],
    numeroDocumento: '12345678901',
    tipoDocumento: 'CPF',
    representantes: [],
  };

  const mockEntidadeId = 999;
  const mockOrdem = 0;

  describe('Testes de Sucesso', () => {
    test('✅ Deve criar vínculo para cliente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);

      expect(result).toBe(true);
      expect(mockVincular).toHaveBeenCalledWith({
        processo_id: mockProcesso.id,
        tipo_entidade: 'cliente',
        entidade_id: mockEntidadeId,
        id_pje: mockParte.idParte,
        id_pessoa_pje: mockParte.idPessoa,
        tipo_parte: 'RECLAMANTE',
        polo: 'ATIVO',
        trt: mockProcesso.trt,
        grau: mockProcesso.grau,
        numero_processo: mockProcesso.numero_processo,
        principal: mockParte.principal,
        ordem: mockOrdem,
        dados_pje_completo: mockParte.dadosCompletos,
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('[CAPTURA-PARTES] ✓ Vínculo criado:', {
        processo: mockProcesso.numero_processo,
        parte: mockParte.nome,
        tipo: 'cliente',
        polo: mockParte.polo,
      });
    });

    test('✅ Deve criar vínculo para parte_contraria', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const result = await criarVinculoProcessoParte(mockProcesso, 'parte_contraria', mockEntidadeId, mockParte, mockOrdem);

      expect(result).toBe(true);
      expect(mockVincular).toHaveBeenCalledWith({
        processo_id: mockProcesso.id,
        tipo_entidade: 'parte_contraria',
        entidade_id: mockEntidadeId,
        id_pje: mockParte.idParte,
        id_pessoa_pje: mockParte.idPessoa,
        tipo_parte: 'RECLAMANTE',
        polo: 'ATIVO',
        trt: mockProcesso.trt,
        grau: mockProcesso.grau,
        numero_processo: mockProcesso.numero_processo,
        principal: mockParte.principal,
        ordem: mockOrdem,
        dados_pje_completo: mockParte.dadosCompletos,
      });
    });

    test('✅ Deve criar vínculo para terceiro', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const result = await criarVinculoProcessoParte(mockProcesso, 'terceiro', mockEntidadeId, mockParte, mockOrdem);

      expect(result).toBe(true);
      expect(mockVincular).toHaveBeenCalledWith({
        processo_id: mockProcesso.id,
        tipo_entidade: 'terceiro',
        entidade_id: mockEntidadeId,
        id_pje: mockParte.idParte,
        id_pessoa_pje: mockParte.idPessoa,
        tipo_parte: 'RECLAMANTE',
        polo: 'ATIVO',
        trt: mockProcesso.trt,
        grau: mockProcesso.grau,
        numero_processo: mockProcesso.numero_processo,
        principal: mockParte.principal,
        ordem: mockOrdem,
        dados_pje_completo: mockParte.dadosCompletos,
      });
    });

    test('✅ Deve popular dados_pje_completo com parte.dadosCompletos', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);

      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({
          dados_pje_completo: mockParte.dadosCompletos,
        })
      );
    });

    test('✅ Deve mapear parte.polo corretamente (ATIVO/PASSIVO/OUTROS→TERCEIRO)', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      // Test ATIVO
      const parteAtivo = { ...mockParte, polo: 'ATIVO' as const };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteAtivo, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ polo: 'ATIVO' })
      );

      // Test PASSIVO
      const partePassivo = { ...mockParte, polo: 'PASSIVO' as const };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, partePassivo, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ polo: 'PASSIVO' })
      );

      // Test OUTROS
      const parteOutros = { ...mockParte, polo: 'OUTROS' as const };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteOutros, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ polo: 'TERCEIRO' })
      );
    });

    test('✅ Deve validar e mapear parte.tipoParte corretamente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const parteReclamante = { ...mockParte, tipoParte: 'RECLAMANTE' };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteReclamante, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_parte: 'RECLAMANTE' })
      );

      // Test tipo inválido mapeia para OUTRO
      const parteInvalido = { ...mockParte, tipoParte: 'INVALIDO' };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteInvalido, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_parte: 'OUTRO' })
      );
    });

    test('✅ Deve passar ordem corretamente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const ordem = 5;
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, ordem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ ordem })
      );
    });

    test('✅ Deve passar principal corretamente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const partePrincipal = { ...mockParte, principal: true };
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, partePrincipal, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ principal: true })
      );
    });

    test('✅ Deve retornar true em sucesso', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(result).toBe(true);
    });
  });

  describe('Testes de Validação Prévia', () => {
    test('✅ Deve retornar false se entidadeId é 0 (entidade não foi criada)', async () => {
      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', 0, mockParte, mockOrdem);
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo: entidadeId inválido', {
        entidadeId: 0,
        parte_nome: mockParte.nome,
      });
    });

    test('✅ Deve retornar false se entidadeId é negativo', async () => {
      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', -1, mockParte, mockOrdem);
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo: entidadeId inválido', {
        entidadeId: -1,
        parte_nome: mockParte.nome,
      });
    });

    test('✅ Deve retornar false se parte.idParte não existe', async () => {
      const parteSemId = { ...mockParte, idParte: undefined as any };
      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteSemId, mockOrdem);
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo: idParte ausente', {
        parte_nome: mockParte.nome,
      });
    });

    test('✅ Deve logar erro com contexto (processo, parte, tipo)', async () => {
      await criarVinculoProcessoParte(mockProcesso, 'cliente', 0, mockParte, mockOrdem);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo: entidadeId inválido', {
        entidadeId: 0,
        parte_nome: mockParte.nome,
      });
    });
  });

  describe('Testes de Tratamento de Erros', () => {
    test('✅ Deve retornar false se vincularParteProcesso() falha', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: false, error: 'Erro de teste' });

      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(result).toBe(false);
    });

    test('✅ Deve logar erro específico retornado por vincularParteProcesso()', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      const errorMsg = 'Erro de teste';
      mockVincular.mockResolvedValue({ success: false, error: errorMsg });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo:', {
        processo_id: mockProcesso.id,
        tipo_entidade: 'cliente',
        entidade_id: mockEntidadeId,
        parte_nome: mockParte.nome,
        erro: errorMsg,
      });
    });

    test('✅ Deve logar contexto completo do erro (processo_id, tipo_entidade, entidade_id, parte.nome)', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: false, error: 'Erro' });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo:', {
        processo_id: mockProcesso.id,
        tipo_entidade: 'cliente',
        entidade_id: mockEntidadeId,
        parte_nome: mockParte.nome,
        erro: 'Erro',
      });
    });

    test('✅ Deve capturar exceções e retornar false', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockRejectedValue(new Error('Exceção de teste'));

      const result = await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[CAPTURA-PARTES] Erro ao criar vínculo processo-parte para João Silva:',
        expect.any(Error)
      );
    });
  });

  describe('Testes de Mapeamento de Campos', () => {
    test('✅ Deve passar processo.id como processo_id', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ processo_id: mockProcesso.id })
      );
    });

    test('✅ Deve passar tipoParte como tipo_entidade', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'parte_contraria', mockEntidadeId, mockParte, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ tipo_entidade: 'parte_contraria' })
      );
    });

    test('✅ Deve passar parte.idParte como id_pje', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ id_pje: mockParte.idParte })
      );
    });

    test('✅ Deve passar parte.idPessoa como id_pessoa_pje', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({ id_pessoa_pje: mockParte.idPessoa })
      );
    });

    test('✅ Deve passar processo.trt, processo.grau, processo.numero_processo corretamente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({
          trt: mockProcesso.trt,
          grau: mockProcesso.grau,
          numero_processo: mockProcesso.numero_processo,
        })
      );
    });

    test('✅ Deve passar parte.principal e ordem corretamente', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      const parteComOrdem = { ...mockParte, principal: false };
      const ordem = 2;
      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, parteComOrdem, ordem);
      expect(mockVincular).toHaveBeenCalledWith(
        expect.objectContaining({
          principal: false,
          ordem,
        })
      );
    });
  });

  describe('Testes de Logs', () => {
    test('✅ Deve logar sucesso com detalhes do vínculo', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockConsoleLog).toHaveBeenCalledWith('[CAPTURA-PARTES] ✓ Vínculo criado:', {
        processo: mockProcesso.numero_processo,
        parte: mockParte.nome,
        tipo: 'cliente',
        polo: mockParte.polo,
      });
    });

    test('✅ Deve logar erro com contexto completo', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: false, error: 'Erro' });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockConsoleError).toHaveBeenCalledWith('[CAPTURA-PARTES] Falha ao criar vínculo:', {
        processo_id: mockProcesso.id,
        tipo_entidade: 'cliente',
        entidade_id: mockEntidadeId,
        parte_nome: mockParte.nome,
        erro: 'Erro',
      });
    });

    test('✅ Deve incluir nome da parte nos logs', async () => {
      const mockVincular = vincularParteProcesso as jest.MockedFunction<typeof vincularParteProcesso>;
      mockVincular.mockResolvedValue({ success: true, data: { id: 1 } });

      await criarVinculoProcessoParte(mockProcesso, 'cliente', mockEntidadeId, mockParte, mockOrdem);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining(mockParte.nome),
        expect.any(Object)
      );
    });
  });
});