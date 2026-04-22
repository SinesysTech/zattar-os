/**
 * Testes do profile-adapters — garantem que a discriminação PF/PJ ocorre
 * corretamente a partir de entidades vindas do repositório.
 *
 * Cobre a regressão do bug reportado no painel do cliente:
 *   "cliente PF mostrando título 'Dados Empresariais' e campos vazios".
 *
 * A causa era `cliente.tipo_pessoa` undefined por conversão indevida no
 * repositório. Agora que o repo retorna snake_case correto, o adapter
 * precisa produzir label, flags e campos discriminados de acordo.
 */
import {
  adaptClienteToProfile,
  adaptParteContrariaToProfile,
  adaptTerceiroToProfile,
} from '../utils/profile-adapters';
import {
  criarClientePFMock,
  criarClientePJMock,
  criarParteContrariaPFMock,
  criarParteContrariaPJMock,
  criarTerceiroPFMock,
  criarTerceiroPJMock,
} from '@/app/(authenticated)/partes/__tests__/fixtures';

describe('adaptClienteToProfile — discriminação PF vs PJ', () => {
  it('cliente PF produz label "Pessoa Física" e idade calculada', () => {
    const cliente = criarClientePFMock({
      data_nascimento: '1980-05-15',
      sexo: 'masculino',
      nacionalidade: 'Brasileira',
    });

    const profile = adaptClienteToProfile(cliente);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Física');
    expect(profile.tipo_pessoa).toBe('pf');
    expect(profile.sexo).toBe('masculino');
    expect(profile.nacionalidade).toBe('Brasileira');
    expect(profile.idade).toBeGreaterThan(0);
  });

  it('cliente PF formata cpf_cnpj usando o CPF', () => {
    const cliente = criarClientePFMock({ cpf: '12345678900' });

    const profile = adaptClienteToProfile(cliente);

    expect(profile.cpf_cnpj).toContain('123');
    expect(profile.cpf_cnpj).not.toBe('');
  });

  it('cliente PF formata celular a partir de ddd_celular + numero_celular', () => {
    const cliente = criarClientePFMock({
      ddd_celular: '11',
      numero_celular: '987654321',
    });

    const profile = adaptClienteToProfile(cliente);

    expect(profile.celular_formatado).toBeTruthy();
    expect(profile.celular_formatado).toContain('11');
  });

  it('cliente PJ produz label "Pessoa Jurídica" e não tem campos PF', () => {
    const cliente = criarClientePJMock({
      nome: 'Empresa XYZ',
      cnpj: '12345678000190',
      ramo_atividade: 'Tecnologia',
    });

    const profile = adaptClienteToProfile(cliente);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Jurídica');
    expect(profile.tipo_pessoa).toBe('pj');
    expect(profile.ramo_atividade).toBe('Tecnologia');
    // PF fields must NOT be populated for PJ
    expect(profile.idade).toBeNull();
    expect(profile.idade_formatada).toBeNull();
  });

  it('cliente PJ formata cpf_cnpj usando o CNPJ', () => {
    const cliente = criarClientePJMock({ cnpj: '12345678000190' });

    const profile = adaptClienteToProfile(cliente);

    expect(profile.cpf_cnpj).toContain('12');
    expect(profile.cpf_cnpj).not.toBe('');
  });
});

describe('adaptParteContrariaToProfile — discriminação PF vs PJ', () => {
  it('PF gera campos específicos de pessoa física', () => {
    const parte = criarParteContrariaPFMock({
      nome: 'Maria Oliveira',
      sexo: 'feminino',
    });

    const profile = adaptParteContrariaToProfile(parte);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Física');
    expect(profile.sexo).toBe('feminino');
  });

  it('PJ gera campos específicos de pessoa jurídica', () => {
    const parte = criarParteContrariaPJMock({
      ramo_atividade: 'Comércio',
    });

    const profile = adaptParteContrariaToProfile(parte);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Jurídica');
    expect(profile.ramo_atividade).toBe('Comércio');
  });
});

describe('adaptTerceiroToProfile — discriminação PF vs PJ', () => {
  it('PF gera campos específicos de pessoa física', () => {
    const terceiro = criarTerceiroPFMock({ sexo: 'masculino' });

    const profile = adaptTerceiroToProfile(terceiro);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Física');
    expect(profile.sexo).toBe('masculino');
  });

  it('PJ gera campos específicos de pessoa jurídica', () => {
    const terceiro = criarTerceiroPJMock({ ramo_atividade: 'Consultoria' });

    const profile = adaptTerceiroToProfile(terceiro);

    expect(profile.tipo_pessoa_label).toBe('Pessoa Jurídica');
    expect(profile.ramo_atividade).toBe('Consultoria');
  });
});

describe('regressão — bug do detalhe vazio', () => {
  it('PF vindo do DB com tipo_pessoa UPPERCASE (já normalizado pelo converter) gera UI correta', () => {
    // Simula dado pós-converter: tipo_pessoa já está em lowercase graças ao normalizador.
    const cliente = criarClientePFMock({
      nome: 'Rai Da silva magno',
      emails: ['raidasilvamagno@gmail.com'],
      sexo: 'masculino',
      nacionalidade: 'Brasileira',
    });

    const profile = adaptClienteToProfile(cliente);

    // Contratos que a UI consome:
    expect(profile.tipo_pessoa_label).toBe('Pessoa Física');
    expect(profile.tipo_pessoa).toBe('pf');
    expect(profile.sexo).toBe('masculino');
    expect(profile.nacionalidade).toBe('Brasileira');
    expect(profile.emails).toEqual(['raidasilvamagno@gmail.com']);
    expect(profile.emails_formatados).toBe('raidasilvamagno@gmail.com');
  });
});
