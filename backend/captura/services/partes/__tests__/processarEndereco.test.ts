import { jest } from '@jest/globals';
import { validarEnderecoPJE, processarEndereco, processarEnderecoRepresentante, vincularEnderecoNaEntidade } from '../partes-capture.service';

// Mock dependencies
jest.mock('@/backend/enderecos/services/enderecos-persistence.service');
jest.mock('@/backend/utils/supabase/server-client');

const mockUpsertEnderecoPorIdPje = jest.mocked(
  (await import('@/backend/enderecos/services/enderecos-persistence.service')).upsertEnderecoPorIdPje
);
const mockCreateClient = jest.mocked(
  (await import('@/backend/utils/supabase/server-client')).createClient
);

// Type definitions (inferred from usage)
interface EnderecoPJE {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  idMunicipio?: number;
  municipio?: string;
  municipioIbge?: string;
  estado?: { id?: number; sigla?: string; descricao?: string } | string;
  pais?: { id?: number; codigo?: string; descricao?: string } | string;
  nroCep?: string;
  classificacoesEndereco?: { codigo?: string; descricao?: string }[];
  correspondencia?: boolean;
  situacao?: string;
  idUsuarioCadastrador?: number;
  dtAlteracao?: string;
}

interface PartePJE {
  idParte: number;
  nome: string;
  tipoDocumento: 'CPF' | 'CNPJ';
  numeroDocumento: string;
  tipoParte: string;
  polo: 'ATIVO' | 'PASSIVO' | 'OUTROS';
  principal: boolean;
  emails: string[];
  telefones: { ddd?: string; numero?: string }[];
  dadosCompletos?: {
    endereco?: EnderecoPJE;
    [key: string]: unknown;
  };
  representantes?: RepresentantePJE[];
}

interface RepresentantePJE {
  idPessoa: number;
  nome: string;
  tipoDocumento: 'CPF' | 'CNPJ';
  numeroDocumento: string;
  numeroOAB?: string;
  situacaoOAB?: string;
  tipo?: string;
  email?: string;
  telefones?: { ddd?: string; numero?: string }[];
  dadosCompletos?: {
    endereco?: EnderecoPJE;
    [key: string]: unknown;
  };
}

interface ProcessoParaCaptura {
  id: number;
  numero_processo: string;
  id_pje: number;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
}

// Test fixtures
const mockEnderecoPJECompleto: EnderecoPJE = {
  id: 456,
  logradouro: 'Rua das Flores',
  numero: '123',
  complemento: 'Apto 45',
  bairro: 'Centro',
  idMunicipio: 1234,
  municipio: 'São Paulo',
  municipioIbge: '3550308',
  estado: { id: 25, sigla: 'SP', descricao: 'São Paulo' },
  pais: { id: 1, codigo: 'BR', descricao: 'Brasil' },
  nroCep: '01234567',
  classificacoesEndereco: [{ codigo: 'RES', descricao: 'Residencial' }],
  correspondencia: true,
  situacao: 'A',
  idUsuarioCadastrador: 789,
  dtAlteracao: '2023-01-01T00:00:00Z',
};

const mockEnderecoPJEIncompleto: EnderecoPJE = {
  id: 457,
  // Missing logradouro, municipio, cep
};

const mockEnderecoPJEInvalido: EnderecoPJE = {
  id: 0,
  logradouro: 'Rua B',
};

const mockPartePJE: PartePJE = {
  idParte: 123,
  nome: 'João Silva',
  tipoDocumento: 'CPF',
  numeroDocumento: '12345678901',
  tipoParte: 'REU',
  polo: 'PASSIVO',
  principal: true,
  emails: ['joao@example.com'],
  telefones: [{ ddd: '11', numero: '999999999' }],
  dadosCompletos: {
    endereco: mockEnderecoPJECompleto,
  },
};

const mockParteSemEndereco: PartePJE = {
  ...mockPartePJE,
  dadosCompletos: {},
};

const mockRepresentantePJE: RepresentantePJE = {
  idPessoa: 234,
  nome: 'Maria Advogada',
  tipoDocumento: 'CPF',
  numeroDocumento: '98765432100',
  numeroOAB: '12345/SP',
  situacaoOAB: 'ATIVA',
  tipo: 'ADVOGADO',
  email: 'maria@example.com',
  telefones: [{ ddd: '11', numero: '888888888' }],
  dadosCompletos: {
    endereco: mockEnderecoPJECompleto,
  },
};

