import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { Conciliacao } from './domain';

export const ConciliacaoRepository = {
    async listarConciliacoes(): Promise<Conciliacao[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('conciliacoes')
            .select('*')
            .order('data_conciliacao', { ascending: false });

        if (error) {
            // Se tabela não existir (ainda não criada no backend), retorna vazio ou mock
            console.warn('Tabela conciliacoes pode não existir', error);
            return [];
        }

        return (data || []).map((c: any) => ({
            id: c.id,
            data_conciliacao: c.data_conciliacao,
            saldo_banco: c.saldo_banco,
            saldo_sistema: c.saldo_sistema,
            diferenca: c.diferenca
        }));
    },

    async buscarExtratosBancarios(contaBancariaId: number, dataInicio: string, dataFim: string) {
        // Mock ou implementação real
        return [];
    }
};
