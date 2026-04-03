import { describe, it, expect } from '@jest/globals';
import {
  pangeaBuscaInputSchema,
  pangeaBuscaResponseSchema,
  pangeaResultadoSchema,
  pangeaAggSchema,
  pangeaProcessoParadigmaSchema,
  PANGEA_MAX_TAMANHO_PAGINA,
  PANGEA_ORDENACAO_VALUES,
  PANGEA_TIPO_VALUES as _PANGEA_TIPO_VALUES,
} from '../../domain';

describe('Pangea Domain', () => {
  describe('pangeaBuscaInputSchema', () => {
    it('deve validar input completo válido', () => {
      // Arrange
      const input = {
        buscaGeral: 'teste busca',
        todasPalavras: 'palavra1 palavra2',
        quaisquerPalavras: 'palavra3',
        semPalavras: 'excluir',
        trechoExato: 'trecho exato',
        atualizacaoDesde: '2024-01-01',
        atualizacaoAte: '2024-12-31',
        cancelados: false,
        ordenacao: 'Text' as const,
        nr: '123',
        pagina: 1,
        tamanhoPagina: 100,
        orgaos: ['TST', 'TRT02'],
        tipos: ['SUM', 'SV'] as const,
      };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve aplicar defaults para campos opcionais', () => {
      // Arrange
      const input = {};

      // Act
      const result = pangeaBuscaInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.buscaGeral).toBe('');
        expect(result.data.cancelados).toBe(false);
        expect(result.data.ordenacao).toBe('Text');
        expect(result.data.pagina).toBe(1);
        expect(result.data.tamanhoPagina).toBe(PANGEA_MAX_TAMANHO_PAGINA);
        expect(result.data.orgaos).toEqual([]);
        expect(result.data.tipos).toEqual([]);
      }
    });

    it('deve validar ordenacao enum', () => {
      // Arrange - valid
      const validInputs = PANGEA_ORDENACAO_VALUES.map((ord) => ({
        ordenacao: ord,
      }));

      // Act & Assert
      validInputs.forEach((input) => {
        const result = pangeaBuscaInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      // Arrange - invalid
      const invalidInput = { ordenacao: 'InvalidOrdenacao' };

      // Act
      const invalidResult = pangeaBuscaInputSchema.safeParse(invalidInput);

      // Assert
      expect(invalidResult.success).toBe(false);
    });

    it('deve validar tipos enum', () => {
      // Arrange
      const validInput = { tipos: ['SUM', 'SV', 'RG'] };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(validInput);

      // Assert
      expect(result.success).toBe(true);

      // Invalid tipo
      const invalidInput = { tipos: ['INVALID_TYPE'] };
      const invalidResult = pangeaBuscaInputSchema.safeParse(invalidInput);
      expect(invalidResult.success).toBe(false);
    });

    it('deve validar limites de paginação', () => {
      // Arrange - pagina deve ser >= 1
      const invalidPagina = { pagina: 0 };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(invalidPagina);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve validar tamanho máximo da página', () => {
      // Arrange - tamanhoPagina não pode exceder PANGEA_MAX_TAMANHO_PAGINA
      const invalidTamanhoPagina = { tamanhoPagina: PANGEA_MAX_TAMANHO_PAGINA + 1 };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(invalidTamanhoPagina);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve aceitar datas em formato yyyy-mm-dd', () => {
      // Arrange
      const input = {
        atualizacaoDesde: '2024-01-01',
        atualizacaoAte: '2024-12-31',
      };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve aceitar datas em formato dd/mm/yyyy', () => {
      // Arrange
      const input = {
        atualizacaoDesde: '01/01/2024',
        atualizacaoAte: '31/12/2024',
      };

      // Act
      const result = pangeaBuscaInputSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('pangeaAggSchema', () => {
    it('deve validar aggregation válida', () => {
      // Arrange
      const agg = { tipo: 'SUM', total: 10 };

      // Act
      const result = pangeaAggSchema.safeParse(agg);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipo).toBe('SUM');
        expect(result.data.total).toBe(10);
      }
    });

    it('deve converter null/undefined em tipo para string vazia', () => {
      // Arrange
      const agg = { tipo: null, total: 5 };

      // Act
      const result = pangeaAggSchema.safeParse(agg);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tipo).toBe('');
      }
    });

    it('deve converter null/undefined em total para 0', () => {
      // Arrange
      const agg = { tipo: 'SUM', total: null };

      // Act
      const result = pangeaAggSchema.safeParse(agg);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
      }
    });

    it('deve converter string numérica em número', () => {
      // Arrange
      const agg = { tipo: 'SUM', total: '15' };

      // Act
      const result = pangeaAggSchema.safeParse(agg);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(15);
      }
    });
  });

  describe('pangeaProcessoParadigmaSchema', () => {
    it('deve validar processo paradigma válido', () => {
      // Arrange
      const processo = {
        numero: '0000001-00.2024.5.01.0001',
        link: 'https://example.com/processo',
      };

      // Act
      const result = pangeaProcessoParadigmaSchema.safeParse(processo);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve permitir link ausente/null', () => {
      // Arrange
      const processo = {
        numero: '0000001-00.2024.5.01.0001',
        link: null,
      };

      // Act
      const result = pangeaProcessoParadigmaSchema.safeParse(processo);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.link).toBeUndefined();
      }
    });

    it('deve converter null/undefined em numero para string vazia', () => {
      // Arrange
      const processo = { numero: null };

      // Act
      const result = pangeaProcessoParadigmaSchema.safeParse(processo);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.numero).toBe('');
      }
    });
  });

  describe('pangeaResultadoSchema', () => {
    it('deve validar resultado completo válido', () => {
      // Arrange
      const resultado = {
        id: '1',
        nr: 123,
        orgao: 'TST',
        tipo: 'SUM',
        situacao: 'Ativo',
        questao: 'Questão teste',
        tese: 'Tese teste',
        ultimaAtualizacao: '2024-01-01',
        possuiDecisoes: true,
        alertaSituacao: 'Alerta',
        highlight: { tese: '<em>destaque</em>' },
        processosParadigma: [
          { numero: '0000001-00.2024.5.01.0001', link: 'https://example.com' },
        ],
        suspensoes: [
          {
            ativa: true,
            dataSuspensao: '2024-01-01',
            descricao: 'Suspensão teste',
            linkDecisao: 'https://example.com/decisao',
          },
        ],
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve converter nr string para number', () => {
      // Arrange
      const resultado = {
        id: '1',
        nr: '456',
        orgao: 'TST',
        tipo: 'SUM',
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.nr).toBe('number');
        expect(result.data.nr).toBe(456);
      }
    });

    it('deve aceitar nr null/undefined', () => {
      // Arrange
      const resultado = {
        id: '1',
        nr: null,
        orgao: 'TST',
        tipo: 'SUM',
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nr).toBeNull();
      }
    });

    it('deve converter highlight null para record vazio', () => {
      // Arrange
      const resultado = {
        id: '1',
        orgao: 'TST',
        tipo: 'SUM',
        highlight: null,
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.highlight).toBeUndefined();
      }
    });

    it('deve converter processosParadigma null para array vazio', () => {
      // Arrange
      const resultado = {
        id: '1',
        orgao: 'TST',
        tipo: 'SUM',
        processosParadigma: null,
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.processosParadigma).toEqual([]);
      }
    });

    it('deve permitir campos extras (passthrough)', () => {
      // Arrange
      const resultado = {
        id: '1',
        orgao: 'TST',
        tipo: 'SUM',
        campoExtra: 'valor extra',
      };

      // Act
      const result = pangeaResultadoSchema.safeParse(resultado);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).campoExtra).toBe('valor extra');
      }
    });
  });

  describe('pangeaBuscaResponseSchema', () => {
    it('deve validar resposta completa válida', () => {
      // Arrange
      const response = {
        aggsEspecies: [{ tipo: 'SUM', total: 10 }],
        aggsOrgaos: [{ tipo: 'TST', total: 15 }],
        posicao_inicial: 1,
        posicao_final: 10,
        total: 100,
        resultados: [
          {
            id: '1',
            nr: 1,
            orgao: 'TST',
            tipo: 'SUM',
          },
        ],
      };

      // Act
      const result = pangeaBuscaResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve converter null para valores padrão', () => {
      // Arrange
      const response = {
        aggsEspecies: null,
        aggsOrgaos: null,
        posicao_inicial: null,
        posicao_final: null,
        total: null,
        resultados: null,
      };

      // Act
      const result = pangeaBuscaResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.aggsEspecies).toEqual([]);
        expect(result.data.aggsOrgaos).toEqual([]);
        expect(result.data.resultados).toEqual([]);
        expect(result.data.posicao_inicial).toBeUndefined();
        expect(result.data.posicao_final).toBeUndefined();
        expect(result.data.total).toBeUndefined();
      }
    });

    it('deve permitir campos extras (passthrough)', () => {
      // Arrange
      const response = {
        resultados: [],
        campoExtra: 'extra',
      };

      // Act
      const result = pangeaBuscaResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).campoExtra).toBe('extra');
      }
    });
  });
});
