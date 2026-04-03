import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  actionSincronizarParcela,
  actionSincronizarAcordo,
  actionRegistrarDeclaracao,
  actionGerarRepasse,
  actionVerificarConsistencia,
  actionObterResumoObrigacoes,
  actionObterAlertasFinanceiros,
  actionListarObrigacoes,
} from '../../actions/obrigacoes';
import { ObrigacoesService } from '../../services/obrigacoes';
import { verificarConsistencia } from '../../services/obrigacoes-integracao';
import { revalidatePath } from 'next/cache';
import {
  criarParcelaMock,
  criarAcordoMock,
  criarRepasseMock,
  criarInconsistenciaMock,
} from '../fixtures';

jest.mock('../../services/obrigacoes');
jest.mock('../../services/obrigacoes-integracao');
jest.mock('next/cache');

describe('Sincronização', () => {
  const _mockParcela = criarParcelaMock();
  const _mockAcordo = criarAcordoMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionSincronizarParcela', () => {
    it('deve chamar service e revalidar paths', async () => {
      (ObrigacoesService.sincronizarParcela as jest.Mock).mockResolvedValue({
        sucesso: true,
        mensagem: 'Parcela sincronizada com sucesso',
      });

      const result = await actionSincronizarParcela(1);

      expect(ObrigacoesService.sincronizarParcela).toHaveBeenCalledWith(1, false);
      expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes');
      expect(result).toEqual({
        success: true,
        message: 'Parcela sincronizada com sucesso',
      });
    });

    it('deve retornar mensagem de erro em caso de falha', async () => {
      (ObrigacoesService.sincronizarParcela as jest.Mock).mockResolvedValue({
        sucesso: false,
        mensagem: 'Erro ao sincronizar parcela',
      });

      const result = await actionSincronizarParcela(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao sincronizar parcela');
    });

    it('deve tratar exceções', async () => {
      (ObrigacoesService.sincronizarParcela as jest.Mock).mockRejectedValue(
        new Error('Erro inesperado')
      );

      const result = await actionSincronizarParcela(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('actionSincronizarAcordo', () => {
    it('deve sincronizar todas as parcelas do acordo', async () => {
      (ObrigacoesService.sincronizarAcordo as jest.Mock).mockResolvedValue({
        sucesso: true,
        mensagem: 'Acordo sincronizado. 3 parcelas processadas.',
      });

      const result = await actionSincronizarAcordo(1);

      expect(ObrigacoesService.sincronizarAcordo).toHaveBeenCalledWith(1, false);
      expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes');
      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes/1');
      expect(result.success).toBe(true);
    });

    it('deve revalidar paths específicos do acordo', async () => {
      (ObrigacoesService.sincronizarAcordo as jest.Mock).mockResolvedValue({
        sucesso: true,
        mensagem: 'Acordo sincronizado',
      });

      await actionSincronizarAcordo(123);

      expect(revalidatePath).toHaveBeenCalledWith('/app/acordos-condenacoes/123');
    });
  });

  describe('actionVerificarConsistencia', () => {
    it('deve chamar verificarConsistencia e retornar inconsistências', async () => {
      const mockInconsistencias = [
        criarInconsistenciaMock({ tipo: 'valor_divergente' }),
        criarInconsistenciaMock({ tipo: 'parcela_sem_lancamento' }),
      ];

      (verificarConsistencia as jest.Mock).mockResolvedValue(mockInconsistencias);

      const result = await actionVerificarConsistencia(1);

      expect(verificarConsistencia).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockInconsistencias,
      });
    });

    it('deve retornar array vazio se não houver inconsistências', async () => {
      (verificarConsistencia as jest.Mock).mockResolvedValue([]);

      const result = await actionVerificarConsistencia(1);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });
});

describe('Repasses', () => {
  const mockRepasse = criarRepasseMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionRegistrarDeclaracao', () => {
    it('deve validar URL obrigatória e registrar declaração', async () => {
      (ObrigacoesService.registrarDeclaracao as jest.Mock).mockResolvedValue(mockRepasse);

      const result = await actionRegistrarDeclaracao(1, 'https://example.com/declaracao.pdf');

      expect(ObrigacoesService.registrarDeclaracao).toHaveBeenCalledWith(
        1,
        'https://example.com/declaracao.pdf'
      );
      expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve retornar erro quando service falha', async () => {
      (ObrigacoesService.registrarDeclaracao as jest.Mock).mockRejectedValue(
        new Error('URL inválida')
      );

      const result = await actionRegistrarDeclaracao(1, '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('URL inválida');
    });
  });

  describe('actionGerarRepasse', () => {
    it('deve validar URL e data, e registrar comprovante', async () => {
      (ObrigacoesService.registrarComprovanteRepasse as jest.Mock).mockResolvedValue(
        mockRepasse
      );

      const result = await actionGerarRepasse(
        1,
        'https://example.com/comprovante.pdf',
        '2024-01-15'
      );

      expect(ObrigacoesService.registrarComprovanteRepasse).toHaveBeenCalledWith(
        1,
        'https://example.com/comprovante.pdf',
        '2024-01-15'
      );
      expect(revalidatePath).toHaveBeenCalledWith('/app/financeiro');
      expect(result.success).toBe(true);
    });

    it('deve retornar erro quando service falha', async () => {
      (ObrigacoesService.registrarComprovanteRepasse as jest.Mock).mockRejectedValue(
        new Error('Campos obrigatórios')
      );

      const result = await actionGerarRepasse(1, '', '');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('Resumos e Alertas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionObterResumoObrigacoes', () => {
    it('deve buscar parcelas pendentes, inconsistências e repasses em paralelo', async () => {
      const mockParcelas = [
        criarParcelaMock({ status: 'pendente', data_vencimento: '2024-01-01' }),
        criarParcelaMock({ status: 'pendente', data_vencimento: '2024-01-10' }),
      ];
      const mockInconsistencias = [criarInconsistenciaMock()];
      const mockRepasses = [criarRepasseMock()];

      (ObrigacoesService.listarParcelasComLancamentos as jest.Mock).mockResolvedValue(
        mockParcelas
      );
      (ObrigacoesService.detectarInconsistencias as jest.Mock).mockResolvedValue(mockInconsistencias);
      (ObrigacoesService.listarRepassesPendentes as jest.Mock).mockResolvedValue(
        mockRepasses
      );

      const result = await actionObterResumoObrigacoes();

      expect(ObrigacoesService.listarParcelasComLancamentos).toHaveBeenCalled();
      expect(ObrigacoesService.detectarInconsistencias).toHaveBeenCalled();
      expect(ObrigacoesService.listarRepassesPendentes).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('deve calcular métricas (totalVencidas, valorTotalVencido)', async () => {
      const _hoje = new Date().toISOString().split('T')[0];
      const dataPassada = '2024-01-01';

      const mockParcelas = [
        criarParcelaMock({
          status: 'pendente',
          dataVencimento: dataPassada,
          valorBrutoCreditoPrincipal: 1000,
        }),
        criarParcelaMock({
          status: 'pendente',
          dataVencimento: dataPassada,
          valorBrutoCreditoPrincipal: 2000,
        }),
      ];

      (ObrigacoesService.listarParcelasComLancamentos as jest.Mock).mockResolvedValue(
        mockParcelas
      );
      (ObrigacoesService.detectarInconsistencias as jest.Mock).mockResolvedValue([]);
      (ObrigacoesService.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      const result = await actionObterResumoObrigacoes();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resumo.totalVencidas).toBeGreaterThan(0);
        expect(result.data.resumo.valorTotalVencido).toBeGreaterThan(0);
      }
    });

    it('deve gerar alertas por tipo', async () => {
      const mockParcelas = [
        criarParcelaMock({
          status: 'pendente',
          dataVencimento: '2024-01-01',
        }),
      ];
      const mockInconsistencias = [
        criarInconsistenciaMock({ tipo: 'valor_divergente' }),
      ];

      (ObrigacoesService.listarParcelasComLancamentos as jest.Mock).mockResolvedValue(
        mockParcelas
      );
      (ObrigacoesService.detectarInconsistencias as jest.Mock).mockResolvedValue(mockInconsistencias);
      (ObrigacoesService.listarRepassesPendentes as jest.Mock).mockResolvedValue([]);

      const result = await actionObterResumoObrigacoes();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alertas).toBeDefined();
        expect(Array.isArray(result.data.alertas)).toBe(true);
      }
    });
  });

  describe('actionObterAlertasFinanceiros', () => {
    it('deve buscar inconsistências e mapear para alertas', async () => {
      const mockInconsistencias = [
        criarInconsistenciaMock({
          tipo: 'valor_divergente',
          parcela_id: 1,
          descricao: 'Valor divergente',
        }),
      ];

      (ObrigacoesService.detectarInconsistencias as jest.Mock).mockResolvedValue(mockInconsistencias);

      const result = await actionObterAlertasFinanceiros();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].tipo).toBe('inconsistencia');
        expect(result.data[0].nivel).toBeDefined();
        expect(result.data[0].mensagem).toBeDefined();
      }
    });

    it('deve incluir tipo inconsistencia nos alertas', async () => {
      const mockInconsistencias = [
        criarInconsistenciaMock({ tipo: 'parcela_sem_lancamento' }),
      ];

      (ObrigacoesService.detectarInconsistencias as jest.Mock).mockResolvedValue(mockInconsistencias);

      const result = await actionObterAlertasFinanceiros();

      expect(result.success).toBe(true);
      if (result.success && result.data.length > 0) {
        expect(result.data[0].tipo).toBe('inconsistencia');
      }
    });
  });

  describe('actionListarObrigacoes', () => {
    it('deve listar parcelas com lançamentos', async () => {
      const mockParcelas = [
        criarParcelaMock({ id: 1 }),
        criarParcelaMock({ id: 2 }),
      ];

      (ObrigacoesService.listarParcelasComLancamentos as jest.Mock).mockResolvedValue(
        mockParcelas
      );

      const result = await actionListarObrigacoes({
        pagina: 1,
        limite: 10,
      });

      expect(ObrigacoesService.listarParcelasComLancamentos).toHaveBeenCalledWith({
        pagina: 1,
        limite: 10,
      });
      expect(result.success).toBe(true);
    });

    it('deve calcular resumo básico', async () => {
      const mockParcelas = [
        criarParcelaMock({ valor: 1000, status: 'pendente' }),
        criarParcelaMock({ valor: 2000, status: 'pago' }),
      ];

      (ObrigacoesService.listarParcelasComLancamentos as jest.Mock).mockResolvedValue(
        mockParcelas
      );

      const result = await actionListarObrigacoes({
        pagina: 1,
        limite: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resumo).toBeDefined();
        expect(result.data.meta.total).toBe(2);
      }
    });
  });
});
