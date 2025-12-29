
import {
  criarContrato,
  atualizarContrato,
} from '../../service';
import {
  saveContrato,
  findContratoById,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
} from '../../repository';
import { ok } from '@/lib/types';

// Mock repository
jest.mock('../../repository');

describe('Contratos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarContrato', () => {
    const validContrato = {
      clienteId: 1,
      poloCliente: 'autor' as const,
      tipoContrato: 'consultoria' as const,
      tipoCobranca: 'pro_labore' as const,
      status: 'em_contratacao' as const,
      qtdeParteAutora: 1,
      qtdeParteRe: 1,
    };

    it('deve criar contrato com sucesso', async () => {
      // Arrange
      (clienteExists as jest.Mock).mockResolvedValue(ok(true));
      (saveContrato as jest.Mock).mockResolvedValue(ok({ id: 1, ...validContrato }));

      // Act
      const result = await criarContrato(validContrato);

      // Assert
      expect(result.success).toBe(true);
      expect(saveContrato).toHaveBeenCalled();
    });

    it('deve falhar se cliente nao existir', async () => {
      // Arrange
      (clienteExists as jest.Mock).mockResolvedValue(ok(false));

      // Act
      const result = await criarContrato(validContrato);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('deve validar parte contraria se fornecida', async () => {
      // Arrange
      const input = { ...validContrato, parteContrariaId: 2 };
      (clienteExists as jest.Mock).mockResolvedValue(ok(true));
      (parteContrariaExists as jest.Mock).mockResolvedValue(ok(false)); // Does not exist

      // Act
      const result = await criarContrato(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('atualizarContrato', () => {
    const existingContrato = {
      id: 1,
      clienteId: 1,
      parteContrariaId: null,
      segmentoId: null,
      tipoContrato: 'consultoria' as const,
      tipoCobranca: 'pro_labore' as const,
      poloCliente: 'autor' as const,
      parteAutora: null,
      parteRe: null,
      qtdeParteAutora: 1,
      qtdeParteRe: 1,
      status: 'em_contratacao' as const,
      cadastradoEm: '2024-01-01',
      dataContratacao: '2024-01-01',
      dataAssinatura: null,
      dataDistribuicao: null,
      dataDesistencia: null,
      responsavelId: null,
      createdBy: null,
      observacoes: null,
      dadosAnteriores: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('deve atualizar contrato com sucesso', async () => {
      // Arrange
      const updateData = { observacoes: 'Contrato atualizado' };
      (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));
      (updateContratoRepo as jest.Mock).mockResolvedValue(ok({ ...existingContrato, ...updateData }));

      // Act
      const result = await atualizarContrato(1, updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(updateContratoRepo).toHaveBeenCalled();
    });

    it('deve validar novo cliente ao alterar', async () => {
      // Arrange
      const updateData = { clienteId: 2 };
      (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));
      (clienteExists as jest.Mock).mockResolvedValue(ok(false)); // New client dos NOT exist

      // Act
      const result = await atualizarContrato(1, updateData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});
