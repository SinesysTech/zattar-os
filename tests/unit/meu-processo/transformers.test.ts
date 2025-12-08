/**
 * Testes unitários dos transformadores de dados Meu Processo
 * 
 * Testa a conversão de dados do formato Sinesys para o formato legado (N8N)
 */

import {
  transformProcessoSinesysParaLegacy,
  transformProcessosSinesysParaLegacy,
  transformAudienciaSinesysParaLegacy,
  transformAudienciasSinesysParaLegacy,
  transformContratoSinesysParaLegacy,
  transformContratosSinesysParaLegacy,
  transformAcordoSinesysParaLegacy,
  transformAcordosSinesysParaLegacy,
  transformDadosClienteParaLegacy,
} from '@/lib/transformers/meu-processo-transformers';

import type {
  SinesysProcesso,
  SinesysProcessoResponse,
  SinesysAudiencia,
  SinesysAudienciasResponse,
  SinesysContrato,
  SinesysContratosResponse,
  SinesysAcordo,
  SinesysAcordosResponse,
} from '@/lib/types/meu-processo-types';

describe('Transformadores de Processos', () => {
  describe('transformProcessoSinesysParaLegacy', () => {
    it('deve transformar processo normal corretamente', () => {
      const processo: SinesysProcesso = {
        numero: '0001234-56.2024.5.03.0001',
        tipo: 'Ação Trabalhista - Rito Ordinário',
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa XYZ Ltda',
        tribunal: 'TRT da 3ª Região (MG)',
        sigilo: false,
        valor_causa: 'R$ 50.000,00',
        vara: '1ª Vara do Trabalho de Belo Horizonte',
        instancias: {
          primeiro_grau: {
            vara: '1ª Vara do Trabalho de Belo Horizonte',
            data_inicio: '10/01/2024',
            proxima_audiencia: '15/03/2025 às 14:00',
            status: 'Em andamento',
          },
          segundo_grau: null,
        },
        timeline: [
          {
            data: '20/11/2024',
            evento: 'Audiência designada',
            descricao: 'Audiência de instrução designada para 15/03/2025',
            tem_documento: false,
          },
        ],
        timeline_status: 'disponivel',
        partes: {
          polo_ativo: 'João da Silva',
          polo_passivo: 'Empresa XYZ Ltda',
        },
      };

      const resultado = transformProcessoSinesysParaLegacy(processo);

      expect(resultado).toHaveProperty('processo');
      expect(resultado.processo).toEqual({
        parteAutora: 'João da Silva',
        parteRe: 'Empresa XYZ Ltda',
        tribunal: 'TRT da 3ª Região (MG)',
        numero: '0001234-56.2024.5.03.0001',
        valorDaCausa: 'R$ 50.000,00',
        jurisdicaoEstado: 'MG',
        jurisdicaoMunicipio: 'Belo Horizonte',
        instancias: {
          primeirograu: {
            dataAjuizamento: '10/01/2024',
            movimentos: [],
          },
          segundograu: null,
          terceirograu: null,
        },
      });
    });

    it('deve retornar mensagem para processo sigiloso', () => {
      const processo: SinesysProcesso = {
        numero: '0001234-56.2024.5.03.0001',
        tipo: 'Ação Trabalhista',
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa ABC',
        tribunal: 'TRT 3',
        sigilo: true,
        instancias: {
          primeiro_grau: null,
          segundo_grau: null,
        },
        timeline: [],
        timeline_status: 'disponivel',
      };

      const resultado = transformProcessoSinesysParaLegacy(processo);

      expect(resultado).toEqual({
        result: 'Processo sob sigilo',
      });
    });

    it('deve retornar mensagem para timeline indisponível', () => {
      const processo: SinesysProcesso = {
        numero: '0001234-56.2024.5.03.0001',
        tipo: 'Ação Trabalhista',
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa ABC',
        tribunal: 'TRT 3',
        sigilo: false,
        instancias: {
          primeiro_grau: null,
          segundo_grau: null,
        },
        timeline: [],
        timeline_status: 'indisponivel',
      };

      const resultado = transformProcessoSinesysParaLegacy(processo);

      expect(resultado).toEqual({
        result: 'Timeline do processo não disponível no momento',
      });
    });

    it('deve extrair estado corretamente do tribunal', () => {
      const processo: SinesysProcesso = {
        numero: '123',
        tipo: 'Ação',
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa',
        tribunal: 'TRT da 15ª Região (SP)',
        sigilo: false,
        instancias: { primeiro_grau: null, segundo_grau: null },
        timeline: [],
        timeline_status: 'disponivel',
        partes: { polo_ativo: 'A', polo_passivo: 'B' },
      };

      const resultado = transformProcessoSinesysParaLegacy(processo);
      expect(resultado.processo?.jurisdicaoEstado).toBe('SP');
    });

    it('deve extrair município corretamente da vara', () => {
      const processo: SinesysProcesso = {
        numero: '123',
        tipo: 'Ação',
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa',
        tribunal: 'TRT 3',
        sigilo: false,
        vara: '2ª Vara do Trabalho de Contagem',
        instancias: { primeiro_grau: null, segundo_grau: null },
        timeline: [],
        timeline_status: 'disponivel',
        partes: { polo_ativo: 'A', polo_passivo: 'B' },
      };

      const resultado = transformProcessoSinesysParaLegacy(processo);
      expect(resultado.processo?.jurisdicaoMunicipio).toBe('Contagem');
    });
  });

  describe('transformProcessosSinesysParaLegacy', () => {
    it('deve transformar lista de processos', () => {
      const response: SinesysProcessoResponse = {
        success: true,
        data: {
          cliente: { nome: 'João da Silva', cpf: '12345678901' },
          resumo: { total_processos: 2, com_audiencia_proxima: 1 },
          processos: [
            {
              numero: '001',
              tipo: 'Ação Trabalhista',
              papel_cliente: 'Reclamante',
              parte_contraria: 'Empresa A',
              tribunal: 'TRT 3 (MG)',
              sigilo: false,
              instancias: { primeiro_grau: null, segundo_grau: null },
              timeline: [],
              timeline_status: 'disponivel',
              partes: { polo_ativo: 'João', polo_passivo: 'Empresa A' },
            },
            {
              numero: '002',
              tipo: 'Ação Civil',
              papel_cliente: 'Autor',
              parte_contraria: 'Empresa B',
              tribunal: 'TJMG',
              sigilo: false,
              instancias: { primeiro_grau: null, segundo_grau: null },
              timeline: [],
              timeline_status: 'disponivel',
              partes: { polo_ativo: 'João', polo_passivo: 'Empresa B' },
            },
          ],
        },
      };

      const resultado = transformProcessosSinesysParaLegacy(response);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].processo?.numero).toBe('001');
      expect(resultado[1].processo?.numero).toBe('002');
    });

    it('deve retornar array vazio para resposta sem sucesso', () => {
      const response: SinesysProcessoResponse = {
        success: false,
        data: {
          cliente: { nome: '', cpf: '' },
          resumo: { total_processos: 0, com_audiencia_proxima: 0 },
          processos: [],
        },
      };

      const resultado = transformProcessosSinesysParaLegacy(response);
      expect(resultado).toEqual([]);
    });
  });
});