const mockProcessoParaCaptura: ProcessoParaCaptura = {
  id: 1,
  numero_processo: '0000123-45.2023.5.03.0001',
  id_pje: 12345,
  trt: '03',
  grau: 'primeiro_grau',
};

describe('validarEnderecoPJE', () => {
  it('should validate complete address', () => {
    const endereco: EnderecoPJE = { id: 1, logradouro: 'Rua A', municipio: 'SP', nroCep: '123' };
    const result = validarEnderecoPJE(endereco);
    expect(result.valido).toBe(true);
    expect(result.avisos).toEqual([]);
  });

  it('should validate address with minimum fields (logradouro only)', () => {
    const endereco: EnderecoPJE = { id: 1, logradouro: 'Rua A' };
    const result = validarEnderecoPJE(endereco);
    expect(result.valido).toBe(true);
    expect(result.avisos).toHaveLength(2); // Missing municipio and cep
  });

  it('should invalidate address with id = 0', () => {
    const endereco: EnderecoPJE = { id: 0, logradouro: 'Rua A', municipio: 'SP', nroCep: '123' };
    const result = validarEnderecoPJE(endereco);
    expect(result.valido).toBe(false);
    expect(result.avisos).toContain('ID do endereço inválido ou ausente');
  });

  it('should invalidate address with negative id', () => {
    const endereco: EnderecoPJE = { id: -1, logradouro: 'Rua A', municipio: 'SP', nroCep: '123' };
    const result = validarEnderecoPJE(endereco);
    expect(result.valido).toBe(false);
    expect(result.avisos).toContain('ID do endereço inválido ou ausente');
  });

  it('should invalidate address with no minimum fields', () => {
    const endereco: EnderecoPJE = { id: 1 };
    const result = validarEnderecoPJE(endereco);
    expect(result.valido).toBe(false);
    expect(result.avisos).toEqual(['ID do endereço inválido ou ausente', 'Endereço sem logradouro', 'Endereço sem município', 'Endereço sem CEP']);
  });
});

describe('processarEndereco', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process complete address successfully', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 789 } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await processarEndereco(mockPartePJE, 'cliente', 100);

    expect(result).toBe(789);
    expect(mockUpsertEnderecoPorIdPje).toHaveBeenCalledWith({
      id_pje: 456,
      entidade_tipo: 'cliente',
      entidade_id: 100,
      logradouro: 'Rua das Flores',
      numero: '123',
      complemento: 'Apto 45',
      bairro: 'Centro',
      id_municipio_pje: 1234,
      municipio: 'São Paulo',
      municipio_ibge: '3550308',
      estado_id_pje: 25,
      estado_sigla: 'SP',
      estado_descricao: 'São Paulo',
      estado: 'SP',
      pais_id_pje: 1,
      pais_codigo: 'BR',
      pais_descricao: 'Brasil',
      pais: 'Brasil',
      cep: '01234567',
      classificacoes_endereco: [{ codigo: 'RES', descricao: 'Residencial' }],
      correspondencia: true,
      situacao: 'A',
      id_usuario_cadastrador_pje: 789,
      data_alteracao_pje: '2023-01-01T00:00:00Z',
      dados_pje_completo: mockEnderecoPJECompleto,
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Endereço salvo para João Silva')
    );

    consoleSpy.mockRestore();
  });

  it('should map top-level estado string fallback', async () => {
    const enderecoPJE: EnderecoPJE = { ...mockEnderecoPJECompleto, estado: 'Minas Gerais' };
    const parte = { ...mockPartePJE, dadosCompletos: { endereco: enderecoPJE } };
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 790 } });

    await processarEndereco(parte, 'cliente', 100);

    expect(mockUpsertEnderecoPorIdPje).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'Minas Gerais' })
    );
  });

  it('should return null when endereco is missing', async () => {
    const result = await processarEndereco(mockParteSemEndereco, 'cliente', 100);
    expect(result).toBeNull();
    expect(mockUpsertEnderecoPorIdPje).not.toHaveBeenCalled();
  });

  it('should return null when enderecoPJE.id is invalid', async () => {
    const parte = { ...mockPartePJE, dadosCompletos: { endereco: mockEnderecoPJEInvalido } };
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await processarEndereco(parte, 'cliente', 100);

    expect(result).toBeNull();
    expect(mockUpsertEnderecoPorIdPje).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Endereço inválido para João Silva')
    );

    consoleSpy.mockRestore();
  });

  it('should return null when upsert fails', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: false, erro: 'Erro' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await processarEndereco(mockPartePJE, 'cliente', 100);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erro ao processar endereço de João Silva')
    );

    consoleSpy.mockRestore();
  });
});

