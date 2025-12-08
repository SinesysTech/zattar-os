/**
 * Testes E2E do endpoint /api/meu-processo/consulta
 * 
 * Testa o fluxo completo da API, incluindo autenticação,
 * validação, transformação e resposta.
 */

import { POST, GET } from '@/app/api/meu-processo/consulta/route';
import { NextRequest } from 'next/server';
import * as sinesysClientModule from '@/lib/services/sinesys-client';

// Mock do SinesysClient
jest.mock('@/lib/services/sinesys-client', () => ({
  sinesysClient: {
    buscarDadosClientePorCpf: jest.fn(),
    buscarAcordosDoCliente: jest.fn(),
  },
  SinesysAPIError: class SinesysAPIError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public details?: string,
      public code?: string
    ) {
      super(message);
      this.name = 'SinesysAPIError';
    }
  },
}));

describe('API /api/meu-processo/consulta', () => {
  const originalEnv = process.env;
  const mockApiKey = 'test-service-api-key';

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      SERVICE_API_KEY: mockApiKey,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper para criar NextRequest
  function createRequest(
    body: any,
    headers?: Record<string, string>
  ): NextRequest {
    const url = 'http://localhost:3000/api/meu-processo/consulta';
    return new NextRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  describe('GET - Documentação', () => {
    it('deve retornar documentação do endpoint', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('endpoint');
      expect(data).toHaveProperty('method', 'POST');
      expect(data).toHaveProperty('authentication');
      expect(data.authentication.header).toBe('x-service-api-key');
    });
  });

  describe('POST - Autenticação', () => {
    it('deve rejeitar requisição sem API Key', async () => {
      const request = createRequest({ cpf: '12345678901' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Autenticação inválida');
    });

    it('deve rejeitar requisição com API Key inválida', async () => {
      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': 'invalid-key' }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Autenticação inválida');
    });

    it('deve aceitar requisição com API Key válida', async () => {
      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      // Mock de resposta válida
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue({
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: { total_processos: 0, com_audiencia_proxima: 0 },
            processos: [],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: {
              total_audiencias: 0,
              futuras: 0,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [],
          },
        },
        contratos: {
          success: true,
          data: { contratos: [], total: 0, pagina: 1, limite: 50 },
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST - Validação de CPF', () => {
    it('deve rejeitar requisição sem CPF', async () => {
      const request = createRequest(
        {},
        { 'x-service-api-key': mockApiKey }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('CPF não fornecido');
    });

    it('deve rejeitar CPF com menos de 11 dígitos', async () => {
      const request = createRequest(
        { cpf: '123456789' },
        { 'x-service-api-key': mockApiKey }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CPF inválido');
    });

    it('deve rejeitar CPF com mais de 11 dígitos', async () => {
      const request = createRequest(
        { cpf: '123456789012' },
        { 'x-service-api-key': mockApiKey }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CPF inválido');
    });

    it('deve rejeitar CPF com dígitos repetidos (11111111111)', async () => {
      const request = createRequest(
        { cpf: '11111111111' },
        { 'x-service-api-key': mockApiKey }
      );
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CPF inválido');
    });

    it('deve aceitar CPF com formatação (123.456.789-01)', async () => {
      const request = createRequest(
        { cpf: '123.456.789-01' },
        { 'x-service-api-key': mockApiKey }
      );

      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue({
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: { total_processos: 0, com_audiencia_proxima: 0 },
            processos: [],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: {
              total_audiencias: 0,
              futuras: 0,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [],
          },
        },
        contratos: {
          success: true,
          data: { contratos: [], total: 0, pagina: 1, limite: 50 },
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('deve rejeitar body inválido (não-JSON)', async () => {
      const url = 'http://localhost:3000/api/meu-processo/consulta';
      const request = new NextRequest(url, {
        method: 'POST',
        headers: {
          'x-service-api-key': mockApiKey,
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Body inválido');
    });
  });

  describe('POST - Busca de Dados', () => {
    it('deve retornar dados do cliente com sucesso', async () => {
      const mockDados = {
        processos: {
          success: true,
          data: {
            cliente: { nome: 'Maria Santos', cpf: '98765432100' },
            resumo: { total_processos: 2, com_audiencia_proxima: 1 },
            processos: [
              {
                numero: '0001234-56.2024.5.03.0001',
                tipo: 'Ação Trabalhista',
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa XYZ',
                tribunal: 'TRT da 3ª Região (MG)',
                sigilo: false,
                instancias: {
                  primeiro_grau: {
                    data_inicio: '10/01/2024',
                  },
                  segundo_grau: null,
                },
                timeline: [],
                timeline_status: 'disponivel' as const,
                partes: {
                  polo_ativo: 'Maria Santos',
                  polo_passivo: 'Empresa XYZ',
                },
              },
            ],
          },
        },
        audiencias: {
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
                numero_processo: '0001234-56.2024.5.03.0001',
                tipo: 'Audiência de Instrução',
                data: '15/03/2025',
                horario: '14:00 - 15:00',
                modalidade: 'Virtual' as const,
                status: 'Designada' as const,
                local: {
                  tipo: 'virtual' as const,
                  url_virtual: 'https://zoom.us/j/123',
                },
                partes: {
                  polo_ativo: 'Maria Santos',
                  polo_passivo: 'Empresa XYZ',
                },
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa XYZ',
                tribunal: 'TRT 3',
                sigilo: false,
              },
            ],
          },
        },
        contratos: {
          success: true,
          data: {
            contratos: [
              {
                id: 1,
                cliente_id: 10,
                cliente_nome: 'Maria Santos',
                status: 'Ativo',
              },
            ],
            total: 1,
            pagina: 1,
            limite: 50,
          },
        },
      };

      const mockAcordos = {
        success: true,
        data: {
          acordos: [
            {
              id: 1,
              processo_id: 100,
              tipo: 'acordo' as const,
              direcao: 'recebimento' as const,
              valor_total: 10000.0,
              quantidade_parcelas: 1,
              parcelas: [
                {
                  id: 1,
                  numero: 1,
                  valor: 10000.0,
                  status: 'pendente' as const,
                  repassado_cliente: false,
                },
              ],
            },
          ],
          total: 1,
          pagina: 1,
          limite: 50,
        },
      };

      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue(mockDados);
      (sinesysClientModule.sinesysClient.buscarAcordosDoCliente as jest.Mock).mockResolvedValue(mockAcordos);

      const request = createRequest(
        { cpf: '98765432100' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('processos');
      expect(data).toHaveProperty('audiencias');
      expect(data).toHaveProperty('contratos');
      expect(data).toHaveProperty('acordos_condenacoes');
      
      expect(data.processos).toHaveLength(1);
      expect(data.audiencias).toHaveLength(1);
      expect(Array.isArray(data.contratos)).toBe(true);
      expect(data.acordos_condenacoes).toHaveLength(1);
    });

    it('deve incluir header de cache na resposta', async () => {
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue({
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: { total_processos: 0, com_audiencia_proxima: 0 },
            processos: [],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: {
              total_audiencias: 0,
              futuras: 0,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [],
          },
        },
        contratos: {
          success: true,
          data: { contratos: [], total: 0, pagina: 1, limite: 50 },
        },
      });

      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);

      expect(response.headers.get('Cache-Control')).toBe('private, max-age=300');
    });

    it('deve continuar sem acordos se a busca falhar', async () => {
      const mockDados = {
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: { total_processos: 1, com_audiencia_proxima: 0 },
            processos: [
              {
                numero: '001',
                tipo: 'Ação',
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa',
                tribunal: 'TRT 3',
                sigilo: false,
                instancias: { primeiro_grau: null, segundo_grau: null },
                timeline: [],
                timeline_status: 'disponivel' as const,
                partes: { polo_ativo: 'João', polo_passivo: 'Empresa' },
              },
            ],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: {
              total_audiencias: 0,
              futuras: 0,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [],
          },
        },
        contratos: {
          success: true,
          data: { contratos: [], total: 0, pagina: 1, limite: 50 },
        },
      };

      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue(mockDados);
      (sinesysClientModule.sinesysClient.buscarAcordosDoCliente as jest.Mock).mockRejectedValue(
        new Error('Erro ao buscar acordos')
      );

      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processos).toHaveLength(1);
      expect(data.acordos_condenacoes).toEqual([]);
    });
  });

  describe('POST - Tratamento de Erros', () => {
    it('deve retornar erro quando API Sinesys falha', async () => {
      const { SinesysAPIError } = sinesysClientModule;
      
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockRejectedValue(
        new SinesysAPIError('Erro interno do servidor', 500, 'Detalhes do erro', 'INTERNAL_ERROR')
      );

      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro interno do servidor');
      expect(data.details).toBe('Detalhes do erro');
      expect(data.code).toBe('INTERNAL_ERROR');
    });

    it('deve retornar erro genérico para exceções não tratadas', async () => {
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockRejectedValue(
        new Error('Erro inesperado')
      );

      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erro ao processar consulta');
      expect(data.details).toBe('Erro inesperado');
    });
  });

  describe('POST - Casos Especiais', () => {
    it('deve retornar mensagem quando não há dados', async () => {
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue({
        processos: { success: false, error: 'Cliente não encontrado' },
        audiencias: { success: false, error: 'Cliente não encontrado' },
        contratos: { success: false, error: 'Cliente não encontrado' },
      });

      const request = createRequest(
        { cpf: '99999999999' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Não foram encontrados dados para este CPF');
      expect(data.processos).toEqual([]);
      expect(data.audiencias).toEqual([]);
    });

    it('deve retornar string quando não há contratos', async () => {
      (sinesysClientModule.sinesysClient.buscarDadosClientePorCpf as jest.Mock).mockResolvedValue({
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: { total_processos: 1, com_audiencia_proxima: 0 },
            processos: [
              {
                numero: '001',
                tipo: 'Ação',
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa',
                tribunal: 'TRT 3',
                sigilo: false,
                instancias: { primeiro_grau: null, segundo_grau: null },
                timeline: [],
                timeline_status: 'disponivel' as const,
                partes: { polo_ativo: 'João', polo_passivo: 'Empresa' },
              },
            ],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: {
              total_audiencias: 0,
              futuras: 0,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [],
          },
        },
        contratos: {
          success: true,
          data: { contratos: [], total: 0, pagina: 1, limite: 50 },
        },
      });

      const request = createRequest(
        { cpf: '12345678901' },
        { 'x-service-api-key': mockApiKey }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contratos).toBe('Nenhum contrato encontrado');
    });
  });
});