describe('Transformadores de Audiências', () => {
  describe('transformAudienciaSinesysParaLegacy', () => {
    it('deve transformar audiência virtual corretamente', () => {
      const audiencia: SinesysAudiencia = {
        numero_processo: '0001234-56.2024.5.03.0001',
        tipo: 'Audiência de Instrução',
        data: '15/03/2025',
        horario: '14:00 - 15:00',
        modalidade: 'Virtual',
        status: 'Designada',
        local: {
          tipo: 'virtual',
          url_virtual: 'https://zoom.us/j/123456789',
        },
        partes: {
          polo_ativo: 'João da Silva',
          polo_passivo: 'Empresa XYZ Ltda',
        },
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa XYZ Ltda',
        tribunal: 'TRT da 3ª Região (MG)',
        vara: '1ª Vara do Trabalho de Belo Horizonte',
        sigilo: false,
        advogado: 'Dr. José Santos',
      };

      const resultado = transformAudienciaSinesysParaLegacy(
        audiencia,
        'João da Silva'
      );

      expect(resultado).toEqual({
        data_hora: '15/03/2025 14:00',
        polo_ativo: 'João da Silva',
        polo_passivo: 'Empresa XYZ Ltda',
        numero_processo: '0001234-56.2024.5.03.0001',
        modalidade: 'Virtual',
        local_link: 'https://zoom.us/j/123456789',
        status: 'Designada',
        orgao_julgador: '1ª Vara do Trabalho de Belo Horizonte',
        tipo: 'Audiência de Instrução',
        sala: '',
        advogado: 'Dr. José Santos',
        detalhes: null,
        cliente_nome: 'João da Silva',
      });
    });

    it('deve transformar audiência presencial corretamente', () => {
      const audiencia: SinesysAudiencia = {
        numero_processo: '002',
        tipo: 'Audiência Inicial',
        data: '20/04/2025',
        horario: '10:00 - 11:00',
        modalidade: 'Presencial',
        status: 'Designada',
        local: {
          tipo: 'presencial',
          endereco: 'Rua das Flores, 123',
          sala: 'Sala 5',
        },
        partes: { polo_ativo: 'Maria', polo_passivo: 'Empresa ABC' },
        papel_cliente: 'Reclamante',
        parte_contraria: 'Empresa ABC',
        tribunal: 'TRT 15',
        sigilo: false,
      };

      const resultado = transformAudienciaSinesysParaLegacy(audiencia, 'Maria');

      expect(resultado.local_link).toBeNull();
      expect(resultado.sala).toBe('Sala 5');
      expect(resultado.modalidade).toBe('Presencial');
    });
  });

  describe('transformAudienciasSinesysParaLegacy', () => {
    it('deve transformar lista de audiências', () => {
      const response: SinesysAudienciasResponse = {
        success: true,
        data: {
          cliente: { nome: 'João da Silva', cpf: '12345678901' },
          resumo: {
            total_audiencias: 2,
            futuras: 1,
            realizadas: 1,
            canceladas: 0,
          },
          audiencias: [
            {
              numero_processo: '001',
              tipo: 'Audiência de Instrução',
              data: '15/03/2025',
              horario: '14:00 - 15:00',
              modalidade: 'Virtual',
              status: 'Designada',
              local: { tipo: 'virtual', url_virtual: 'https://zoom.us/j/123' },
              partes: { polo_ativo: 'João', polo_passivo: 'Empresa A' },
              papel_cliente: 'Reclamante',
              parte_contraria: 'Empresa A',
              tribunal: 'TRT 3',
              sigilo: false,
            },
            {
              numero_processo: '002',
              tipo: 'Audiência Inicial',
              data: '01/02/2025',
              horario: '10:00 - 11:00',
              modalidade: 'Presencial',
              status: 'Realizada',
              local: { tipo: 'presencial', sala: 'Sala 2' },
              partes: { polo_ativo: 'João', polo_passivo: 'Empresa B' },
              papel_cliente: 'Autor',
              parte_contraria: 'Empresa B',
              tribunal: 'TJMG',
              sigilo: false,
            },
          ],
        },
      };

      const resultado = transformAudienciasSinesysParaLegacy(response);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].numero_processo).toBe('001');
      expect(resultado[1].numero_processo).toBe('002');
      expect(resultado[0].cliente_nome).toBe('João da Silva');
    });

    it('deve retornar array vazio para resposta sem sucesso', () => {
      const response: SinesysAudienciasResponse = {
        success: false,
        data: {
          cliente: { nome: '', cpf: '' },
          resumo: {
            total_audiencias: 0,
            futuras: 0,
            realizadas: 0,
            canceladas: 0,
          },
          audiencias: [],
        },
      };

      const resultado = transformAudienciasSinesysParaLegacy(response);
      expect(resultado).toEqual([]);
    });
  });
});

