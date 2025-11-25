/**
 * Testes de Integração: captura completa de partes
 *
 * PROPÓSITO:
 * Validar fluxo end-to-end de captura incluindo:
 * - Validação de dados PJE
 * - Persistência em múltiplas tabelas
 * - Criação de vínculos
 * - Tratamento de erros
 * - Performance
 *
 * EXECUÇÃO:
 * npx jest backend/captura/services/partes/__tests__/captura-partes-integration.test.ts
 *
 * REQUISITOS:
 * - Banco de dados de teste configurado
 * - Variáveis de ambiente de teste
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { capturarPartesProcesso } from '../partes-capture.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ProcessoParaCaptura } from '../partes-capture.service';
import type { AdvogadoIdentificacao } from '../identificacao-partes.service';
import type { PartePJE } from '../schemas';

// Mock Playwright Page com stub de evaluate
const createMockPage = (partesData: PartePJE[]) => {
  return {
    evaluate: jest.fn().mockResolvedValue(partesData),
  } as any;
};

const mockAdvogado: AdvogadoIdentificacao = {
  id: 1,
  documento: '12345678900',
  nome: 'Dr. Teste Advogado',
};

const mockProcesso: ProcessoParaCaptura = {
  id: 999999,
  numero_processo: '0000000-00.2024.5.03.0001',
  id_pje: 123456,
  trt: 'TRT3',
  grau: 'primeiro_grau',
};

// Mock de dados PJE válidos
const mockParteCliente: PartePJE = {
  idPessoa: 999999,
  nome: 'João Silva',
  numeroDocumento: '12345678900',
  tipoDocumento: 'CPF',
  tipoParte: 'RECLAMANTE',
  polo: 'ATIVO',
  emails: ['joao@example.com'],
  telefones: [{ ddd: '11', numero: '987654321' }],
  dadosCompletos: {},
  representantes: [],
};

const mockParteContraria: PartePJE = {
  idPessoa: 999998,
  nome: 'Empresa XYZ Ltda',
  numeroDocumento: '12345678000199',
  tipoDocumento: 'CNPJ',
  tipoParte: 'RECLAMADO',
  polo: 'PASSIVO',
  emails: ['contato@empresa.com'],
  telefones: [],
  dadosCompletos: {},
  representantes: [],
};

describe('Captura de Partes - Integração', () => {
  let supabase: ReturnType<typeof createServiceClient>;

  beforeAll(() => {
    supabase = createServiceClient();
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await supabase.from('processo_partes').delete().eq('processo_id', mockProcesso.id);
    await supabase.from('representantes').delete().in('parte_tipo', ['cliente', 'parte_contraria']);
    await supabase.from('clientes').delete().eq('id_pessoa_pje', 999999);
    await supabase.from('partes_contrarias').delete().eq('id_pessoa_pje', 999998);
  });

  afterAll(async () => {
    // Cleanup final
    await supabase.from('processo_partes').delete().eq('processo_id', mockProcesso.id);
    await supabase.from('clientes').delete().eq('id_pessoa_pje', 999999);
    await supabase.from('partes_contrarias').delete().eq('id_pessoa_pje', 999998);
  });

  describe('Cenários de Sucesso', () => {
    it('deve capturar processo com 2 partes (cliente + parte contrária)', async () => {
      const mockPage = createMockPage([mockParteCliente, mockParteContraria]);

      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.totalPartes).toBe(2);
      expect(resultado.procesadas).toBe(2);
      expect(resultado.erros).toBe(0);

      // Validar persistência no banco
      const { data: vinculos } = await supabase
        .from('processo_partes')
        .select('*')
        .eq('processo_id', mockProcesso.id);

      expect(vinculos).toHaveLength(2);
    });

    it('deve capturar processo com representantes', async () => {
      const parteComRepresentante: PartePJE = {
        ...mockParteCliente,
        representantes: [{
          idPessoa: 888888,
          nome: 'Dr. Advogado Teste',
          numeroDocumento: '98765432100',
          tipoDocumento: 'CPF',
          numeroOAB: 'SP123456',
          situacaoOAB: 'ATIVO',
          tipo: 'ADVOGADO',
          email: 'advogado@example.com',
          telefones: [],
          dadosCompletos: {},
        }],
      };

      const mockPage = createMockPage([parteComRepresentante]);

      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      expect(resultado.sucesso).toBe(true);
      expect(resultado.totalRepresentantes).toBeGreaterThan(0);

      // Validar representante no banco
      const { data: representantes } = await supabase
        .from('representantes')
        .select('*')
        .eq('numero_processo', mockProcesso.numero_processo);

      expect(representantes?.length).toBeGreaterThan(0);
    });

    it('deve capturar processo com endereços', async () => {
      const parteComEndereco: PartePJE = {
        ...mockParteCliente,
        dadosCompletos: {
          endereco: {
            id: 777777,
            logradouro: 'Rua Teste',
            numero: '123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            uf: 'SP',
            cep: '01000-000',
          },
        },
      };

      const mockPage = createMockPage([parteComEndereco]);

      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      expect(resultado.sucesso).toBe(true);

      // Validar endereço vinculado
      const { data: cliente } = await supabase
        .from('clientes')
        .select('endereco_id')
        .eq('id_pessoa_pje', mockParteCliente.idPessoa)
        .single();

      expect(cliente?.endereco_id).toBeTruthy();
    });
  });

  describe('Cenários de Erro', () => {
    it('deve continuar captura se uma parte falhar', async () => {
      const parteInvalida: PartePJE = {
        ...mockParteCliente,
        numeroDocumento: '', // CPF vazio deve falhar validação
      };

      const mockPage = createMockPage([parteInvalida, mockParteContraria]);

      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      // Deve ter processado ao menos a parte válida
      expect(resultado.procesadas).toBeGreaterThan(0);
      expect(resultado.erros).toBe(1);
    });

    it('deve tratar erro de validação de schema PJE', async () => {
      const parteInvalida = {
        // Faltam campos obrigatórios
        nome: 'Teste',
      } as any;

      const mockPage = createMockPage([parteInvalida]);

      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      expect(resultado.sucesso).toBe(false);
      expect(resultado.erros).toBeGreaterThan(0);
      expect(resultado.detalhes).toContain('validação');
    });

    it('deve tratar constraint violation com upsert', async () => {
      const mockPage = createMockPage([mockParteCliente]);

      // Primeira captura
      await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      // Segunda captura (mesma parte - deve fazer upsert)
      const resultado = await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      expect(resultado.sucesso).toBe(true);

      // Verificar que não há duplicatas
      const { data: clientes } = await supabase
        .from('clientes')
        .select('id')
        .eq('id_pessoa_pje', mockParteCliente.idPessoa);

      expect(clientes).toHaveLength(1);
    });
  });

  describe('Performance', () => {
    it('deve processar processo simples em menos de 5s', async () => {
      const mockPage = createMockPage([mockParteCliente, mockParteContraria]);

      const inicio = Date.now();
      await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);
      const duracao = Date.now() - inicio;

      expect(duracao).toBeLessThan(5000);
    });
  });

  describe('Idempotência', () => {
    it('deve permitir recaptura do mesmo processo sem duplicatas', async () => {
      const mockPage = createMockPage([mockParteCliente]);

      // Captura 1
      await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      // Captura 2
      await capturarPartesProcesso(mockPage, mockProcesso, mockAdvogado);

      // Verificar vínculos únicos
      const { data: vinculos } = await supabase
        .from('processo_partes')
        .select('*')
        .eq('processo_id', mockProcesso.id);

      expect(vinculos).toHaveLength(1);
    });
  });
});