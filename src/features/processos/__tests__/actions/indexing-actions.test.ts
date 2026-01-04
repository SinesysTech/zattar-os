import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionIndexarPecaProcesso,
  actionIndexarAndamentoProcesso,
  actionReindexarProcesso,
} from '../../actions/indexing-actions';
import { authenticateRequest } from '@/lib/auth';
import { after } from 'next/server';
import * as indexingService from '@/features/ai/services/indexing.service';
import * as extractionService from '@/features/ai/services/extraction.service';
import { criarUsuarioMock, criarPecaMock, criarAndamentoMock, criarEmbeddingMock } from '../fixtures';

jest.mock('@/lib/auth');
jest.mock('next/server');
jest.mock('@/features/ai/services/indexing.service');
jest.mock('@/features/ai/services/extraction.service');
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}));

describe('actionIndexarPecaProcesso', () => {
  const mockUser = criarUsuarioMock();
  const mockPeca = criarPecaMock();

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    (extractionService.isContentTypeSupported as jest.Mock).mockReturnValue(true);
    (indexingService.indexDocument as jest.Mock).mockResolvedValue({ success: true });

    // Mock de after() para capturar callback e executá-lo imediatamente
    (after as jest.Mock).mockImplementation((callback: () => Promise<void>) => {
      callback(); // Executar imediatamente para testar
    });
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve aceitar tipos de conteúdo suportados', async () => {
    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      'application/pdf'
    );

    expect(extractionService.isContentTypeSupported).toHaveBeenCalledWith('application/pdf');
    expect(result.success).toBe(true);
  });

  it('deve permitir tipos não suportados com warning', async () => {
    (extractionService.isContentTypeSupported as jest.Mock).mockReturnValue(false);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      'application/zip'
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('não suportado')
    );
    expect(result.success).toBe(true);
    consoleWarnSpy.mockRestore();
  });

  it('deve disparar indexação assíncrona com after()', async () => {
    await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    expect(after).toHaveBeenCalled();
    expect(indexingService.indexDocument).toHaveBeenCalled();
  });

  it('deve passar parâmetros corretos para indexDocument', async () => {
    await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      'application/pdf'
    );

    expect(indexingService.indexDocument).toHaveBeenCalledWith({
      entity_type: 'processo_peca',
      entity_id: mockPeca.id,
      parent_id: mockPeca.processo_id,
      storage_provider: 'backblaze',
      storage_key: mockPeca.storage_key,
      content_type: 'application/pdf',
      metadata: expect.objectContaining({
        processo_id: mockPeca.processo_id,
        indexed_by: mockUser.id,
      }),
    });
  });

  it('deve incluir indexed_by no metadata', async () => {
    await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    const callArgs = (indexingService.indexDocument as jest.Mock).mock.calls[0][0];
    expect(callArgs.metadata.indexed_by).toBe(mockUser.id);
  });

  it('deve tratar erros dentro do after()', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (indexingService.indexDocument as jest.Mock).mockRejectedValue(
      new Error('Erro ao indexar')
    );

    const result = await actionIndexarPecaProcesso(
      mockPeca.processo_id,
      mockPeca.id,
      mockPeca.storage_key,
      mockPeca.content_type
    );

    // A action retorna sucesso, mas loga erro internamente
    expect(result.success).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('actionIndexarAndamentoProcesso', () => {
  const mockUser = criarUsuarioMock();
  const mockAndamento = criarAndamentoMock();

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    (indexingService.indexText as jest.Mock).mockResolvedValue({ success: true });

    (after as jest.Mock).mockImplementation((callback: () => Promise<void>) => {
      callback();
    });
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve indexar texto puro de andamento', async () => {
    await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    expect(indexingService.indexText).toHaveBeenCalledWith(
      mockAndamento.descricao,
      {
        entity_type: 'processo_andamento',
        entity_id: mockAndamento.id,
        parent_id: mockAndamento.processo_id,
        metadata: expect.objectContaining({
          processo_id: mockAndamento.processo_id,
          indexed_by: mockUser.id,
        }),
      }
    );
  });

  it('deve usar after() para processamento assíncrono', async () => {
    await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    expect(after).toHaveBeenCalled();
  });

  it('deve incluir processo_id no metadata', async () => {
    await actionIndexarAndamentoProcesso(
      mockAndamento.processo_id,
      mockAndamento.id,
      mockAndamento.descricao
    );

    const callArgs = (indexingService.indexText as jest.Mock).mock.calls[0][1];
    expect(callArgs.metadata.processo_id).toBe(mockAndamento.processo_id);
  });
});

describe('actionReindexarProcesso', () => {
  const mockUser = criarUsuarioMock();
  const mockEmbeddings = [
    criarEmbeddingMock({ id: 1, entity_id: 1 }),
    criarEmbeddingMock({ id: 2, entity_id: 2 }),
    criarEmbeddingMock({ id: 3, entity_id: 3 }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
    (indexingService.deleteEmbeddingsByParent as jest.Mock).mockResolvedValue({ success: true });
    (indexingService.indexDocument as jest.Mock).mockResolvedValue({ success: true });

    (after as jest.Mock).mockImplementation((callback: () => Promise<void>) => {
      callback();
    });
  });

  it('deve retornar erro quando não autenticado', async () => {
    (authenticateRequest as jest.Mock).mockResolvedValue(null);

    const result = await actionReindexarProcesso(100);

    expect(result).toEqual({
      success: false,
      error: 'Não autenticado',
    });
  });

  it('deve remover embeddings antigos', async () => {
    const processoId = 100;

    await actionReindexarProcesso(processoId);

    expect(indexingService.deleteEmbeddingsByParent).toHaveBeenCalledWith(processoId);
  });

  it('deve buscar peças indexadas anteriormente', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const mockDb = createClient();

    await actionReindexarProcesso(100);

    expect(mockDb.from).toHaveBeenCalledWith('embeddings');
  });

  it('deve retornar mensagem de sucesso', async () => {
    const result = await actionReindexarProcesso(100);

    expect(result.success).toBe(true);
    expect(result.message).toContain('agendada');
  });

  it('deve tratar erros de reindexação', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (indexingService.deleteEmbeddingsByParent as jest.Mock).mockRejectedValue(
      new Error('Erro ao deletar embeddings')
    );

    const result = await actionReindexarProcesso(100);

    expect(result.success).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