describe('Transformadores de Contratos', () => {
  describe('transformContratoSinesysParaLegacy', () => {
    it('deve transformar contrato completo corretamente', () => {
      const contrato: SinesysContrato = {
        id: 1,
        cliente_id: 10,
        cliente_nome: 'João da Silva',
        cliente_cpf: '12345678901',
        parte_contraria: 'Empresa XYZ Ltda',
        processo_numero: '0001234-56.2024.5.03.0001',
        processo_tipo_nome: 'Ação Trabalhista - Rito Ordinário',
        data_assinou_contrato: '01/12/2023',
        data_admissao: '15/01/2020',
        data_rescisao: '30/11/2023',
        estagio: 'Fase Probatória',
        data_estagio: '10/01/2024',
        status: 'Ativo',
      };

      const resultado = transformContratoSinesysParaLegacy(contrato);

      expect(resultado).toEqual({
        cliente_nome: 'João da Silva',
        cliente_cpf: '12345678901',
        parte_contraria: 'Empresa XYZ Ltda',
        processo_tipo_nome: 'Ação Trabalhista - Rito Ordinário',
        data_admissao: '15/01/2020',
        data_rescisao: '30/11/2023',
        data_assinou_contrato: '01/12/2023',
        estagio: 'Fase Probatória',
        data_estagio: '10/01/2024',
        numero_processo: '0001234-56.2024.5.03.0001',
      });
    });

    it('deve usar status quando estagio não existe', () => {
      const contrato: SinesysContrato = {
        id: 2,
        cliente_id: 20,
        cliente_nome: 'Maria Santos',
        status: 'Em andamento',
      };

      const resultado = transformContratoSinesysParaLegacy(contrato);
      expect(resultado.estagio).toBe('Em andamento');
    });
  });

  describe('transformContratosSinesysParaLegacy', () => {
    it('deve transformar lista de contratos', () => {
      const response: SinesysContratosResponse = {
        success: true,
        data: {
          contratos: [
            {
              id: 1,
              cliente_id: 10,
              cliente_nome: 'João da Silva',
              status: 'Ativo',
            },
            {
              id: 2,
              cliente_id: 10,
              cliente_nome: 'João da Silva',
              status: 'Concluído',
            },
          ],
          total: 2,
          pagina: 1,
          limite: 50,
        },
      };

      const resultado = transformContratosSinesysParaLegacy(response);

      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado).toHaveLength(2);
    });

    it('deve retornar mensagem quando não há contratos', () => {
      const response: SinesysContratosResponse = {
        success: true,
        data: {
          contratos: [],
          total: 0,
          pagina: 1,
          limite: 50,
        },
      };

      const resultado = transformContratosSinesysParaLegacy(response);
      expect(resultado).toBe('Nenhum contrato encontrado');
    });

    it('deve retornar mensagem para resposta sem sucesso', () => {
      const response: SinesysContratosResponse = {
        success: false,
        data: {
          contratos: [],
          total: 0,
          pagina: 1,
          limite: 50,
        },
      };

      const resultado = transformContratosSinesysParaLegacy(response);
      expect(resultado).toBe('Contratos não disponíveis no momento');
    });
  });
});

