import { createServiceClient } from '@/app/_lib/supabase/service';
import { 
    PlanoContas, 
    CriarPlanoContaDTO, 
    AtualizarPlanoContaDTO, 
    PlanoContasFilters 
} from '../types/plano-contas';

export const PlanoContasService = {
    async listarContas(filters?: PlanoContasFilters): Promise<PlanoContas[]> {
        const supabase = createServiceClient();
        let query = supabase
            .from('plano_contas')
            .select(`
                *,
                conta_pai:plano_contas!conta_pai_id(id, codigo, nome)
            `)
            .order('codigo');

        if (filters?.tipoConta) {
            if (Array.isArray(filters.tipoConta)) {
                query = query.in('tipo', filters.tipoConta);
            } else {
                query = query.eq('tipo', filters.tipoConta);
            }
        }
        
        if (filters?.nivel) {
             // Assuming nivel is stored or derived? If not in DB, filter in JS (less efficient)
             // For now assuming 'nivel' column exists
             if (Array.isArray(filters.nivel)) {
                query = query.in('nivel', filters.nivel);
             } else {
                 query = query.eq('nivel', filters.nivel);
             }
        }

        if (filters?.ativo !== undefined) {
            query = query.eq('ativo', filters.ativo);
        }

        const { data, error } = await query;

        if (error) throw new Error(`Erro ao listar plano de contas: ${error.message}`);

        return (data || []).map((c: any) => this.mapRecordToModel(c));
    },

    async buscarPorId(id: number): Promise<PlanoContas | null> {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('plano_contas')
            .select(`
                *,
                conta_pai:plano_contas!conta_pai_id(id, codigo, nome)
            `)
            .eq('id', id)
            .single();

        if (error) return null;

        return this.mapRecordToModel(data);
    },

    async criar(dto: CriarPlanoContaDTO): Promise<PlanoContas> {
        const supabase = createServiceClient();
        const record = this.mapDtoToRecord(dto);
        
        const { data, error } = await supabase
            .from('plano_contas')
            .insert(record)
            .select()
            .single();

        if (error) throw new Error(`Erro ao criar conta: ${error.message}`);
        return this.mapRecordToModel(data);
    },

    async atualizar(dto: AtualizarPlanoContaDTO): Promise<PlanoContas> {
        const supabase = createServiceClient();
        const record = this.mapDtoToRecord(dto);
        const { id, ...updateData } = record as any; // remove id from update payload if present/duplicated

        const { data, error } = await supabase
            .from('plano_contas')
            .update(updateData)
            .eq('id', dto.id)
            .select()
            .single();

        if (error) throw new Error(`Erro ao atualizar conta: ${error.message}`);
        return this.mapRecordToModel(data);
    },

    async excluir(id: number): Promise<void> {
        const supabase = createServiceClient();
        const { error } = await supabase
            .from('plano_contas')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao excluir conta: ${error.message}`);
    },

    // Mappers
    mapRecordToModel(record: any): PlanoContas {
        return {
            id: record.id,
            codigo: record.codigo,
            nome: record.nome,
            descricao: record.descricao,
            tipo: record.tipo,
            tipoConta: record.tipo,
            natureza: record.natureza,
            nivel: record.nivel,
            contaPaiId: record.conta_pai_id,
            ordemExibicao: record.ordem_exibicao,
            ativo: record.ativo,
            contaPai: record.conta_pai ? {
                id: record.conta_pai.id,
                codigo: record.conta_pai.codigo,
                nome: record.conta_pai.nome,
                // Partial implementation for nested
            } as any : null
        };
    },

    mapDtoToRecord(dto: Partial<CriarPlanoContaDTO>): any {
        const record: any = {};
        if (dto.codigo !== undefined) record.codigo = dto.codigo;
        if (dto.nome !== undefined) record.nome = dto.nome;
        if (dto.descricao !== undefined) record.descricao = dto.descricao;
        if (dto.tipoConta !== undefined) record.tipo = dto.tipoConta;
        if (dto.natureza !== undefined) record.natureza = dto.natureza;
        if (dto.nivel !== undefined) record.nivel = dto.nivel;
        if (dto.contaPaiId !== undefined) record.conta_pai_id = dto.contaPaiId;
        if (dto.ordemExibicao !== undefined) record.ordem_exibicao = dto.ordemExibicao;
        if (dto.ativo !== undefined) record.ativo = dto.ativo;
        return record;
    }
};
