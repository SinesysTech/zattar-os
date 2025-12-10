// Domínio
export type TipoContaContabil = 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio_liquido';
export type NaturezaConta = 'devedora' | 'credora';
export type NivelConta = 'sintetica' | 'analitica';

export interface PlanoContas {
    id: number;
    codigo: string;
    nome: string;
    descricao?: string | null;
    tipo: TipoContaContabil; // mapped from 'tipo' in DB or 'tipoConta' in logic
    tipoConta: TipoContaContabil; // alias for consistency
    natureza: NaturezaConta;
    nivel: NivelConta;
    contaPaiId?: number | null;
    ordemExibicao?: number | null;
    ativo: boolean;
    
    // Virtual
    contaPai?: PlanoContas | null;
    filhas?: PlanoContas[];
}

export interface PlanoContaComPai extends PlanoContas {
    nomePai?: string;
}

export interface CriarPlanoContaDTO {
    codigo: string;
    nome: string;
    descricao?: string;
    tipoConta: TipoContaContabil;
    natureza: NaturezaConta;
    nivel: NivelConta;
    contaPaiId?: number | null;
    ordemExibicao?: number | null;
    ativo?: boolean;
}

export interface AtualizarPlanoContaDTO extends Partial<CriarPlanoContaDTO> {
    id: number;
}

export interface PlanoContasFilters {
    tipoConta?: TipoContaContabil | TipoContaContabil[];
    nivel?: NivelConta | NivelConta[];
    ativo?: boolean;
    busca?: string;
}

// Lists/Selects
export const TIPO_CONTA_LABELS: Record<TipoContaContabil, string> = {
    ativo: 'Ativo',
    passivo: 'Passivo',
    receita: 'Receita',
    despesa: 'Despesa',
    patrimonio_liquido: 'Patrimônio Líquido',
};

export const NATUREZA_LABELS: Record<NaturezaConta, string> = {
    devedora: 'Devedora',
    credora: 'Credora',
};

export const NIVEL_LABELS: Record<NivelConta, string> = {
    sintetica: 'Sintética',
    analitica: 'Analítica',
};

export const getNaturezaPadrao = (tipo: TipoContaContabil): NaturezaConta => {
    switch (tipo) {
        case 'ativo':
        case 'despesa':
            return 'devedora';
        case 'passivo':
        case 'receita':
        case 'patrimonio_liquido':
            return 'credora';
    }
};
