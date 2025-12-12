
import {
  criarContrato,
  atualizarContrato,
  buscarContrato,
  listarContratos,
} from '../../service';
import {
  saveContrato,
  findContratoById,
  updateContrato as updateContratoRepo,
  clienteExists,
  parteContrariaExists,
} from '../../repository';
import { ok, err } from '@/lib/types';

// Mock repository
jest.mock('../../repository');

describe('Contratos Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('criarContrato', () => {
    const validContrato = {
      clienteId: 1,
      poloCliente: 'autor',
      areaDireito: 'civil',
      tipoContrato: 'consultoria',
      tipoCobranca: 'pro_labore',
    };

    it('deve criar contrato com sucesso', async () => {
      // Arrange
      (clienteExists as jest.Mock).mockResolvedValue(ok(true));
      (saveContrato as jest.Mock).mockResolvedValue(ok({ id: 1, ...validContrato }));

      // Act
      const result = await criarContrato(validContrato as any);

      // Assert
      expect(result.success).toBe(true);
      expect(saveContrato).toHaveBeenCalled();
    });

    it('deve falhar se cliente nao existir', async () => {
      // Arrange
      (clienteExists as jest.Mock).mockResolvedValue(ok(false));

      // Act
      const result = await criarContrato(validContrato as any);

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
      (parteContrariaExists as jest.Mock).mockResolvedValue(ok(false)); // Dos not exist

      // Act
      const result = await criarContrato(input as any);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('atualizarContrato', () => {
    const existingContrato = { id: 1, clienteId: 1, parteContrariaId: null };

    it('deve atualizar contrato com sucesso', async () => {
      // Arrange
      const updateData = { valor: 2000 };
      (findContratoById as jest.Mock).mockResolvedValue(ok(existingContrato));
      (updateContratoRepo as jest.Mock).mockResolvedValue(ok({ ...existingContrato, ...updateData }));

      // Act
      const result = await atualizarContrato(1, updateData as any);

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
      const result = await atualizarContrato(1, updateData as any);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.code).toBe('NOT_FOUND');
    });
  });
});
