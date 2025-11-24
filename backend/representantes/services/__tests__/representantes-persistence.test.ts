/**
 * Testes unitários para o serviço de persistência de representantes
 */

import { jest } from '@jest/globals';
import { createClient } from '@/backend/utils/supabase/server-client';
import { converterParaEndereco } from '@/backend/enderecos/services/enderecos-persistence.service';
import {
  validarCPF,
  validarCNPJ,
  validarOAB,
  validarEmail,
  criarRepresentante,
  atualizarRepresentante,
  buscarRepresentantePorId,
  deletarRepresentante,
  upsertRepresentantePorIdPessoa,
  buscarRepresentantesPorParte,
  buscarRepresentantesPorOAB,
  buscarRepresentantesPorProcesso,
  listarRepresentantes,
  buscarRepresentanteComEndereco,
  listarRepresentantesComEndereco,
} from '../representantes-persistence.service';

// Mock do Supabase
jest.mock('@/backend/utils/supabase/server-client');
jest.mock('@/backend/enderecos/services/enderecos-persistence.service');

// Mock do cliente Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  count: jest.fn(),
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

// Mock do conversor de endereço
(converterParaEndereco as jest.Mock).mockImplementation((data) => ({
  id: data.id,
  ...data,
}));

// Fixtures de dados de teste
// CPF e CNPJ válidos segundo os algoritmos oficiais
const representantePFValido = {
  id_pessoa_pje: 12345,
  parte_tipo: 'cliente' as const,
  parte_id: 1,
  trt: '01',
  grau: '1',
  numero_processo: '0000123-45.2023.5.01.0001',
  tipo_pessoa: 'pf' as const,
  nome: 'João Silva',
  cpf: '52998224725', // CPF válido conhecido para testes
  numero_oab: 'MG123456',
  email: 'joao@example.com',
  ddd_residencial: '31',
  numero_residencial: '99999999',
  ordem: 1,
};

const representantePJValido = {
  id_pessoa_pje: 67890,
  parte_tipo: 'parte_contraria' as const,
  parte_id: 2,
  trt: '02',
  grau: '2',
  numero_processo: '0000456-78.2023.5.02.0002',
  tipo_pessoa: 'pj' as const,
  nome: 'Empresa XYZ Ltda',
  cnpj: '11222333000181', // CNPJ válido conhecido para testes
  razao_social: 'Empresa XYZ Ltda',
  email: 'contato@empresa.com',
  ddd_comercial: '11',
  numero_comercial: '88888888',
  ordem: 2,
};

const representanteInvalido = {
  id_pessoa_pje: 99999,
  parte_tipo: 'cliente' as const,
  parte_id: 3,
  tipo_pessoa: 'pf' as const,
  nome: 'Nome Inválido',
  cpf: '11111111111', // CPF inválido (sequência)
};

