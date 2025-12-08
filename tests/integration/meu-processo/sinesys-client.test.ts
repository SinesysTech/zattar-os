/**
 * Testes de integração do SinesysClient
 * 
 * Testa a comunicação com a API Sinesys (com mocks)
 */

import { SinesysClient, SinesysAPIError } from '@/lib/services/sinesys-client';
import type {
  SinesysProcessoResponse,
  SinesysAudienciasResponse,
  SinesysClienteResponse,
  SinesysContratosResponse,
  SinesysAcordosResponse,
} from '@/lib/types/meu-processo-types';

// Mock do fetch global
global.fetch = jest.fn();

describe('SinesysClient', () => {
  let client: SinesysClient;
  const mockBaseUrl = 'http://localhost:3000';
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new SinesysClient({
      baseUrl: mockBaseUrl,
      apiKey: mockApiKey,
      timeout: 5000,
      retries: 1,
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Configuração e Headers', () => {
    it('deve incluir Service API Key nos headers', async () => {
      const mockResponse: SinesysProcessoResponse = {
        success: true,
        data: {
          cliente: { nome: 'João', cpf: '12345678901' },
          resumo: { total_processos: 0, com_audiencia_proxima: 0 },
          processos: [],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await client.buscarProcessosPorCpf('12345678901');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/acervo/cliente/cpf/12345678901'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-service-api-key': mockApiKey,
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('buscarProcessosPorCpf', () => {
    it('deve buscar processos com sucesso', async () => {
      const mockResponse: SinesysProcessoResponse = {
        success: true,
        data: {
          cliente: { nome: 'João da Silva', cpf: '12345678901' },
          resumo: { total_processos: 2, com_audiencia_proxima: 1 },
          processos: [
            {
              numero: '0001234-56.2024.5.03.0001',
              tipo: 'Ação Trabalhista',
              papel_cliente: 'Reclamante',
              parte_contraria: 'Empresa XYZ',
              tribunal: 'TRT 3',
              sigilo: false,
              instancias: { primeiro_grau: null, segundo_grau: null },
              timeline: [],
              timeline_status: 'disponivel',
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await client.buscarProcessosPorCpf('123.456.789-01');

      expect(resultado.success).toBe(true);
      expect(resultado.data.processos).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/acervo/cliente/cpf/12345678901`,
        expect.any(Object)
      );
    });

    it('deve limpar formatação do CPF', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: { total_processos: 0, com_audiencia_proxima: 0 },
            processos: [],
          },
        }),
      });

      await client.buscarProcessosPorCpf('123.456.789-01');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('12345678901'),
        expect.any(Object)
      );
    });
  });

  describe('buscarAudienciasPorCpf', () => {
    it('deve buscar audiências com sucesso', async () => {
      const mockResponse: SinesysAudienciasResponse = {
        success: true,
        data: {
          cliente: { nome: 'Maria Santos', cpf: '98765432100' },
          resumo: {
            total_audiencias: 1,
            futuras: 1,
            realizadas: 0,
            canceladas: 0,
          },
          audiencias: [
            {
              numero_processo: '001',
              tipo: 'Audiência de Instrução',
              data: '15/03/2025',
              horario: '14:00 - 15:00',
              modalidade: 'Virtual',
              status: 'Designada',
              local: { tipo: 'virtual' },
              partes: { polo_ativo: 'Maria', polo_passivo: 'Empresa' },
              papel_cliente: 'Reclamante',
              parte_contraria: 'Empresa',
              tribunal: 'TRT 15',
              sigilo: false,
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await client.buscarAudienciasPorCpf('98765432100');

      expect(resultado.success).toBe(true);
      expect(resultado.data.audiencias).toHaveLength(1);
    });
  });

  describe('buscarClientePorCpf', () => {
    it('deve buscar cliente com sucesso', async () => {
      const mockResponse: SinesysClienteResponse = {
        success: true,
        data: {
          id: 123,
          nome: 'João da Silva',
          cpf: '12345678901',
          email: 'joao@example.com',
          telefone: '31999999999',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await client.buscarClientePorCpf('12345678901');

      expect(resultado.success).toBe(true);
      expect(resultado.data.id).toBe(123);
      expect(resultado.data.nome).toBe('João da Silva');
    });
  });

  describe('buscarContratosPorCpf', () => {
    it('deve buscar cliente e depois contratos', async () => {
      const mockClienteResponse: SinesysClienteResponse = {
        success: true,
        data: {
          id: 456,
          nome: 'Pedro Oliveira',
          cpf: '11122233344',
        },
      };

      const mockContratosResponse: SinesysContratosResponse = {
        success: true,
        data: {
          contratos: [
            {
              id: 10,
              cliente_id: 456,
              cliente_nome: 'Pedro Oliveira',
              status: 'Ativo',
            },
          ],
          total: 1,
          pagina: 1,
          limite: 50,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockClienteResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockContratosResponse,
        });

      const resultado = await client.buscarContratosPorCpf('11122233344');

      expect(resultado.success).toBe(true);
      expect(resultado.data.contratos).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('deve retornar lista vazia quando cliente não existe', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ success: false, error: 'Cliente não encontrado' }),
      });

      const resultado = await client.buscarContratosPorCpf('00000000000');

      expect(resultado.success).toBe(true);
      expect(resultado.data.contratos).toEqual([]);
      expect(resultado.data.total).toBe(0);
    });
  });

  describe('buscarAcordosPorProcessoId', () => {
    it('deve buscar acordos de um processo', async () => {
      const mockResponse: SinesysAcordosResponse = {
        success: true,
        data: {
          acordos: [
            {
              id: 1,
              processo_id: 100,
              tipo: 'acordo',
              direcao: 'recebimento',
              valor_total: 50000.0,
              quantidade_parcelas: 3,
              parcelas: [
                {
                  id: 1,
                  numero: 1,
                  valor: 16666.67,
                  status: 'paga',
                  repassado_cliente: true,
                },
              ],
            },
          ],
          total: 1,
          pagina: 1,
          limite: 50,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const resultado = await client.buscarAcordosPorProcessoId(100);

      expect(resultado.success).toBe(true);
      expect(resultado.data.acordos).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/acordos-condenacoes?processoId=100'),
        expect.any(Object)
      );
    });
  });

  describe('buscarDadosClientePorCpf', () => {
    it('deve buscar todos os dados em paralelo', async () => {
      const mockProcessosResponse: SinesysProcessoResponse = {
        success: true,
        data: {
          cliente: { nome: 'Ana', cpf: '11111111111' },
          resumo: { total_processos: 1, com_audiencia_proxima: 0 },
          processos: [],
        },
      };

      const mockAudienciasResponse: SinesysAudienciasResponse = {
        success: true,
        data: {
          cliente: { nome: 'Ana', cpf: '11111111111' },
          resumo: {
            total_audiencias: 0,
            futuras: 0,
            realizadas: 0,
            canceladas: 0,
          },
          audiencias: [],
        },
      };

      const mockClienteResponse: SinesysClienteResponse = {
        success: true,
        data: {
          id: 789,
          nome: 'Ana',
          cpf: '11111111111',
        },
      };

      const mockContratosResponse: SinesysContratosResponse = {
        success: true,
        data: {
          contratos: [],
          total: 0,
          pagina: 1,
          limite: 50,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockProcessosResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAudienciasResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockClienteResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockContratosResponse });

      const resultado = await client.buscarDadosClientePorCpf('11111111111');

      expect(resultado.processos).toHaveProperty('success', true);
      expect(resultado.audiencias).toHaveProperty('success', true);
      expect(resultado.contratos).toHaveProperty('success', true);
      expect(global.fetch).toHaveBeenCalledTimes(4); // processos, audiencias, cliente, contratos
    });

    it('deve retornar erros para chamadas que falharam', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Erro de rede'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Servidor offline'));

      const resultado = await client.buscarDadosClientePorCpf('22222222222');

      expect(resultado.processos).toHaveProperty('success', false);
      expect(resultado.audiencias).toHaveProperty('success', false);
      expect(resultado.contratos).toHaveProperty('success', false);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lançar SinesysAPIError para erro HTTP 400', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          success: false,
          error: 'CPF inválido',
          code: 'INVALID_CPF',
        }),
      });

      await expect(client.buscarProcessosPorCpf('000')).rejects.toThrow(
        SinesysAPIError
      );

      await expect(client.buscarProcessosPorCpf('000')).rejects.toThrow(
        'CPF inválido'
      );
    });

    it('deve lançar SinesysAPIError para erro HTTP 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          success: false,
          error: 'Cliente não encontrado',
        }),
      });

      await expect(client.buscarClientePorCpf('99999999999')).rejects.toThrow(
        SinesysAPIError
      );
    });

    it('deve lançar SinesysAPIError para erro HTTP 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: 'Erro interno do servidor',
        }),
      });

      await expect(client.buscarProcessosPorCpf('12345678901')).rejects.toThrow(
        SinesysAPIError
      );
    });

    it('deve lançar SinesysAPIError para timeout', async () => {
      const clientComTimeout = new SinesysClient({
        baseUrl: mockBaseUrl,
        apiKey: mockApiKey,
        timeout: 100, // 100ms
        retries: 0,
      });

      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 1000);
          })
      );

      await expect(
        clientComTimeout.buscarProcessosPorCpf('12345678901')
      ).rejects.toThrow('Timeout na requisição');
    });

    it('deve lançar SinesysAPIError para erro de rede', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(client.buscarProcessosPorCpf('12345678901')).rejects.toThrow(
        'Erro de rede ou servidor indisponível'
      );
    });
  });

  describe('Retry Automático', () => {
    it('deve fazer retry em erro 500', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ success: false, error: 'Erro interno' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              cliente: { nome: 'João', cpf: '123' },
              resumo: { total_processos: 0, com_audiencia_proxima: 0 },
              processos: [],
            },
          }),
        });

      const resultado = await client.buscarProcessosPorCpf('12345678901');

      expect(resultado.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('NÃO deve fazer retry em erro 400', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          success: false,
          error: 'CPF inválido',
        }),
      });

      await expect(client.buscarProcessosPorCpf('000')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1); // Não retentou
    });

    it('NÃO deve fazer retry em erro 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          success: false,
          error: 'Não encontrado',
        }),
      });

      await expect(client.buscarClientePorCpf('99999999999')).rejects.toThrow();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Paginação', () => {
    it('deve passar parâmetros de paginação para contratos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { contratos: [], total: 0, pagina: 2, limite: 10 },
        }),
      });

      await client.buscarContratosPorClienteId(123, {
        pagina: 2,
        limite: 10,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pagina=2'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limite=10'),
        expect.any(Object)
      );
    });

    it('deve passar parâmetros de paginação para acordos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { acordos: [], total: 0, pagina: 3, limite: 20 },
        }),
      });

      await client.buscarAcordosPorProcessoId(100, {
        pagina: 3,
        limite: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('pagina=3'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limite=20'),
        expect.any(Object)
      );
    });
  });

  describe('buscarAcordosDoCliente', () => {
    it('deve buscar acordos de todos os processos do cliente', async () => {
      // Mock da busca de processos
      const mockProcessosResponse: SinesysProcessoResponse = {
        success: true,
        data: {
          cliente: { nome: 'Carlos', cpf: '33333333333' },
          resumo: { total_processos: 2, com_audiencia_proxima: 0 },
          processos: [
            {
              id: 100,
              numero: '001',
              tipo: 'Ação',
              papel_cliente: 'Reclamante',
              parte_contraria: 'Empresa A',
              tribunal: 'TRT 3',
              sigilo: false,
              instancias: { primeiro_grau: null, segundo_grau: null },
              timeline: [],
              timeline_status: 'disponivel',
            } as any,
            {
              id: 200,
              numero: '002',
              tipo: 'Ação',
              papel_cliente: 'Autor',
              parte_contraria: 'Empresa B',
              tribunal: 'TJMG',
              sigilo: false,
              instancias: { primeiro_grau: null, segundo_grau: null },
              timeline: [],
              timeline_status: 'disponivel',
            } as any,
          ],
        },
      };

      // Mock das buscas de acordos
      const mockAcordo1: SinesysAcordosResponse = {
        success: true,
        data: {
          acordos: [
            {
              id: 1,
              processo_id: 100,
              tipo: 'acordo',
              direcao: 'recebimento',
              valor_total: 10000,
              quantidade_parcelas: 1,
              parcelas: [
                { id: 1, numero: 1, valor: 10000, status: 'paga', repassado_cliente: true },
              ],
            },
          ],
          total: 1,
          pagina: 1,
          limite: 50,
        },
      };

      const mockAcordo2: SinesysAcordosResponse = {
        success: true,
        data: {
          acordos: [
            {
              id: 2,
              processo_id: 200,
              tipo: 'condenacao',
              direcao: 'recebimento',
              valor_total: 5000,
              quantidade_parcelas: 1,
              parcelas: [
                { id: 2, numero: 1, valor: 5000, status: 'pendente', repassado_cliente: false },
              ],
            },
          ],
          total: 1,
          pagina: 1,
          limite: 50,
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockProcessosResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAcordo1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAcordo2 });

      const resultado = await client.buscarAcordosDoCliente('33333333333');

      expect(resultado.success).toBe(true);
      expect(resultado.data.acordos).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 1 processos + 2 acordos
    });

    it('deve retornar lista vazia quando cliente não tem processos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            cliente: { nome: 'Teste', cpf: '444' },
            resumo: { total_processos: 0, com_audiencia_proxima: 0 },
            processos: [],
          },
        }),
      });

      const resultado = await client.buscarAcordosDoCliente('44444444444');

      expect(resultado.success).toBe(true);
      expect(resultado.data.acordos).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
