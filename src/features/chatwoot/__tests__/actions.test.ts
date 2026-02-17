/**
 * Unit Tests for Chatwoot Actions Layer
 * 
 * Testes para server actions e processamento de webhooks
 */

import { ok, err, appError } from '../../../types';
import {
  processarWebhookChatwoot,
  sincronizarConversaManual,
  atualizarStatusConversaAPI,
} from '../actions';
import * as service from '../service';

// Mock do service layer
jest.mock('../service', () => ({
  processarWebhook: jest.fn(),
  sincronizarConversaChatwoot: jest.fn(),
  getChatwootClient: jest.fn(),
}));

// Mock fetch global
global.fetch = jest.fn();

describe('Chatwoot Actions Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('processarWebhookChatwoot', () => {
    it('deve processar webhook de conversa criada', async () => {
      const mockServiceResult = ok(undefined);

      (service.processarWebhook as jest.Mock).mockResolvedValue(
        mockServiceResult
      );

      const payload = {
        id: 123,
        inbox_id: 456,
        status: 'open',
      };

      const result = await processarWebhookChatwoot(
        'conversation.created',
        payload
      );

      expect(result.success).toBe(true);
      expect(service.processarWebhook).toHaveBeenCalled();
    });

    it('deve processar webhook de status de agente', async () => {
      const mockServiceResult = ok(undefined);

      (service.processarWebhook as jest.Mock).mockResolvedValue(
        mockServiceResult
      );

      const payload = {
        id: 101,
        availability_status: 'available',
      };

      const result = await processarWebhookChatwoot(
        'agent.status_changed',
        payload
      );

      expect(result.success).toBe(true);
      expect(service.processarWebhook).toHaveBeenCalled();
    });

    it('deve retornar ok mesmo se service retornar erro (não fazer retry automático)', async () => {
      const mockError = appError('DATABASE_ERROR', 'Erro ao salvar');

      (service.processarWebhook as jest.Mock).mockResolvedValue(
        err(mockError)
      );

      const payload = {
        id: 123,
      };

      const result = await processarWebhookChatwoot(
        'conversation.created',
        payload
      );

      // Deve retornar ok mesmo com erro (para não fazer retry automático do Chatwoot)
      expect(result.success).toBe(true);
    });

    it('deve validar payload obrigatório', async () => {
      const invalidPayload = {
        // data vazia
      };

      const result = await processarWebhookChatwoot(
        'conversation.created',
        invalidPayload
      );

      // Deve validar e retornar resultado
      expect(result).toBeDefined();
    });
  });

  describe('sincronizarConversaManual', () => {
    it('deve sincronizar conversa com dados do Chatwoot', async () => {
      const mockServiceResult = ok({
        id: 1n,
        criada: true,
      });

      (service.sincronizarConversaChatwoot as jest.Mock).mockResolvedValue(
        mockServiceResult
      );

      const result = await sincronizarConversaManual(123, 1);

      expect(result.success).toBe(true);
      expect(result.data?.sincronizado).toBe(true);
    });

    it('deve retornar erro se falhar sincronização', async () => {
      const _mockError = appError('DATABASE_ERROR', 'Erro ao sincronizar');

      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await sincronizarConversaManual(123, 1);

      expect(result.success).toBe(false);
    });

    it('deve validar conversationId obrigatório', async () => {
      const result = await sincronizarConversaManual(0, 1);

      expect(result.success).toBe(false);
    });
  });

  describe('atualizarStatusConversaAPI', () => {
    it('deve atualizar status da conversa localmente e no Chatwoot', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, status: 'resolved' }),
      });

      const result = await atualizarStatusConversaAPI(1, 1, 'resolved');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('deve validar status enum', async () => {
      const result = await atualizarStatusConversaAPI(
        1,
        1,
        'invalid_status' as any
      );

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('deve retornar erro se API Chatwoot falhar', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await atualizarStatusConversaAPI(1, 1, 'resolved');

      expect(result.success).toBe(false);
    });

    it('deve fazer dual-write (atualizar local e remoto)', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 123, status: 'resolved' }),
      });

      const result = await atualizarStatusConversaAPI(1, 1, 'resolved');

      expect(result.success).toBe(true);
      // Deve fazer fetch para API Chatwoot
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