describe('Transformadores de Acordos/Condenações', () => {
  describe('transformAcordoSinesysParaLegacy', () => {
    it('deve transformar acordo com múltiplas parcelas', () => {
      const acordo: SinesysAcordo = {
        id: 1,
        processo_id: 100,
        numero_processo: '0001234-56.2024.5.03.0001',
        tipo: 'acordo',
        direcao: 'recebimento',
        valor_total: 50000.0,
        valor_bruto: 60000.0,
        valor_liquido: 50000.0,
        data_homologacao: '15/11/2024',
        forma_pagamento: 'Parcelado',
        modalidade_pagamento: 'Depósito Bancário',
        parte_autora: 'João da Silva',
        parte_contraria: 'Empresa XYZ Ltda',
        quantidade_parcelas: 3,
        parcelas: [
          {
            id: 1,
            numero: 1,
            valor: 16666.67,
            valor_liquido: 16666.67,
            data_vencimento: '15/12/2024',
            status: 'paga',
            data_pagamento: '10/12/2024',
            repassado_cliente: true,
            data_repassado_cliente: '11/12/2024',
          },
          {
            id: 2,
            numero: 2,
            valor: 16666.67,
            valor_liquido: 16666.67,
            data_vencimento: '15/01/2025',
            status: 'pendente',
            repassado_cliente: false,
          },
          {
            id: 3,
            numero: 3,
            valor: 16666.66,
            valor_liquido: 16666.66,
            data_vencimento: '15/02/2025',
            status: 'pendente',
            repassado_cliente: false,
          },
        ],
      };

      const resultado = transformAcordoSinesysParaLegacy(acordo);

      expect(resultado).toHaveLength(3);
      
      expect(resultado[0]).toMatchObject({
        numero_processo: '0001234-56.2024.5.03.0001',
        parte_autora: 'João da Silva',
        parte_contraria: 'Empresa XYZ Ltda',
        data_homologacao: '15/11/2024',
        tipo_pagamento: 'Acordo',
        forma_pagamento: 'Parcelado',
        modalidade_pagamento: 'Depósito Bancário',
        valor_bruto: '60000.00',
        valor_liquido: '50000.00',
        quantidade_parcelas: 3,
        parcela_numero: 1,
        data_vencimento: '15/12/2024',
        valor_liquido_parcela: '16666.67',
        repassado_cliente: 'Y',
        data_repassado_cliente: '11/12/2024',
      });

      expect(resultado[1].repassado_cliente).toBe('N');
      expect(resultado[2].parcela_numero).toBe(3);
    });

    it('deve transformar condenação corretamente', () => {
      const acordo: SinesysAcordo = {
        id: 2,
        processo_id: 200,
        tipo: 'condenacao',
        direcao: 'recebimento',
        valor_total: 10000.0,
        quantidade_parcelas: 1,
        parcelas: [
          {
            id: 10,
            numero: 1,
            valor: 10000.0,
            status: 'pendente',
            repassado_cliente: false,
          },
        ],
      };

      const resultado = transformAcordoSinesysParaLegacy(acordo);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].tipo_pagamento).toBe('Condenação');
      expect(resultado[0].valor_liquido_parcela).toBe('10000.00');
    });
  });

  describe('transformAcordosSinesysParaLegacy', () => {
    it('deve transformar lista de acordos e achatar parcelas', () => {
      const response: SinesysAcordosResponse = {
        success: true,
        data: {
          acordos: [
            {
              id: 1,
              processo_id: 100,
              tipo: 'acordo',
              direcao: 'recebimento',
              valor_total: 20000.0,
              quantidade_parcelas: 2,
              parcelas: [
                {
                  id: 1,
                  numero: 1,
                  valor: 10000.0,
                  status: 'paga',
                  repassado_cliente: true,
                },
                {
                  id: 2,
                  numero: 2,
                  valor: 10000.0,
                  status: 'pendente',
                  repassado_cliente: false,
                },
              ],
            },
            {
              id: 2,
              processo_id: 200,
              tipo: 'condenacao',
              direcao: 'recebimento',
              valor_total: 5000.0,
              quantidade_parcelas: 1,
              parcelas: [
                {
                  id: 3,
                  numero: 1,
                  valor: 5000.0,
                  status: 'pendente',
                  repassado_cliente: false,
                },
              ],
            },
          ],
          total: 2,
          pagina: 1,
          limite: 50,
        },
      };

      const resultado = transformAcordosSinesysParaLegacy(response);

      // 2 parcelas do primeiro acordo + 1 parcela do segundo = 3 linhas
      expect(resultado).toHaveLength(3);
      expect(resultado[0].tipo_pagamento).toBe('Acordo');
      expect(resultado[2].tipo_pagamento).toBe('Condenação');
    });

    it('deve retornar array vazio para resposta sem sucesso', () => {
      const response: SinesysAcordosResponse = {
        success: false,
        data: {
          acordos: [],
          total: 0,
          pagina: 1,
          limite: 50,
        },
      };

      const resultado = transformAcordosSinesysParaLegacy(response);
      expect(resultado).toEqual([]);
    });
  });
});

