import {
  saveComunicacoesBatch,
} from '../../repository';
import { createServiceClient } from '@/lib/supabase/service-client';

// Mock Supabase
jest.mock('@/lib/supabase/service-client');

describe('Comunica CNJ Repository', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('saveComunicacoesBatch', () => {
    const mockComunicacoes: any[] = [
      { hash: 'hash1', numeroProcesso: '123' },
      { hash: 'hash2', numeroProcesso: '456' },
    ];

    it('deve inserir comunicações em lote com sucesso', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [{ hash: 'hash1' }, { hash: 'hash2' }],
        error: null,
      });

      const result = await saveComunicacoesBatch(mockComunicacoes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inseridas).toBe(2);
        expect(result.data.duplicadas).toBe(0);
      }
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ onConflict: 'hash', ignoreDuplicates: true })
      );
    });

    it('deve identificar duplicadas corretamente', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [{ hash: 'hash1' }],
        error: null,
      });

      const result = await saveComunicacoesBatch(mockComunicacoes);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inseridas).toBe(1);
        expect(result.data.duplicadas).toBe(1);
      }
    });

    it('deve retornar erro se a query falhar', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: '500' },
      });

      const result = await saveComunicacoesBatch(mockComunicacoes);

      expect(result.success).toBe(false);
    });

    it('deve lidar com lista vazia', async () => {
      const result = await saveComunicacoesBatch([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inseridas).toBe(0);
      }
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
