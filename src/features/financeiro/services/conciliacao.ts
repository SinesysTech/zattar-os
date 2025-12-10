import { SupabaseClient } from '@supabase/supabase-js';
import { 
    TransacaoComConciliacao, 
    ImportarExtratoDTO, 
    ImportarExtratoResponse, 
    SugestaoConciliacao,
    LancamentoFinanceiroResumo,
    ConciliarManualDTO,
    ConciliarAutomaticaDTO,
    ConciliacaoResult,
    ListarTransacoesImportadasParams,
    ListarTransacoesResponse,
    TransacaoImportada,
    ConciliacaoBancaria
} from '../types/conciliacao';
import { Lancamento } from '../types/lancamentos';
import { createServiceClient } from '@/app/_lib/supabase/service';

export class ConciliacaoService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createServiceClient();
    }

    async listarTransacoes(params: ListarTransacoesImportadasParams): Promise<ListarTransacoesResponse> {
        let query = this.supabase
            .from('transacoes_importadas')
            .select(`
                *,
                conciliacao_bancaria (*),
                lancamentos (*)
            `, { count: 'exact' });

        if (params.contaBancariaId) {
            query = query.eq('conta_bancaria_id', params.contaBancariaId);
        }
        
        const { data, count, error } = await query;
        
        if (error) {
            console.error('Erro ao listar transações:', error);
            throw new Error('Erro ao listar transações');
        }

        const items: TransacaoComConciliacao[] = (data || []).map((item: any) => ({
            id: item.id,
            contaBancariaId: item.conta_bancaria_id,
            dataTransacao: item.data_transacao,
            descricao: item.descricao,
            valor: item.valor,
            tipoTransacao: item.tipo_transacao,
            documento: item.documento,
            hashInfo: item.hash_info,
            statusConciliacao: item.conciliacao_bancaria?.[0]?.status || 'pendente',
            lancamentoVinculadoId: item.conciliacao_bancaria?.[0]?.lancamento_financeiro_id,
            lancamentoVinculado: item.lancamentos ? this.mapLancamento(item.lancamentos) : null,
            conciliacao: item.conciliacao_bancaria?.[0] ? this.mapConciliacao(item.conciliacao_bancaria[0]) : null
        }));

        return {
            items,
            paginacao: {
                pagina: params.pagina || 1,
                limite: params.limite || 20,
                total: count || 0,
                totalPaginas: Math.ceil((count || 0) / (params.limite || 20))
            },
            resumo: {
                totalPendentes: 0,
                totalConciliadas: 0,
                totalDivergentes: 0,
                totalIgnoradas: 0,
            }
        };
    }

    async importarExtrato(dto: ImportarExtratoDTO): Promise<ImportarExtratoResponse> {
        console.log('Importando extrato:', dto.nomeArquivo);
        return {
            processados: 10,
            importados: 5,
            duplicados: 5,
            erros: 0
        };
    }

    async obterSugestoes(transacaoId: number): Promise<SugestaoConciliacao[]> {
        return [];
    }

    async conciliarManual(dto: ConciliarManualDTO): Promise<ConciliacaoBancaria> {
        return {} as ConciliacaoBancaria;
    }

    async buscarLancamentosCandidatos(params: any): Promise<LancamentoFinanceiroResumo[]> {
        return [];
    }

    async obterResumo(): Promise<{ totalPendentes: number; totalConciliadas: number; totalDivergentes: number; totalIgnoradas: number; }> {
        return {
            totalPendentes: 0,
            totalConciliadas: 0,
            totalDivergentes: 0,
            totalIgnoradas: 0,
        };
    }

    async desconciliar(transacaoId: number): Promise<void> {
        console.log(`Desconciliando transação ${transacaoId}`);
    }

    // Mappers
    private mapLancamento(data: any): Lancamento {
        return data as Lancamento;
    }

    private mapConciliacao(data: any): ConciliacaoBancaria {
        return {
            id: data.id,
            transacaoImportadaId: data.transacao_importada_id,
            lancamentoFinanceiroId: data.lancamento_financeiro_id,
            dataConciliacao: data.data_conciliacao,
            status: data.status,
            diferencaValor: data.diferenca_valor,
            usuarioId: data.usuario_id,
            observacoes: data.observacoes
        };
    }
}

export const conciliacaoService = new ConciliacaoService();