describe('Transformador Agregado', () => {
  describe('transformDadosClienteParaLegacy', () => {
    it('deve transformar todos os dados do cliente corretamente', () => {
      const dados = {
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: { total_processos: 1, com_audiencia_proxima: 0 },
            processos: [
              {
                numero: '001',
                tipo: 'Ação Trabalhista',
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa A',
                tribunal: 'TRT 3 (MG)',
                sigilo: false,
                instancias: { primeiro_grau: null, segundo_grau: null },
                timeline: [],
                timeline_status: 'disponivel' as const,
                partes: { polo_ativo: 'João', polo_passivo: 'Empresa A' },
              },
            ],
          },
        },
        audiencias: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '12345678901' },
            resumo: {
              total_audiencias: 1,
              futuras: 1,
              realizadas: 0,
              canceladas: 0,
            },
            audiencias: [
              {
                numero_processo: '001',
                tipo: 'Audiência',
                data: '15/03/2025',
                horario: '14:00 - 15:00',
                modalidade: 'Virtual' as const,
                status: 'Designada' as const,
                local: { tipo: 'virtual' as const },
                partes: { polo_ativo: 'João', polo_passivo: 'Empresa A' },
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa A',
                tribunal: 'TRT 3',
                sigilo: false,
              },
            ],
          },
        },
        contratos: {
          success: true,
          data: {
            contratos: [
              {
                id: 1,
                cliente_id: 10,
                cliente_nome: 'João',
                status: 'Ativo',
              },
            ],
            total: 1,
            pagina: 1,
            limite: 50,
          },
        },
        acordos: {
          success: true,
          data: {
            acordos: [
              {
                id: 1,
                processo_id: 100,
                tipo: 'acordo' as const,
                direcao: 'recebimento' as const,
                valor_total: 10000.0,
                quantidade_parcelas: 1,
                parcelas: [
                  {
                    id: 1,
                    numero: 1,
                    valor: 10000.0,
                    status: 'pendente' as const,
                    repassado_cliente: false,
                  },
                ],
              },
            ],
            total: 1,
            pagina: 1,
            limite: 50,
          },
        },
      };

      const resultado = transformDadosClienteParaLegacy(dados);

      expect(resultado).toHaveProperty('processos');
      expect(resultado).toHaveProperty('audiencias');
      expect(resultado).toHaveProperty('contratos');
      expect(resultado).toHaveProperty('acordos_condenacoes');

      expect(resultado.processos).toHaveLength(1);
      expect(resultado.audiencias).toHaveLength(1);
      expect(Array.isArray(resultado.contratos)).toBe(true);
      expect(resultado.acordos_condenacoes).toHaveLength(1);
      expect(resultado.message).toBeUndefined();
    });

    it('deve retornar mensagem quando não há dados', () => {
      const dados = {
        processos: { success: false, error: 'Erro' },
        audiencias: { success: false, error: 'Erro' },
        contratos: { success: false, error: 'Erro' },
      };

      const resultado = transformDadosClienteParaLegacy(dados);

      expect(resultado.processos).toEqual([]);
      expect(resultado.audiencias).toEqual([]);
      expect(resultado.message).toBe('Não foram encontrados dados para este CPF');
    });

    it('deve lidar com falha parcial dos dados', () => {
      const dados = {
        processos: {
          success: true,
          data: {
            cliente: { nome: 'João', cpf: '123' },
            resumo: { total_processos: 1, com_audiencia_proxima: 0 },
            processos: [
              {
                numero: '001',
                tipo: 'Ação',
                papel_cliente: 'Reclamante',
                parte_contraria: 'Empresa A',
                tribunal: 'TRT 3',
                sigilo: false,
                instancias: { primeiro_grau: null, segundo_grau: null },
                timeline: [],
                timeline_status: 'disponivel' as const,
                partes: { polo_ativo: 'João', polo_passivo: 'Empresa A' },
              },
            ],
          },
        },
        audiencias: { success: false, error: 'Erro ao buscar audiências' },
        contratos: { success: false, error: 'Erro ao buscar contratos' },
      };

      const resultado = transformDadosClienteParaLegacy(dados);

      expect(resultado.processos).toHaveLength(1);
      expect(resultado.audiencias).toEqual([]);
      expect(resultado.contratos).toBe('Contratos não disponíveis');
      expect(resultado.message).toBeUndefined(); // Tem processos, então não mostra mensagem
    });
  });
});
