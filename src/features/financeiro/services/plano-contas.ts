import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { PlanoContas } from '../types/plano-contas';

export const PlanoContasService = {
    async listarContas(): Promise<PlanoContas[]> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .order('codigo');

        if (error) throw new Error(`Erro ao listar plano de contas: ${error.message}`);

        return (data || []).map((c: any) => ({
            id: c.id,
            codigo: c.codigo,
            nome: c.nome,
            tipo: c.tipo
        }));
    },

    async buscarPorId(id: number): Promise<PlanoContas | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            id: data.id,
            codigo: data.codigo,
            nome: data.nome,
            tipo: data.tipo
        };
    }
};
