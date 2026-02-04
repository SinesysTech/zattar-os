import {
  actionCriarProcesso,
  actionAtualizarProcesso,
  actionListarProcessos,
  actionBuscarProcesso,
} from '../../actions';
import { authenticateRequest } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import * as service from '../../service';

// Mocks
jest.mock('@/lib/auth/session');
jest.mock('@/lib/supabase/server');
jest.mock('../../service');

describe('Processos Actions', () => {
  const mockUser = { id: 1, email: 'test@example.com' };
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('Authentication Checks', () => {
    it('actionCriarProcesso deve falhar se não autenticado', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue(null);
      const formData = new FormData();
      formData.append('idPje', '1');
      const result = await actionCriarProcesso(null, formData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unauthorized');
      }
    });

    it('actionAtualizarProcesso deve falhar se não autenticado', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue(null);
      const formData = new FormData();
      const result = await actionAtualizarProcesso(1, null, formData);
      expect(result.success).toBe(false);
    });

    it('actionListarProcessos deve falhar se não autenticado', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue(null);
      const result = await actionListarProcessos({});
      expect(result.success).toBe(false);
    });

    it('actionBuscarProcesso deve falhar se não autenticado', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue(null);
      const result = await actionBuscarProcesso(1);
      expect(result.success).toBe(false);
    });
  });

  describe('Success Cases', () => {
    it('actionCriarProcesso deve chamar serviço com cliente autenticado', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue(mockUser);
      (service.criarProcesso as jest.Mock).mockResolvedValue({ success: true, data: { id: 1 } });

      const formData = new FormData();
      formData.append('idPje', '100');
      formData.append('advogadoId', '1');
      formData.append('numero', '1234');
      formData.append('origem', 'acervo_geral');
      formData.append('trt', 'TRT15');
      formData.append('grau', 'primeiro_grau'); // Corrected enum value
      formData.append('numeroProcesso', '0001234-56.2023.5.15.0001');
      formData.append('descricaoOrgaoJulgador', 'Vara Teste');
      formData.append('classeJudicial', 'Classe Teste');
      formData.append('codigoStatusProcesso', 'ativo');
      formData.append('nomeParteAutora', 'Autor Teste');
      formData.append('nomeParteRe', 'Réu Teste');
      formData.append('dataAutuacao', '2023-01-01');

      const result = await actionCriarProcesso(null, formData);

      if (!result.success) {
        console.error('Validation Errors:', result.errors);
        console.error('Error:', result.error);
      }

      expect(createClient).toHaveBeenCalled();
      expect(service.criarProcesso).toHaveBeenCalledWith(
        expect.anything(),
        mockSupabase
      );
    });
  });
});
