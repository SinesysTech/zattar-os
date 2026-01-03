import { describe, it, expect } from '@jest/globals';
import { converterParaEndereco } from '../../utils';
import { cepSchema, enderecoSchema } from '../../domain';

describe('Endereços Utils', () => {
  describe('converterParaEndereco', () => {
    it('deve converter dados do banco para entidade Endereco', () => {
      // Arrange
      const data = {
        id: 1,
        id_pje: 123,
        entidade_tipo: 'cliente',
        entidade_id: 100,
        trt: '02',
        grau: 'primeiro_grau',
        numero_processo: '0001234-56.2023.5.02.0001',
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        correspondencia: true,
        situacao: 'A',
        ativo: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = converterParaEndereco(data);

      // Assert
      expect(result.id).toBe(1);
      expect(result.entidade_tipo).toBe('cliente');
      expect(result.logradouro).toBe('Rua das Flores');
      expect(result.cep).toBe('01310100');
    });

    it('deve tratar valores null corretamente', () => {
      // Arrange
      const data = {
        id: 1,
        id_pje: null,
        entidade_tipo: 'cliente',
        entidade_id: 100,
        trt: null,
        grau: null,
        numero_processo: null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        correspondencia: null,
        situacao: null,
        ativo: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = converterParaEndereco(data);

      // Assert
      expect(result.id_pje).toBeNull();
      expect(result.trt).toBeNull();
      expect(result.logradouro).toBeNull();
    });

    it('deve tratar valores undefined como null', () => {
      // Arrange
      const data = {
        id: 1,
        entidade_tipo: 'cliente',
        entidade_id: 100,
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
        ativo: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = converterParaEndereco(data);

      // Assert
      expect(result.id_pje).toBeNull();
      expect(result.logradouro).toBeNull();
      expect(result.complemento).toBeNull();
    });
  });

  describe('cepSchema', () => {
    it('deve validar CEP válido (8 dígitos)', () => {
      // Act
      const result = cepSchema.safeParse('01310100');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01310100');
      }
    });

    it('deve remover caracteres não numéricos do CEP', () => {
      // Act
      const result = cepSchema.safeParse('01310-100');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01310100');
      }
    });

    it('deve transformar CEP com pontos e hífen', () => {
      // Act
      const result = cepSchema.safeParse('013.10-100');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('01310100');
      }
    });

    it('deve rejeitar CEP com menos de 8 dígitos', () => {
      // Act
      const result = cepSchema.safeParse('0131010');

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve rejeitar CEP vazio', () => {
      // Act
      const result = cepSchema.safeParse('');

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('enderecoSchema', () => {
    it('deve validar endereço com campos obrigatórios', () => {
      // Arrange
      const endereco = {
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      // Act
      const result = enderecoSchema.safeParse(endereco);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.municipio).toBe('São Paulo');
        expect(result.data.estado).toBe('SP');
        expect(result.data.cep).toBe('01310100');
      }
    });

    it('deve aceitar campos opcionais', () => {
      // Arrange
      const endereco = {
        logradouro: 'Rua das Flores',
        numero: '123',
        complemento: 'Apto 45',
        bairro: 'Centro',
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310100',
      };

      // Act
      const result = enderecoSchema.safeParse(endereco);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logradouro).toBe('Rua das Flores');
        expect(result.data.numero).toBe('123');
      }
    });

    it('deve rejeitar se município estiver vazio', () => {
      // Arrange
      const endereco = {
        municipio: '',
        estado: 'SP',
        cep: '01310100',
      };

      // Act
      const result = enderecoSchema.safeParse(endereco);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve rejeitar se estado tiver menos de 2 caracteres', () => {
      // Arrange
      const endereco = {
        municipio: 'São Paulo',
        estado: 'S',
        cep: '01310100',
      };

      // Act
      const result = enderecoSchema.safeParse(endereco);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve transformar CEP removendo caracteres não numéricos', () => {
      // Arrange
      const endereco = {
        municipio: 'São Paulo',
        estado: 'SP',
        cep: '01310-100',
      };

      // Act
      const result = enderecoSchema.safeParse(endereco);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cep).toBe('01310100');
      }
    });
  });
});