describe('representantes-persistence.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Funções de Validação', () => {
    describe('validarCPF', () => {
      it('deve validar CPF válido', () => {
        expect(validarCPF('52998224725')).toBe(true);
        expect(validarCPF('529.982.247-25')).toBe(true); // com formatação
        expect(validarCPF('11144477735')).toBe(true); // outro CPF válido
      });

      it('deve rejeitar CPF com dígitos errados', () => {
        expect(validarCPF('12345678900')).toBe(false);
      });

      it('deve rejeitar CPF sequência', () => {
        expect(validarCPF('11111111111')).toBe(false);
        expect(validarCPF('00000000000')).toBe(false);
      });

      it('deve rejeitar CPF com tamanho errado', () => {
        expect(validarCPF('123456789')).toBe(false);
        expect(validarCPF('123456789012')).toBe(false);
      });
    });

    describe('validarCNPJ', () => {
      it('deve validar CNPJ válido', () => {
        expect(validarCNPJ('11222333000181')).toBe(true);
        expect(validarCNPJ('11.222.333/0001-81')).toBe(true); // com formatação
        expect(validarCNPJ('11444777000161')).toBe(true); // outro CNPJ válido
      });

      it('deve rejeitar CNPJ com dígitos errados', () => {
        expect(validarCNPJ('12345678000124')).toBe(false);
      });

      it('deve rejeitar CNPJ sequência', () => {
        expect(validarCNPJ('00000000000000')).toBe(false);
        expect(validarCNPJ('11111111111111')).toBe(false);
      });

      it('deve rejeitar CNPJ com tamanho errado', () => {
        expect(validarCNPJ('1234567800012')).toBe(false);
        expect(validarCNPJ('123456780001234')).toBe(false);
      });
    });

    describe('validarOAB', () => {
      it('deve validar formato OAB válido', () => {
        expect(validarOAB('MG123456')).toBe(true);
        expect(validarOAB('SP12345')).toBe(true);
      });

      it('deve rejeitar UF inválida', () => {
        expect(validarOAB('XX123456')).toBe(false);
      });

      it('deve rejeitar formato errado', () => {
        expect(validarOAB('MG12')).toBe(false); // muito curto
        expect(validarOAB('123456MG')).toBe(false); // ordem errada
        expect(validarOAB('MG1234567')).toBe(false); // muito longo
      });
    });

    describe('validarEmail', () => {
      it('deve validar email válido', () => {
        expect(validarEmail('teste@example.com')).toBe(true);
        expect(validarEmail('user.name@domain.co.uk')).toBe(true);
      });

      it('deve rejeitar email sem @', () => {
        expect(validarEmail('testeexample.com')).toBe(false);
      });

      it('deve rejeitar email sem domínio', () => {
        expect(validarEmail('teste@')).toBe(false);
      });

      it('deve rejeitar formato inválido', () => {
        expect(validarEmail('teste@.com')).toBe(false);
        expect(validarEmail('@example.com')).toBe(false);
      });
    });
  });

  describe('Operações CRUD', () => {
    describe('criarRepresentante', () => {
      it('deve criar representante PF com CPF válido', async () => {
        mockSupabase.single.mockResolvedValue({ data: { ...representantePFValido, id: 1 } });

        const result = await criarRepresentante(representantePFValido);

        expect(result.sucesso).toBe(true);
        expect(result.representante?.tipo_pessoa).toBe('pf');
        expect(mockSupabase.from).toHaveBeenCalledWith('representantes');
        expect(mockSupabase.insert).toHaveBeenCalledWith(representantePFValido);
      });

      it('deve criar representante PJ com CNPJ válido', async () => {
        mockSupabase.single.mockResolvedValue({ data: { ...representantePJValido, id: 2 } });

        const result = await criarRepresentante(representantePJValido);

        expect(result.sucesso).toBe(true);
        expect(result.representante?.tipo_pessoa).toBe('pj');
      });

      it('deve rejeitar criação com CPF inválido', async () => {
        const result = await criarRepresentante(representanteInvalido);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('CPF inválido');
      });

      it('deve rejeitar criação com campos obrigatórios faltando', async () => {
        const params = { ...representantePFValido };
        delete params.nome;

        const result = await criarRepresentante(params);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('Campos obrigatórios não informados');
      });

      it('deve rejeitar criação sem trt/grau/numero_processo', async () => {
        const params = { ...representantePFValido };
        delete params.trt;
        delete params.grau;
        delete params.numero_processo;

        const result = await criarRepresentante(params);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('Campos trt, grau e numero_processo são obrigatórios');
      });
    });

    describe('atualizarRepresentante', () => {
      it('deve atualizar campos permitidos', async () => {
        const currentData = { ...representantePFValido, id: 1, dados_anteriores: null };
        mockSupabase.single.mockResolvedValueOnce({ data: currentData });
        mockSupabase.single.mockResolvedValueOnce({ data: { ...currentData, nome: 'João Silva Atualizado' } });

        const result = await atualizarRepresentante({ id: 1, nome: 'João Silva Atualizado' });

        expect(result.sucesso).toBe(true);
        expect(result.representante?.nome).toBe('João Silva Atualizado');
        expect(mockSupabase.update).toHaveBeenCalledWith({
          nome: 'João Silva Atualizado',
          dados_anteriores: currentData,
        });
      });

      it('deve rejeitar alteração de campos imutáveis', async () => {
        const result = await atualizarRepresentante({ id: 1, tipo_pessoa: 'pj' });

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('Campos tipo_pessoa, parte_tipo e parte_id não podem ser alterados');
      });

      it('deve rejeitar atualização com CPF inválido', async () => {
        const result = await atualizarRepresentante({ id: 1, cpf: '11111111111' });

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('CPF inválido');
      });

      it('deve popular dados_anteriores corretamente', async () => {
        const currentData = { ...representantePFValido, id: 1 };
        mockSupabase.single.mockResolvedValueOnce({ data: currentData });
        mockSupabase.single.mockResolvedValueOnce({ data: { ...currentData, email: 'novo@email.com' } });

        await atualizarRepresentante({ id: 1, email: 'novo@email.com' });

        expect(mockSupabase.update).toHaveBeenCalledWith({
          email: 'novo@email.com',
          dados_anteriores: currentData,
        });
      });
    });

    describe('buscarRepresentantePorId', () => {
      it('deve retornar representante PF existente', async () => {
        const data = { ...representantePFValido, id: 1 };
        mockSupabase.single.mockResolvedValue({ data });

        const result = await buscarRepresentantePorId(1);

        expect(result?.tipo_pessoa).toBe('pf');
        expect(result?.cpf).toBe('12345678901');
      });

      it('deve retornar null para ID inexistente', async () => {
        mockSupabase.single.mockResolvedValue({ error: { code: 'PGRST116' } });

        const result = await buscarRepresentantePorId(999);

        expect(result).toBeNull();
      });
    });

    describe('deletarRepresentante', () => {
      it('deve deletar representante existente', async () => {
        mockSupabase.delete.mockResolvedValue({ error: null });

        const result = await deletarRepresentante(1);

        expect(result.sucesso).toBe(true);
      });

      it('deve retornar erro para representante inexistente', async () => {
        mockSupabase.delete.mockResolvedValue({ error: { code: 'PGRST116' } });

        const result = await deletarRepresentante(999);

        expect(result.sucesso).toBe(false);
        expect(result.erro).toBe('Representante não encontrado');
      });
    });
  });

  describe('Upsert', () => {
    describe('upsertRepresentantePorIdPessoa', () => {
      it('deve criar novo representante se não existir', async () => {
        mockSupabase.maybeSingle.mockResolvedValue({ data: null });
        mockSupabase.single.mockResolvedValue({ data: { ...representantePFValido, id: 1 } });

        const result = await upsertRepresentantePorIdPessoa(representantePFValido);

        expect(result.sucesso).toBe(true);
        expect(mockSupabase.insert).toHaveBeenCalled();
      });

      it('deve atualizar representante existente', async () => {
        mockSupabase.maybeSingle.mockResolvedValue({ data: { id: 1 } });
        mockSupabase.single.mockResolvedValueOnce({ data: { ...representantePFValido, id: 1 } });
        mockSupabase.single.mockResolvedValueOnce({ data: { ...representantePFValido, id: 1, nome: 'Atualizado' } });

        const result = await upsertRepresentantePorIdPessoa({ ...representantePFValido, nome: 'Atualizado' });

        expect(result.sucesso).toBe(true);
        expect(mockSupabase.update).toHaveBeenCalled();
      });

      it('deve buscar pela chave composta completa', async () => {
        mockSupabase.maybeSingle.mockResolvedValue({ data: null });

        await upsertRepresentantePorIdPessoa(representantePFValido);

        expect(mockSupabase.eq).toHaveBeenCalledWith('id_pessoa_pje', 12345);
        expect(mockSupabase.eq).toHaveBeenCalledWith('parte_id', 1);
        expect(mockSupabase.eq).toHaveBeenCalledWith('parte_tipo', 'cliente');
        expect(mockSupabase.eq).toHaveBeenCalledWith('trt', '01');
        expect(mockSupabase.eq).toHaveBeenCalledWith('grau', '1');
        expect(mockSupabase.eq).toHaveBeenCalledWith('numero_processo', '0000123-45.2023.5.01.0001');
      });
    });
  });

  describe('Queries Especializadas', () => {
    describe('buscarRepresentantesPorParte', () => {
      it('deve retornar representantes da parte', async () => {
        const data = [{ ...representantePFValido, id: 1 }];
        mockSupabase.order.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data, error: null });

        const result = await buscarRepresentantesPorParte({ parte_tipo: 'cliente', parte_id: 1 });

        expect(result).toHaveLength(1);
        expect(result[0].tipo_pessoa).toBe('pf');
      });

      it('deve filtrar por trt/grau se fornecido', async () => {
        mockSupabase.order.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [], error: null });

        await buscarRepresentantesPorParte({ parte_tipo: 'cliente', parte_id: 1, trt: '01', grau: '1' });

        expect(mockSupabase.eq).toHaveBeenCalledWith('trt', '01');
        expect(mockSupabase.eq).toHaveBeenCalledWith('grau', '1');
      });
    });

    describe('buscarRepresentantesPorOAB', () => {
      it('deve retornar representantes com OAB', async () => {
        const data = [{ ...representantePFValido, id: 1 }];
        mockSupabase.eq.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data, error: null });

        const result = await buscarRepresentantesPorOAB({ numero_oab: 'MG123456' });

        expect(result).toHaveLength(1);
      });
    });

    describe('buscarRepresentantesPorProcesso', () => {
      it('deve retornar representantes do processo ordenados', async () => {
        const data = [representantePFValido, representantePJValido];
        mockSupabase.order.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data, error: null });

        const result = await buscarRepresentantesPorProcesso({
          numero_processo: '0000123-45.2023.5.01.0001',
          trt: '01',
          grau: '1'
        });

        expect(result).toHaveLength(2);
        expect(mockSupabase.order).toHaveBeenCalledWith('parte_tipo', { ascending: true });
        expect(mockSupabase.order).toHaveBeenCalledWith('ordem', { ascending: true });
      });
    });

    describe('listarRepresentantes', () => {
      it('deve aplicar paginação', async () => {
        mockSupabase.range.mockReturnThis();
        mockSupabase.order.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 0 });

        const result = await listarRepresentantes({ pagina: 2, limite: 10 });

        expect(result.pagina).toBe(2);
        expect(result.limite).toBe(10);
        expect(mockSupabase.range).toHaveBeenCalledWith(10, 19);
      });

      it('deve aplicar filtros', async () => {
        mockSupabase.range.mockReturnThis();
        mockSupabase.order.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.or.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data: [], error: null, count: 0 });

        await listarRepresentantes({
          tipo_pessoa: 'pf',
          busca: 'João',
          numero_oab: 'MG123456'
        });

        expect(mockSupabase.eq).toHaveBeenCalledWith('tipo_pessoa', 'pf');
        expect(mockSupabase.or).toHaveBeenCalledWith('nome.ilike.%João%,cpf.ilike.%João%,cnpj.ilike.%João%,email.ilike.%João%');
      });
    });
  });

  describe('Queries com JOIN', () => {
    describe('buscarRepresentanteComEndereco', () => {
      it('deve retornar representante com endereço populado', async () => {
        const enderecoData = { id: 1, logradouro: 'Rua A' };
        const data = { ...representantePFValido, id: 1, endereco: enderecoData };
        mockSupabase.single.mockResolvedValue({ data });

        const result = await buscarRepresentanteComEndereco(1);

        expect(result?.endereco?.logradouro).toBe('Rua A');
        expect(converterParaEndereco).toHaveBeenCalledWith(enderecoData);
      });

      it('deve retornar representante com endereco=null se não tem endereço', async () => {
        const data = { ...representantePFValido, id: 1, endereco: null };
        mockSupabase.single.mockResolvedValue({ data });

        const result = await buscarRepresentanteComEndereco(1);

        expect(result?.endereco).toBeNull();
      });
    });

    describe('listarRepresentantesComEndereco', () => {
      it('deve aplicar paginação e filtros com JOIN', async () => {
        const data = [{ ...representantePFValido, id: 1, endereco: null }];
        mockSupabase.range.mockReturnThis();
        mockSupabase.order.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.ilike.mockReturnThis();
        mockSupabase.select.mockResolvedValue({ data, error: null, count: 1 });

        const result = await listarRepresentantesComEndereco({ pagina: 1, limite: 10, tipo_pessoa: 'pf' });

        expect(result.representantes).toHaveLength(1);
        expect(result.total).toBe(1);
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve mapear erro de constraint UNIQUE', async () => {
      mockSupabase.single.mockResolvedValue({ error: { code: '23505' } });

      const result = await criarRepresentante(representantePFValido);

      expect(result.erro).toBe('Representante já cadastrado para esta parte neste processo');
    });

    it('deve mapear erro de FK violation', async () => {
      mockSupabase.single.mockResolvedValue({ error: { code: '23503' } });

      const result = await criarRepresentante(representantePFValido);

      expect(result.erro).toBe('Parte não encontrada');
    });

    it('deve mapear erro de NOT NULL violation', async () => {
      mockSupabase.single.mockResolvedValue({ error: { code: '23502' } });

      const result = await criarRepresentante(representantePFValido);

      expect(result.erro).toBe('Campo obrigatório não informado');
    });
  });

  describe('Casos Edge', () => {
    it('deve aceitar representante sem OAB (defensor público)', async () => {
      const params = { ...representantePFValido };
      delete params.numero_oab;
      mockSupabase.single.mockResolvedValue({ data: { ...params, id: 1 } });

      const result = await criarRepresentante(params);

      expect(result.sucesso).toBe(true);
    });

    it('deve validar apenas CNPJ para PJ, ignorando CPF', async () => {
      const params = { ...representantePJValido, cpf: '11111111111' }; // CPF inválido, mas é PJ
      mockSupabase.single.mockResolvedValue({ data: { ...params, id: 2 } });

      const result = await criarRepresentante(params);

      expect(result.sucesso).toBe(true);
    });

    it('deve aceitar representante sem endereço', async () => {
      const params = { ...representantePFValido, endereco_id: null };
      mockSupabase.single.mockResolvedValue({ data: { ...params, id: 1 } });

      const result = await criarRepresentante(params);

      expect(result.sucesso).toBe(true);
    });

    it('deve permitir representante em múltiplos processos', async () => {
      // Mesmo id_pessoa_pje, mas processos diferentes
      const params1 = { ...representantePFValido };
      const params2 = { ...representantePFValido, numero_processo: '0000456-78.2023.5.01.0002' };

      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...params1, id: 1 } });
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null });
      mockSupabase.single.mockResolvedValueOnce({ data: { ...params2, id: 2 } });

      const result1 = await upsertRepresentantePorIdPessoa(params1);
      const result2 = await upsertRepresentantePorIdPessoa(params2);

      expect(result1.sucesso).toBe(true);
      expect(result2.sucesso).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2);
    });
  });
});