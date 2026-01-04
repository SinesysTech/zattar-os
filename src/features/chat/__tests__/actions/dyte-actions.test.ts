import { createClient } from '@/lib/supabase/server';
import * as dyteClient from '@/lib/dyte/client';
import { generateMeetingTitle } from '@/lib/dyte/utils';
import {
  actionIniciarVideoCall,
  actionIniciarAudioCall,
} from '../../actions/dyte-actions';

// Mocks
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/dyte/client');
jest.mock('@/lib/dyte/utils');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockDyteClient = dyteClient as jest.Mocked<typeof dyteClient>;
const mockGenerateMeetingTitle = generateMeetingTitle as jest.MockedFunction<typeof generateMeetingTitle>;

describe('Dyte Actions - Unit Tests', () => {
  const mockAuthUser = { id: 'auth-123' };
  const mockUser = { id: 1, nome_completo: 'Usuário Teste' };
  const mockMeetingId = 'meeting-123';
  const mockAuthToken = 'token-xyz';

  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockAuthUser }, error: null } as any);
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockUser,
            error: null,
          }),
        }),
      }),
    } as any);
    mockDyteClient.createMeeting.mockResolvedValue(mockMeetingId);
    mockDyteClient.addParticipant.mockResolvedValue(mockAuthToken);
    mockGenerateMeetingTitle.mockReturnValue('Chamada de Vídeo - Sala Teste');
  });

  describe('actionIniciarVideoCall', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionIniciarVideoCall(1, 'Sala Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });

    it('deve iniciar chamada de vídeo com sucesso', async () => {
      const result = await actionIniciarVideoCall(1, 'Sala Teste');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        meetingId: mockMeetingId,
        authToken: mockAuthToken,
      });
      expect(mockDyteClient.createMeeting).toHaveBeenCalledWith('Chamada de Vídeo - Sala Teste');
      expect(mockDyteClient.addParticipant).toHaveBeenCalledWith(
        mockMeetingId,
        'Usuário Teste',
        'group_call_host'
      );
    });

    it('deve gerar título de meeting corretamente', async () => {
      await actionIniciarVideoCall(1, 'Sala Teste');

      expect(mockGenerateMeetingTitle).toHaveBeenCalledWith(1, 'Sala Teste', 'video');
    });

    it('deve retornar erro quando Dyte API falha', async () => {
      mockDyteClient.createMeeting.mockRejectedValue(new Error('Dyte API Error'));

      const result = await actionIniciarVideoCall(1, 'Sala Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Dyte API Error');
    });
  });

  describe('actionIniciarAudioCall', () => {
    it('deve retornar erro quando usuário não autenticado', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

      const result = await actionIniciarAudioCall(1, 'Sala Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuário não autenticado');
    });

    it('deve iniciar chamada de áudio com sucesso', async () => {
      const result = await actionIniciarAudioCall(1, 'Sala Teste');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        meetingId: mockMeetingId,
        authToken: mockAuthToken,
      });
      expect(mockDyteClient.createMeeting).toHaveBeenCalled();
      expect(mockDyteClient.addParticipant).toHaveBeenCalled();
    });

    it('deve gerar título de meeting para áudio', async () => {
      await actionIniciarAudioCall(1, 'Sala Teste');

      expect(mockGenerateMeetingTitle).toHaveBeenCalledWith(1, 'Sala Teste', 'audio');
    });

    it('deve tratar erro genérico (unknown)', async () => {
      mockDyteClient.createMeeting.mockRejectedValue('String error');

      const result = await actionIniciarAudioCall(1, 'Sala Teste');

      expect(result.success).toBe(false);
      expect(result.error).toBe('String error');
    });
  });
});
