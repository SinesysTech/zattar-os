import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as service from '../../service';
import * as repository from '../../repository';
import {
  criarPangeaBuscaInputMock,
  criarPangeaBuscaResponseMock,
  criarOrgaoDisponivelMock,
} from '../fixtures';

jest.mock('../../repository');

// Mock Supabase service client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/service-client', () => ({
  createServiceClient: jest.fn(() => mockSupabase),
}));

describe('Pangea Integration - Busca e Paginação Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve executar fluxo completo: listar órgãos → buscar precedentes → paginar', async () => {
    // ========================================================================
    // 1. LISTAR órgãos disponíveis
    // ========================================================================
    const orgaos = [
      { codigo: 'TST', nome: 'Tribunal Superior do Trabalho', ativo: true },
      { codigo: 'TRT02', nome: 'TRT 2ª Região', ativo: true },
      { codigo: 'TRF01', nome: 'TRF 1ª Região', ativo: true },
    ];

    mockSupabase.order.mockResolvedValue({ data: orgaos, error: null });

    const resultOrgaos = await service.listarOrgaosDisponiveis();

    expect(resultOrgaos).toHaveLength(3);
    expect(resultOrgaos[0].codigo).toBe('TST');
    expect(resultOrgaos[1].codigo).toBe('TRT02');

    // ========================================================================
    // 2. BUSCAR precedentes com filtros
    // ========================================================================
    const input = criarPangeaBuscaInputMock({
      buscaGeral: 'intervalo intrajornada',
      orgaos: ['TST', 'TRT02'],
      tipos: ['SUM'],
    });

    const response = criarPangeaBuscaResponseMock(15);
    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    const resultBusca = await service.buscarPrecedentes(input);

    expect(resultBusca.resultados).toHaveLength(15);
    expect(resultBusca.total).toBe(15);
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        buscaGeral: 'intervalo intrajornada',
        orgaos: ['TST', 'TRT02'],
        tipos: ['SUM'],
        tamanhoPagina: 10000, // Sempre máximo
        pagina: 1,
      }),
    });

    // ========================================================================
    // 3. VERIFICAR agregações retornadas
    // ========================================================================
    expect(resultBusca.aggsEspecies).toBeDefined();
    expect(resultBusca.aggsOrgaos).toBeDefined();
    expect(Array.isArray(resultBusca.aggsEspecies)).toBe(true);
    expect(Array.isArray(resultBusca.aggsOrgaos)).toBe(true);
  });

  it('deve buscar com todos os órgãos quando não especificado', async () => {
    // Arrange
    const orgaos = [
      criarOrgaoDisponivelMock({ codigo: 'TST' }),
      criarOrgaoDisponivelMock({ codigo: 'TRT02' }),
      criarOrgaoDisponivelMock({ codigo: 'TRT15' }),
    ];

    mockSupabase.order.mockResolvedValue({
      data: orgaos.map((o) => ({ ...o, ativo: true })),
      error: null,
    });

    const input = criarPangeaBuscaInputMock({ orgaos: [] });
    const response = criarPangeaBuscaResponseMock(5);

    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    await service.buscarPrecedentes(input);

    // Assert - deve incluir todos os órgãos disponíveis
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        orgaos: expect.arrayContaining(['TST', 'TRT02', 'TRT15']),
      }),
    });
  });

  it('deve buscar com todos os tipos quando não especificado', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock({ tipos: [] });
    const response = criarPangeaBuscaResponseMock(5);

    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    await service.buscarPrecedentes(input);

    // Assert - deve incluir todos os tipos
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        tipos: expect.arrayContaining([
          'SUM',
          'SV',
          'RG',
          'IAC',
          'SIRDR',
          'RR',
          'CT',
          'IRDR',
          'IRR',
          'PUIL',
          'NT',
          'OJ',
        ]),
      }),
    });
  });

  it('deve aplicar múltiplos filtros de busca simultaneamente', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock({
      buscaGeral: 'teste geral',
      todasPalavras: 'palavra1 palavra2',
      quaisquerPalavras: 'palavra3 palavra4',
      semPalavras: 'excluir',
      trechoExato: 'trecho literal',
      atualizacaoDesde: '2024-01-01',
      atualizacaoAte: '2024-12-31',
      cancelados: true,
      nr: '123',
    });

    const response = criarPangeaBuscaResponseMock(2);
    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    await service.buscarPrecedentes(input);

    // Assert - todos os filtros devem ser enviados
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        buscaGeral: 'teste geral',
        todasPalavras: 'palavra1 palavra2',
        quaisquerPalavras: 'palavra3 palavra4',
        semPalavras: 'excluir',
        trechoExato: 'trecho literal',
        atualizacaoDesde: '01/01/2024',
        atualizacaoAte: '31/12/2024',
        cancelados: true,
        nr: '123',
      }),
    });
  });

  it('deve converter ordenação e preservar parâmetros', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock({
      ordenacao: 'ChronologicalDesc',
      buscaGeral: 'teste',
    });

    const response = criarPangeaBuscaResponseMock(1);
    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    await service.buscarPrecedentes(input);

    // Assert
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        ordenacao: 'ChronologicalDesc',
      }),
    });
  });

  it('deve lidar com busca sem resultados', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock({
      buscaGeral: 'termo inexistente xyz123',
    });

    const response = criarPangeaBuscaResponseMock(0);
    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    const result = await service.buscarPrecedentes(input);

    // Assert
    expect(result.resultados).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('deve converter códigos TRT/TRF para formato Pangea', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock({
      orgaos: ['TRT1', 'TRT2', 'TRF3', 'TRT15'],
    });

    const response = criarPangeaBuscaResponseMock(1);
    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    await service.buscarPrecedentes(input);

    // Assert - TRT1 → TRT01, TRT2 → TRT02, TRF3 → TRF03, TRT15 → TRT15
    expect(repository.buscarPrecedentesRaw).toHaveBeenCalledWith({
      filtro: expect.objectContaining({
        orgaos: ['TRT01', 'TRT02', 'TRF03', 'TRT15'],
      }),
    });
  });

  it('deve preservar processosParadigma e highlight nos resultados', async () => {
    // Arrange
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const input = criarPangeaBuscaInputMock();
    const response = criarPangeaBuscaResponseMock(1);

    response.resultados[0].highlight = {
      tese: 'trecho <em>destacado</em>',
    };
    response.resultados[0].processosParadigma = [
      {
        numero: '0000001-00.2024.5.01.0001',
        link: 'https://example.com',
      },
    ];

    (repository.buscarPrecedentesRaw as jest.Mock).mockResolvedValue(response);

    // Act
    const result = await service.buscarPrecedentes(input);

    // Assert
    expect(result.resultados[0].highlight).toBeDefined();
    expect(result.resultados[0].processosParadigma).toHaveLength(1);
    expect(result.resultados[0].processosParadigma?.[0].numero).toBe(
      '0000001-00.2024.5.01.0001'
    );
  });

  it('deve cachear lista de órgãos entre chamadas', async () => {
    // Arrange
    const orgaos = [criarOrgaoDisponivelMock()];
    mockSupabase.order.mockResolvedValue({
      data: orgaos.map((o) => ({ ...o, ativo: true })),
      error: null,
    });

    // Act - primeira chamada
    await service.listarOrgaosDisponiveis();

    // Clear mock
    mockSupabase.from.mockClear();

    // Act - segunda chamada (deve usar cache)
    await service.listarOrgaosDisponiveis();

    // Assert
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('deve validar dados de entrada com Zod antes de buscar', async () => {
    // Arrange - input inválido
    const inputInvalido = {
      tamanhoPagina: 50000, // Excede máximo
    };

    // Act & Assert
    await expect(
      service.buscarPrecedentes(inputInvalido as any)
    ).rejects.toThrow();

    expect(repository.buscarPrecedentesRaw).not.toHaveBeenCalled();
  });
});
