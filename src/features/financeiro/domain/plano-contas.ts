/**
 * Domínio do Plano de Contas
 * Entidades e regras de negócio puras (sem dependência de infraestrutura)
 */

// ============================================================================
// Tipos e Interfaces (From Types)
// ============================================================================

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

export interface ListarPlanoContasParams extends PlanoContasFilters {
    pagina?: number;
    limite?: number;
}

export interface ListarPlanoContasResponse {
    items: PlanoContaComPai[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export type PlanoConta = PlanoContas;

export interface PlanoContaHierarquico extends PlanoContas {
    filhas?: PlanoContaHierarquico[];
    // Compatibility if needed, but domain uses filhas.
    // Export script uses filhos, I will update export script to use filhas.
}

// ============================================================================
// Lists/Selects & Constants (From Types)
// ============================================================================

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

// ============================================================================
// Regras de Negócio
// ============================================================================

/**
 * Valida se um código de conta é válido
 * Formato esperado: X.X.X.X... (números separados por ponto)
 */
export function validarCodigoConta(codigo: string): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!codigo || codigo.trim().length === 0) {
        erros.push('Código é obrigatório');
        return { valido: false, erros };
    }

    const regex = /^\d+(\.\d+)*$/;
    if (!regex.test(codigo)) {
        erros.push('Código deve seguir o formato X.X.X (números separados por ponto)');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se uma conta pode ser criada
 */
export function validarCriacaoConta(dados: CriarPlanoContaDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    const validacaoCodigo = validarCodigoConta(dados.codigo);
    erros.push(...validacaoCodigo.erros);

    if (!dados.nome || dados.nome.trim().length === 0) {
        erros.push('Nome é obrigatório');
    }

    if (!dados.tipoConta) {
        erros.push('Tipo de conta é obrigatório');
    }

    if (!dados.natureza) {
        erros.push('Natureza é obrigatória');
    }

    if (!dados.nivel) {
        erros.push('Nível é obrigatório');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se uma conta pode ser excluída
 */
export function validarExclusaoConta(conta: PlanoContas, temFilhas: boolean, temLancamentos: boolean): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (temFilhas) {
        erros.push('Conta possui contas filhas. Exclua-as primeiro.');
    }

    if (temLancamentos) {
        erros.push('Conta possui lançamentos vinculados. Não pode ser excluída.');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida se um lançamento pode usar uma conta específica
 */
export function validarLancamentoConta(
    conta: PlanoContas,
    tipoLancamento: 'receita' | 'despesa'
): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Apenas contas analíticas podem receber lançamentos
    if (conta.nivel !== 'analitica') {
        erros.push('Apenas contas analíticas podem receber lançamentos');
    }

    // Verificar compatibilidade de tipo
    const tipoCompativel =
        (tipoLancamento === 'receita' && conta.tipo === 'receita') ||
        (tipoLancamento === 'despesa' && conta.tipo === 'despesa');

    if (!tipoCompativel) {
        erros.push(`Conta do tipo ${conta.tipo} não pode receber lançamentos de ${tipoLancamento}`);
    }

    // Conta deve estar ativa
    if (!conta.ativo) {
        erros.push('Conta inativa não pode receber lançamentos');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Extrai o código do pai de um código de conta
 * Ex: "1.2.3" -> "1.2"
 */
export function extrairCodigoPai(codigo: string): string | null {
    const partes = codigo.split('.');
    if (partes.length <= 1) return null;
    return partes.slice(0, -1).join('.');
}

/**
 * Verifica se um código é filho de outro
 * Ex: "1.2.3" é filho de "1.2"
 */
export function ehFilhoDe(codigoFilho: string, codigoPai: string): boolean {
    return codigoFilho.startsWith(codigoPai + '.');
}

/**
 * Calcula o nível de profundidade de uma conta baseado no código
 * Ex: "1" -> 1, "1.2" -> 2, "1.2.3" -> 3
 */
export function calcularNivelProfundidade(codigo: string): number {
    return codigo.split('.').length;
}

/**
 * Gera próximo código sequencial para um nível
 * Ex: Se existem "1.1", "1.2", "1.3" -> retorna "1.4"
 */
export function gerarProximoCodigo(codigoPai: string | null, codigosExistentes: string[]): string {
    if (!codigoPai) {
        // Nível raiz
        const numerosRaiz = codigosExistentes
            .filter(c => !c.includes('.'))
            .map(c => parseInt(c, 10))
            .filter(n => !isNaN(n));

        const maximo = numerosRaiz.length > 0 ? Math.max(...numerosRaiz) : 0;
        return String(maximo + 1);
    }

    // Subconta
    const prefixo = codigoPai + '.';
    const filhos = codigosExistentes
        .filter(c => c.startsWith(prefixo) && c.substring(prefixo.length).split('.').length === 1)
        .map(c => parseInt(c.substring(prefixo.length), 10))
        .filter(n => !isNaN(n));

    const maximo = filhos.length > 0 ? Math.max(...filhos) : 0;
    return `${codigoPai}.${maximo + 1}`;
}

/**
 * Organiza contas em estrutura hierárquica
 */
export function organizarHierarquia(contas: PlanoContas[]): PlanoContas[] {
    const mapa = new Map<number, PlanoContas & { filhas: PlanoContas[] }>();

    // Primeiro passo: criar mapa com array de filhas
    contas.forEach(conta => {
        mapa.set(conta.id, { ...conta, filhas: [] });
    });

    // Segundo passo: vincular filhas aos pais
    const raizes: PlanoContas[] = [];

    contas.forEach(conta => {
        const contaComFilhas = mapa.get(conta.id)!;

        if (conta.contaPaiId && mapa.has(conta.contaPaiId)) {
            mapa.get(conta.contaPaiId)!.filhas.push(contaComFilhas);
        } else {
            raizes.push(contaComFilhas);
        }
    });

    // Ordenar por código em cada nível
    const ordenarRecursivo = (lista: PlanoContas[]): PlanoContas[] => {
        return lista
            .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }))
            .map(item => ({
                ...item,
                filhas: item.filhas ? ordenarRecursivo(item.filhas) : []
            }));
    };

    return ordenarRecursivo(raizes);
}

/**
 * Achata uma estrutura hierárquica para lista plana com indentação
 */
export function achatarHierarquia(contas: PlanoContas[], nivel: number = 0): (PlanoContas & { nivel: number })[] {
    const resultado: (PlanoContas & { nivel: number })[] = [];

    contas.forEach(conta => {
        resultado.push({ ...conta, nivel });
        if (conta.filhas && conta.filhas.length > 0) {
            resultado.push(...achatarHierarquia(conta.filhas, nivel + 1));
        }
    });

    return resultado;
}

/**
 * Sugere conta padrão para um tipo de lançamento
 */
export function sugerirContaPadrao(
    contas: PlanoContas[],
    tipo: 'receita' | 'despesa'
): PlanoContas | null {
    // Primeiro, buscar conta analítica ativa do tipo correspondente
    const contasCompatíveis = contas.filter(
        c => c.tipo === tipo && c.nivel === 'analitica' && c.ativo
    );

    // Ordenar por código e retornar a primeira
    contasCompatíveis.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

    return contasCompatíveis[0] || null;
}