describe('processarEnderecoRepresentante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process representative address with party entidade_tipo', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 791 } });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const result = await processarEnderecoRepresentante(mockRepresentantePJE, 'cliente', 200, mockProcessoParaCaptura);

    expect(result).toBe(791);
    expect(mockUpsertEnderecoPorIdPje).toHaveBeenCalledWith(
      expect.objectContaining({
        entidade_tipo: 'cliente',
        entidade_id: 200, // parteId
        trt: '03',
        grau: 'primeiro_grau',
        numero_processo: '0000123-45.2023.5.03.0001',
        dados_pje_completo: mockEnderecoPJECompleto,
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Endereço salvo para representante Maria Advogada')
    );

    consoleSpy.mockRestore();
  });

  it('should return null when endereco is missing', async () => {
    const rep = { ...mockRepresentantePJE, dadosCompletos: {} };
    const result = await processarEnderecoRepresentante(rep, 'cliente', 200, mockProcessoParaCaptura);
    expect(result).toBeNull();
    expect(mockUpsertEnderecoPorIdPje).not.toHaveBeenCalled();
  });

  it('should return null when validation fails', async () => {
    const rep = { ...mockRepresentantePJE, dadosCompletos: { endereco: mockEnderecoPJEInvalido } };
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await processarEnderecoRepresentante(rep, 'cliente', 200, mockProcessoParaCaptura);

    expect(result).toBeNull();
    expect(mockUpsertEnderecoPorIdPje).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Endereço inválido para representante Maria Advogada')
    );

    consoleSpy.mockRestore();
  });

  it('should return null when upsert fails', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: false, erro: 'Erro' });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await processarEnderecoRepresentante(mockRepresentantePJE, 'cliente', 200, mockProcessoParaCaptura);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erro ao processar endereço de representante Maria Advogada')
    );

    consoleSpy.mockRestore();
  });
});

describe('vincularEnderecoNaEntidade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update clientes.endereco_id for cliente', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    await vincularEnderecoNaEntidade('cliente', 100, 789);

    expect(mockSupabase.from).toHaveBeenCalledWith('clientes');
    expect(mockSupabase.update).toHaveBeenCalledWith({ endereco_id: 789 });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 100);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('✓ Endereço 789 vinculado à cliente 100')
    );

    consoleSpy.mockRestore();
  });

  it('should update partes_contrarias.endereco_id for parte_contraria', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);

    await vincularEnderecoNaEntidade('parte_contraria', 101, 790);

    expect(mockSupabase.from).toHaveBeenCalledWith('partes_contrarias');
  });

  it('should update terceiros.endereco_id for terceiro', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);

    await vincularEnderecoNaEntidade('terceiro', 102, 791);

    expect(mockSupabase.from).toHaveBeenCalledWith('terceiros');
  });

  it('should log error when update fails', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'DB Error' } }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await vincularEnderecoNaEntidade('cliente', 100, 789);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Erro ao vincular endereço 789 à cliente 100'),
      { message: 'DB Error' }
    );

    consoleSpy.mockRestore();
  });
});

describe('Integration: Full Address Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process party address and link to entity', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 792 } });
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Process address
    const enderecoId = await processarEndereco(mockPartePJE, 'cliente', 100);
    expect(enderecoId).toBe(792);

    // Link to entity
    await vincularEnderecoNaEntidade('cliente', 100, enderecoId!);

    expect(mockSupabase.from).toHaveBeenCalledWith('clientes');
    expect(mockSupabase.update).toHaveBeenCalledWith({ endereco_id: 792 });
  });

  it('should process representative address and link to representative', async () => {
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 793 } });
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Process representative address
    const enderecoId = await processarEnderecoRepresentante(mockRepresentantePJE, 'cliente', 200, mockProcessoParaCaptura);
    expect(enderecoId).toBe(793);

    // Note: Linking to representative is done in processarRepresentantes, not here
  });

  it('should handle incomplete addresses logged but not rejected', async () => {
    const enderecoPJE: EnderecoPJE = { id: 458, logradouro: 'Rua C' }; // Missing municipio and cep
    const parte = { ...mockPartePJE, dadosCompletos: { endereco: enderecoPJE } };
    mockUpsertEnderecoPorIdPje.mockResolvedValue({ sucesso: true, endereco: { id: 794 } });

    const result = await processarEndereco(parte, 'cliente', 100);

    expect(result).toBe(794); // Still succeeds despite warnings
  });
});