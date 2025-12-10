import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { ObrigacoesRepository } from './repository';
// import { LancamentosRepository } from '../lancamentos/repository';
import { SplitPagamento, ParcelaObrigacao, StatusRepasse } from './domain';
import { Lancamento } from '../lancamentos/domain';

// ============================================================================
// Service Implementation
// ============================================================================

export const ObrigacoesService = {

    /**
     * Calcula o split de pagamento para uma parcela
     * Regras:
     * - Sucumbência: 100% escritório
     * - Contratuais: % sobre o êxito (principal + juros)
     * - Restante: Cliente
     */
    calcularSplitPagamento(
        valorPrincipal: number,
        honorariosSucumbenciais: number,
        percentualHonorariosContratuais: number = 30 // Default 30%
    ): SplitPagamento {
        // Honorários contratuais incidem sobre o valor principal (êxito)
        const valorHonorariosContratuais = valorPrincipal * (percentualHonorariosContratuais / 100);

        // Valor líquido para o cliente é o principal menos a parte do escritório
        const valorRepasseCliente = valorPrincipal - valorHonorariosContratuais;

        // Total do escritório = Contratuais + Sucumbenciais
        const valorEscritorio = valorHonorariosContratuais + honorariosSucumbenciais;

        // Valor total da parcela
        const valorTotal = valorPrincipal + honorariosSucumbenciais;

        return {
            valorTotal,
            valorPrincipal,
            honorariosContratuais: valorHonorariosContratuais,
            honorariosSucumbenciais: honorariosSucumbenciais,
            valorRepasseCliente,
            valorEscritorio,
            percentualEscritorio: percentualHonorariosContratuais,
            percentualCliente: 100 - percentualHonorariosContratuais
        };
    },

    /**
     * Sincroniza todas as parcelas de um acordo
     */
    async sincronizarAcordo(acordoId: number, forcar: boolean = false): Promise<{ sucesso: boolean; mensagem: string }> {
        const supabase = createServiceClient();

        try {
            // 1. Buscar parcelas do acordo
            const { data: parcelas, error } = await supabase
                .from('parcelas')
                .select('id')
                .eq('acordo_condenacao_id', acordoId);

            if (error) throw new Error(error.message);
            if (!parcelas || parcelas.length === 0) return { sucesso: true, mensagem: 'Acordo sem parcelas.' };

            // 2. Sincronizar cada parcela
            let sucessos = 0;
            let erros = 0;

            // Executar em série para não sobrecarregar disparos se forem muitas
            for (const p of parcelas) {
                const res = await this.sincronizarParcela(p.id, forcar);
                if (res.sucesso) sucessos++;
                else erros++;
            }

            if (erros > 0) {
                return { sucesso: false, mensagem: `Sincronizado com avisos: ${sucessos} sucessos, ${erros} falhas/ignorados.` };
            }

            return { sucesso: true, mensagem: `Acordo sincronizado. ${sucessos} parcelas processadas.` };

        } catch (e: any) {
            return { sucesso: false, mensagem: e.message };
        }
    },


    /**
     * Sincroniza uma parcela específica para o financeiro
     * Atua como orquestrador chamando o serviço de integração do backend
     */
    async sincronizarParcela(parcelaId: number, forcar: boolean = false): Promise<{ sucesso: boolean; mensagem: string }> {
        try {
            // Import dinâmico ou direto do serviço de backend para evitar ciclo se houver, 
            // mas aqui estamos no core, dependendo do backend service.
            // O comentário sugere reutilizar a lógica existente.

            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { sincronizarParcelaParaFinanceiro } = require('@/backend/financeiro/obrigacoes/services/integracao/obrigacoes-integracao.service');

            const resultado = await sincronizarParcelaParaFinanceiro(parcelaId, forcar);

            return {
                sucesso: resultado.sucesso,
                mensagem: resultado.mensagem
            };

        } catch (e: any) {
            console.error(e);
            return { sucesso: false, mensagem: e.message };
        }
    },



    // ... (existing methods above)

    /**
     * Busca repasses pendentes de transferência
     */
    async listarRepassesPendentes(): Promise<ParcelaObrigacao[]> {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('parcelas')
            .select('*')
            .eq('status_repasse', 'pendente_transferencia')
            .gt('valor_repasse_cliente', 0)
            .order('data_vencimento');

        if (error) throw new Error(`Erro ao listar repasses: ${error.message}`);

        // Mapear para domínio (simplificado, idealmente usaria mapper)
        return (data || []).map((p: any) => ({
            id: p.id,
            acordoId: p.acordo_condenacao_id,
            numeroParcela: p.numero_parcela,
            valor: p.valor_bruto_credito_principal + (p.honorarios_sucumbenciais || 0),
            valorBrutoCreditoPrincipal: p.valor_bruto_credito_principal,
            honorariosContratuais: p.honorarios_contratuais,
            honorariosSucumbenciais: p.honorarios_sucumbenciais,
            valorRepasseCliente: p.valor_repasse_cliente,
            dataVencimento: p.data_vencimento,
            dataPagamento: p.data_efetivacao,
            status: p.status,
            statusRepasse: p.status_repasse,
            lancamentoId: null, // Não vem direto
            declaracaoPrestacaoContasUrl: p.declaracao_prestacao_contas_url,
            comprovanteRepasseUrl: p.comprovante_repasse_url,
            dataRepasse: p.data_repasse
        }));
    },

    /**
     * Calcula totais repassados por cliente
     */
    async calcularTotalRepassadoPorCliente(clienteId: number): Promise<number> {
        const supabase = createServiceClient();

        // Isso idealmente seria uma RPC ou query complexa
        // Fazendo via JS por simplicidade inicial
        const { data, error } = await supabase
            .from('parcelas')
            .select('valor_repasse_cliente, acordos_condenacoes!inner(cliente_id)')
            .eq('acordos_condenacoes.cliente_id', clienteId)
            .eq('status_repasse', 'repassado');

        if (error) throw new Error(`Erro ao calcular total repassado: ${error.message}`);

        return (data || []).reduce((acc: number, curr: any) => acc + (curr.valor_repasse_cliente || 0), 0);
    },

    async registrarDeclaracao(parcelaId: number, urlArquivo: string): Promise<void> {
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('parcelas')
            .update({
                declaracao_prestacao_contas_url: urlArquivo,
                status_repasse: 'pendente_transferencia',
                updated_at: new Date().toISOString()
            })
            .eq('id', parcelaId);

        if (error) throw new Error(`Erro ao registrar declaração: ${error.message}`);
    },

    /**
     * Registra o comprovante de repasse (Passo 2 do Repasse - Final)
     */
    async registrarComprovanteRepasse(parcelaId: number, urlArquivo: string, dataRepasse: string): Promise<void> {
        const supabase = createServiceClient();

        // Validar se status atual permite (deve estar pendente_transferencia)
        // Mas para simplificar, vamos permitir atualizar direto.

        const { error } = await supabase
            .from('parcelas')
            .update({
                comprovante_repasse_url: urlArquivo,
                data_repasse: dataRepasse,
                status_repasse: 'repassado',
                updated_at: new Date().toISOString()
            })
            .eq('id', parcelaId);


        if (error) throw new Error(`Erro ao registrar repasse: ${error.message}`);
    },

    /**
     * Validações de integridade
     */
    validarIntegridade(parcela: ParcelaObrigacao, direcao: 'recebimento' | 'pagamento'): { valido: boolean; erros: string[] } {
        const erros: string[] = [];

        // 1. Parcela recebida/paga deve ter forma de pagamento (na parcela ou lançamento)
        if (['recebida', 'paga'].includes(parcela.status)) {
            // Verifica na própria parcela primeiro
            const temFormaPagamento = !!parcela.formaPagamento || !!parcela.lancamento?.formaPagamento;
            if (!temFormaPagamento) {
                erros.push(`Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) está ${parcela.status} mas não possui forma de pagamento.`);
            }
        }

        // 2. Regra de Repasse: Se há repasse cliente, verificar status
        if (direcao === 'recebimento' && parcela.valorRepasseCliente > 0) {
            // Ex: Se recebida, status repasse não pode ser 'nao_aplicavel' se houver valor > 0 (assumindo logica)
            // Ou apenas garantir que statusRepasse é válido
            const statusValidosRepasse = ['pendente', 'pendente_transferencia', 'repassado'];
            // Se o valorRepasseCliente > 0, deve haver um status de repasse que faça sentido
            if (parcela.status === 'recebida' && !statusValidosRepasse.includes(parcela.statusRepasse)) {
                erros.push(`Parcela ${parcela.numeroParcela} (ID: ${parcela.id}) tem valor de repasse mas status de repasse inválido (${parcela.statusRepasse}).`);
            }
        }

        // 3. Não permitir exclusão se repassado
        if (parcela.statusRepasse === 'repassado') {
            const lancamento = parcela.lancamento;
            if (lancamento && lancamento.status === 'cancelado') {
                erros.push('Não é permitido cancelar lançamento de parcela já repassada ao cliente.');
            }
        }

        return { valido: erros.length === 0, erros };
    }
};
