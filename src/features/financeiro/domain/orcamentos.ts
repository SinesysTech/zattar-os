/**
 * Dominio de Orcamentos
 * Entidades e regras de negocio puras (sem dependencia de infraestrutura)
 */

// ============================================================================
// Enums e tipos literais (From Types)
// ============================================================================

export type StatusOrcamento = 'rascunho' | 'aprovado' | 'em_execucao' | 'encerrado' | 'cancelado';
export type PeriodoOrcamento = 'mensal' | 'trimestral' | 'semestral' | 'anual';

// ============================================================================
// Interfaces - Entidades principais (From Types)
// ============================================================================

export interface Orcamento {
    id: number;
    nome: string;
    descricao?: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
    status: StatusOrcamento;
    valorTotal: number;
    observacoes?: string;
    aprovadoPor?: string;
    aprovadoEm?: string;
    encerradoPor?: string;
    encerradoEm?: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface OrcamentoItem {
    id: number;
    orcamentoId: number;
    contaContabilId: number;
    centroCustoId?: number;
    descricao: string;
    valorPrevisto: number;
    valorRealizado: number;
    observacoes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrcamentoItemComDetalhes extends OrcamentoItem {
    contaContabil?: {
        id: number;
        codigo: string;
        nome: string;
        tipo: string;
    };
    centroCusto?: {
        id: number;
        codigo: string;
        nome: string;
    };
    percentualExecutado: number;
    desvio: number;
    desvioPercentual: number;
    // Alias para compatibilidade
    valorOrcado?: number;
}

export interface OrcamentoComItens extends Orcamento {
    itens: OrcamentoItem[];
}

export interface OrcamentoComDetalhes extends Orcamento {
    itens: OrcamentoItemComDetalhes[];
    resumo?: ResumoOrcamentario;
}

// ============================================================================
// DTOs - Criação e Atualização (From Types)
// ============================================================================

export interface CriarOrcamentoDTO {
    nome: string;
    descricao?: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
    observacoes?: string;
    itens?: CriarOrcamentoItemDTO[];
}

export interface AtualizarOrcamentoDTO {
    nome?: string;
    descricao?: string;
    observacoes?: string;
    dataInicio?: string;
    dataFim?: string;
}

export interface CriarOrcamentoItemDTO {
    contaContabilId: number;
    centroCustoId?: number;
    descricao: string;
    valorPrevisto: number;
    observacoes?: string;
}

export interface AtualizarOrcamentoItemDTO {
    descricao?: string;
    valorPrevisto?: number;
    observacoes?: string;
}

export interface AprovarOrcamentoDTO {
    observacoes?: string;
}

export interface EncerrarOrcamentoDTO {
    observacoes?: string;
}

export interface DuplicarOrcamentoDTO {
    nome: string;
    ano: number;
    periodo: PeriodoOrcamento;
    dataInicio: string;
    dataFim: string;
}

// ============================================================================
// Interfaces - Análise e Comparativos (From Types)
// ============================================================================

export interface ResumoOrcamentario {
    totalPrevisto: number;
    totalRealizado: number;
    saldo: number;
    percentualExecutado: number;
    itensAcimaMeta: number;
    itensAbaixoMeta: number;
    itensDentroMeta: number;
    // Aliases para compatibilidade
    totalOrcado?: number;
    variacao?: number;
    variacaoPercentual?: number;
    percentualRealizacao?: number;
}

export interface AnaliseOrcamentariaItem {
    id: number;
    descricao: string;
    contaContabil: string | { id: number; codigo: string; nome: string };
    centroCusto?: string | { id: number; codigo: string; nome: string };
    valorPrevisto: number;
    valorRealizado: number;
    desvio: number;
    desvioPercentual: number;
    status: 'dentro_meta' | 'acima_meta' | 'abaixo_meta';
    // Aliases para compatibilidade
    valorOrcado?: number;
    variacao?: number;
    variacaoPercentual?: number;
    percentualRealizacao?: number;
    mes?: number;
}

export interface AlertaDesvio {
    itemId: number;
    descricao: string;
    tipo: 'critico' | 'alerta' | 'informativo';
    mensagem: string;
    desvioPercentual: number;
    // Propriedades adicionais para compatibilidade
    severidade?: 'baixa' | 'media' | 'alta' | 'critica';
    contaContabil?: { id: number; codigo: string; nome: string } | string;
    centroCusto?: { id: number; codigo: string; nome: string } | string;
    valorOrcado?: number;
    valorRealizado?: number;
    variacao?: number;
}

export interface ProjecaoItem {
    mes: string;
    valorPrevisto: number;
    valorRealizado: number;
    valorProjetado: number;
    // Propriedades adicionais para compatibilidade
    contaContabil?: { id: number; codigo: string; nome: string } | string;
    realizadoAtual?: number;
    projecaoFinal?: number;
    variacaoProjetada?: number;
    tendencia?: 'positiva' | 'neutra' | 'negativa';
}

export interface AnaliseOrcamentaria {
    itens: AnaliseOrcamentariaItem[];
    resumo: ResumoOrcamentario;
    alertas: AlertaDesvio[];
    evolucao?: ProjecaoItem[];
}

export interface EvolucaoMensal {
    mes: number;
    mesNome: string;
    valorPrevisto: number;
    valorRealizado: number;
    percentualExecutado: number;
}

export type ItemAnalise = AnaliseOrcamentariaItem;

export type AlertaOrcamentario = AlertaDesvio;

export interface ProjecaoOrcamentaria {
    projecao: ProjecaoItem[];
    resumo: ResumoOrcamentario;
}

export interface ComparativoOrcamento {
    orcamentoAtual: OrcamentoComDetalhes;
    orcamentoAnterior?: OrcamentoComDetalhes;
    variacoes: {
        totalPrevisto: number;
        totalRealizado: number;
        percentualVariacao: number;
    };
}

// ============================================================================
// Interfaces - Listagem e Filtros (From Types)
// ============================================================================

export interface ListarOrcamentosParams {
    pagina?: number;
    limite?: number;
    busca?: string;
    ano?: number;
    periodo?: PeriodoOrcamento;
    status?: StatusOrcamento | StatusOrcamento[];
    ordenarPor?: 'nome' | 'ano' | 'periodo' | 'status' | 'data_inicio' | 'created_at';
    ordem?: 'asc' | 'desc';
}

export interface ListarOrcamentosResponse {
    items: OrcamentoComItens[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
}

export interface OperacaoOrcamentoResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: Orcamento;
}

export interface OrcamentosFilters {
    ano?: number;
    periodo?: PeriodoOrcamento;
    status?: StatusOrcamento;
    busca?: string;
}


// ============================================================================
// Validadores de Tipos
// ============================================================================

const STATUS_VALIDOS: StatusOrcamento[] = ['rascunho', 'aprovado', 'em_execucao', 'encerrado', 'cancelado'];
const PERIODOS_VALIDOS: PeriodoOrcamento[] = ['mensal', 'trimestral', 'semestral', 'anual'];

/**
 * Valida se um status e valido
 */
export function isStatusValido(status: unknown): status is StatusOrcamento {
    return typeof status === 'string' && STATUS_VALIDOS.includes(status as StatusOrcamento);
}

/**
 * Valida se um periodo e valido
 */
export function isPeriodoValido(periodo: unknown): periodo is PeriodoOrcamento {
    return typeof periodo === 'string' && PERIODOS_VALIDOS.includes(periodo as PeriodoOrcamento);
}

/**
 * Type guard para verificar se e um Orcamento valido
 */
export function isOrcamento(obj: unknown): obj is Orcamento {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'nome' in obj &&
        'ano' in obj &&
        'periodo' in obj &&
        'status' in obj &&
        'dataInicio' in obj &&
        'dataFim' in obj
    );
}

/**
 * Type guard para verificar se e um OrcamentoItem valido
 */
export function isOrcamentoItem(obj: unknown): obj is OrcamentoItem {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'orcamentoId' in obj &&
        'contaContabilId' in obj &&
        'valorPrevisto' in obj
    );
}

// ============================================================================
// Validadores de DTOs
// ============================================================================

/**
 * Valida DTO de criacao de orcamento
 */
export function validarCriarOrcamentoDTO(dto: CriarOrcamentoDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dto.nome || dto.nome.trim() === '') {
        erros.push('Nome e obrigatorio');
    }

    if (!dto.ano || dto.ano < 2020 || dto.ano > 2100) {
        erros.push('Ano deve estar entre 2020 e 2100');
    }

    if (!dto.periodo || !isPeriodoValido(dto.periodo)) {
        erros.push('Periodo invalido');
    }

    if (!dto.dataInicio) {
        erros.push('Data de inicio e obrigatoria');
    }

    if (!dto.dataFim) {
        erros.push('Data de fim e obrigatoria');
    }

    if (dto.dataInicio && dto.dataFim) {
        const dataInicio = new Date(dto.dataInicio);
        const dataFim = new Date(dto.dataFim);

        if (isNaN(dataInicio.getTime())) {
            erros.push('Data de inicio invalida');
        }

        if (isNaN(dataFim.getTime())) {
            erros.push('Data de fim invalida');
        }

        if (dataFim <= dataInicio) {
            erros.push('Data de fim deve ser posterior a data de inicio');
        }
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida DTO de atualizacao de orcamento
 */
export function validarAtualizarOrcamentoDTO(dto: AtualizarOrcamentoDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Pelo menos um campo deve ser fornecido
    const temCampos = dto.nome !== undefined ||
        dto.descricao !== undefined ||
        dto.observacoes !== undefined ||
        dto.dataInicio !== undefined ||
        dto.dataFim !== undefined;

    if (!temCampos) {
        erros.push('Pelo menos um campo deve ser fornecido para atualizacao');
    }

    if (dto.nome !== undefined && dto.nome.trim() === '') {
        erros.push('Nome nao pode ser vazio');
    }

    if (dto.dataInicio !== undefined && dto.dataFim !== undefined) {
        const dataInicio = new Date(dto.dataInicio);
        const dataFim = new Date(dto.dataFim);

        if (dataFim <= dataInicio) {
            erros.push('Data de fim deve ser posterior a data de inicio');
        }
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida DTO de criacao de item de orcamento
 */
export function validarCriarOrcamentoItemDTO(dto: CriarOrcamentoItemDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!dto.contaContabilId || dto.contaContabilId <= 0) {
        erros.push('Conta contabil e obrigatoria');
    }

    if (!dto.descricao || dto.descricao.trim() === '') {
        erros.push('Descricao e obrigatoria');
    }

    if (dto.valorPrevisto === undefined || dto.valorPrevisto < 0) {
        erros.push('Valor previsto deve ser maior ou igual a zero');
    }

    return { valido: erros.length === 0, erros };
}

/**
 * Valida DTO de atualizacao de item de orcamento
 */
export function validarAtualizarOrcamentoItemDTO(dto: AtualizarOrcamentoItemDTO): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Pelo menos um campo deve ser fornecido
    const temCampos = dto.descricao !== undefined ||
        dto.valorPrevisto !== undefined ||
        dto.observacoes !== undefined;

    if (!temCampos) {
        erros.push('Pelo menos um campo deve ser fornecido para atualizacao');
    }

    if (dto.descricao !== undefined && dto.descricao.trim() === '') {
        erros.push('Descricao nao pode ser vazia');
    }

    if (dto.valorPrevisto !== undefined && dto.valorPrevisto < 0) {
        erros.push('Valor previsto deve ser maior ou igual a zero');
    }

    return { valido: erros.length === 0, erros };
}

// ============================================================================
// Regras de Negocio - Transicoes de Status
// ============================================================================

/**
 * Mapa de transicoes de status permitidas
 */
const TRANSICOES_PERMITIDAS: Record<StatusOrcamento, StatusOrcamento[]> = {
    rascunho: ['aprovado', 'cancelado'],
    aprovado: ['em_execucao', 'rascunho', 'cancelado'],
    em_execucao: ['encerrado', 'cancelado'],
    encerrado: [], // Estado final
    cancelado: [] // Estado final
};

/**
 * Valida se uma transicao de status e permitida
 */
export function isTransicaoStatusValida(
    statusAtual: StatusOrcamento,
    statusNovo: StatusOrcamento
): boolean {
    return TRANSICOES_PERMITIDAS[statusAtual]?.includes(statusNovo) ?? false;
}

/**
 * Verifica se um orcamento pode ser editado
 */
export function podeEditarOrcamento(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status !== 'rascunho') {
        return {
            pode: false,
            motivo: `Apenas orcamentos em rascunho podem ser editados. Status atual: ${orcamento.status}`
        };
    }
    return { pode: true };
}

/**
 * Verifica se um orcamento pode ser excluido
 */
export function podeExcluirOrcamento(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status !== 'rascunho') {
        return {
            pode: false,
            motivo: `Apenas orcamentos em rascunho podem ser excluidos. Status atual: ${orcamento.status}`
        };
    }
    return { pode: true };
}

/**
 * Verifica se um orcamento pode ser aprovado
 */
export function podeAprovarOrcamento(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status !== 'rascunho') {
        return {
            pode: false,
            motivo: `Apenas orcamentos em rascunho podem ser aprovados. Status atual: ${orcamento.status}`
        };
    }
    return { pode: true };
}

/**
 * Verifica se um orcamento pode iniciar execucao
 */
export function podeIniciarExecucao(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status !== 'aprovado') {
        return {
            pode: false,
            motivo: `Apenas orcamentos aprovados podem iniciar execucao. Status atual: ${orcamento.status}`
        };
    }
    return { pode: true };
}

/**
 * Verifica se um orcamento pode ser encerrado
 */
export function podeEncerrarOrcamento(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status !== 'em_execucao') {
        return {
            pode: false,
            motivo: `Apenas orcamentos em execucao podem ser encerrados. Status atual: ${orcamento.status}`
        };
    }
    return { pode: true };
}

/**
 * Verifica se um orcamento pode ser cancelado
 */
export function podeCancelarOrcamento(orcamento: Orcamento): { pode: boolean; motivo?: string } {
    if (orcamento.status === 'encerrado' || orcamento.status === 'cancelado') {
        return {
            pode: false,
            motivo: `Orcamentos ${orcamento.status}s nao podem ser cancelados`
        };
    }
    return { pode: true };
}

// ============================================================================
// Regras de Negocio - Calculos
// ============================================================================

/**
 * Status de item baseado no desvio
 */
export type StatusItemOrcamento = 'dentro_meta' | 'acima_meta' | 'abaixo_meta';

/**
 * Calcula variacao entre orcado e realizado
 */
export function calcularVariacao(
    orcado: number,
    realizado: number
): { absoluta: number; percentual: number; status: StatusItemOrcamento } {
    const absoluta = orcado - realizado;
    const percentual = orcado === 0 ? 0 : ((realizado - orcado) / orcado) * 100;
    const percentualAbsoluto = Math.abs(percentual);

    let status: StatusItemOrcamento;
    if (percentualAbsoluto <= 10) {
        status = 'dentro_meta';
    } else if (realizado > orcado) {
        status = 'acima_meta';
    } else {
        status = 'abaixo_meta';
    }

    return { absoluta, percentual, status };
}

/**
 * Calcula o percentual de execucao
 */
export function calcularPercentualExecucao(valorPrevisto: number, valorRealizado: number): number {
    if (valorPrevisto === 0) return 0;
    return Number(((valorRealizado / valorPrevisto) * 100).toFixed(2));
}

/**
 * Calcula resumo orcamentario
 */
export function calcularResumoOrcamentario(itens: OrcamentoItemComDetalhes[]): ResumoOrcamentario {
    const totalPrevisto = itens.reduce((acc, item) => acc + item.valorPrevisto, 0);
    const totalRealizado = itens.reduce((acc, item) => acc + item.valorRealizado, 0);
    const saldo = totalPrevisto - totalRealizado;
    const percentualExecutado = calcularPercentualExecucao(totalPrevisto, totalRealizado);

    let itensAcimaMeta = 0;
    let itensAbaixoMeta = 0;
    let itensDentroMeta = 0;

    itens.forEach(item => {
        const { status } = calcularVariacao(item.valorPrevisto, item.valorRealizado);
        if (status === 'acima_meta') itensAcimaMeta++;
        else if (status === 'abaixo_meta') itensAbaixoMeta++;
        else itensDentroMeta++;
    });

    return {
        totalPrevisto,
        totalRealizado,
        saldo,
        percentualExecutado,
        itensAcimaMeta,
        itensAbaixoMeta,
        itensDentroMeta
    };
}

/**
 * Calcula projecao baseada em meses realizados
 */
export function calcularProjecao(
    valorRealizado: number,
    mesesRealizados: number,
    mesesTotais: number
): { valorProjetado: number; confiabilidade: number } {
    if (mesesRealizados === 0) {
        return { valorProjetado: 0, confiabilidade: 0 };
    }

    const mediaMensal = valorRealizado / mesesRealizados;
    const valorProjetado = mediaMensal * mesesTotais;
    const confiabilidade = Math.min(100, (mesesRealizados / mesesTotais) * 100);

    return { valorProjetado, confiabilidade };
}

/**
 * Determina tendencia baseada em variacao
 */
export type TendenciaOrcamento = 'positiva' | 'neutra' | 'negativa';

export function determinarTendencia(variacaoPercentual: number): TendenciaOrcamento {
    if (variacaoPercentual < -5) {
        return 'negativa';
    } else if (variacaoPercentual > 5) {
        return 'positiva';
    }
    return 'neutra';
}

// ============================================================================
// Regras de Negocio - Periodos
// ============================================================================

/**
 * Calcula numero de meses entre duas datas
 */
export function calcularMesesEntreDatas(dataInicio: string, dataFim: string): number {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 +
        (fim.getMonth() - inicio.getMonth()) + 1;
    return Math.max(1, meses);
}

/**
 * Calcula meses decorridos desde o inicio do orcamento ate hoje
 */
export function calcularMesesDecorridos(dataInicio: string, dataFim: string): number {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const hoje = new Date();

    if (hoje < inicio) {
        return 0;
    }
    if (hoje > fim) {
        return calcularMesesEntreDatas(dataInicio, dataFim);
    }

    return (hoje.getFullYear() - inicio.getFullYear()) * 12 +
        (hoje.getMonth() - inicio.getMonth()) + 1;
}

/**
 * Verifica se o orcamento esta vigente (dentro do periodo)
 */
export function isOrcamentoVigente(orcamento: Orcamento): boolean {
    const hoje = new Date();
    const dataInicio = new Date(orcamento.dataInicio);
    const dataFim = new Date(orcamento.dataFim);

    return hoje >= dataInicio && hoje <= dataFim && orcamento.status === 'em_execucao';
}

// ============================================================================
// Regras de Negocio - Alertas
// ============================================================================

/**
 * Tipo de severidade de alerta
 */
export type SeveridadeAlerta = 'critico' | 'alerta' | 'informativo';

/**
 * Gera alertas de desvio para um item
 */
export function gerarAlertaDesvio(item: OrcamentoItemComDetalhes): AlertaDesvio | null {
    const desvioPercentual = item.valorPrevisto > 0
        ? ((item.valorRealizado - item.valorPrevisto) / item.valorPrevisto) * 100
        : 0;

    if (Math.abs(desvioPercentual) <= 10) {
        return null; // Dentro da meta, sem alerta
    }

    let tipo: SeveridadeAlerta;
    let mensagem: string;

    if (Math.abs(desvioPercentual) > 30) {
        tipo = 'critico';
        mensagem = desvioPercentual > 0
            ? `${item.descricao}: gastos ${desvioPercentual.toFixed(1)}% acima do previsto!`
            : `${item.descricao}: realizacao ${Math.abs(desvioPercentual).toFixed(1)}% abaixo do previsto`;
    } else if (Math.abs(desvioPercentual) > 20) {
        tipo = 'alerta';
        mensagem = desvioPercentual > 0
            ? `${item.descricao}: gastos ${desvioPercentual.toFixed(1)}% acima do previsto`
            : `${item.descricao}: realizacao ${Math.abs(desvioPercentual).toFixed(1)}% abaixo do previsto`;
    } else {
        tipo = 'informativo';
        mensagem = desvioPercentual > 0
            ? `${item.descricao}: ligeiramente acima do previsto (${desvioPercentual.toFixed(1)}%)`
            : `${item.descricao}: ligeiramente abaixo do previsto (${Math.abs(desvioPercentual).toFixed(1)}%)`;
    }

    return {
        itemId: item.id,
        descricao: item.descricao,
        tipo,
        mensagem,
        desvioPercentual
    };
}

/**
 * Gera todos os alertas para um orcamento
 */
export function gerarAlertasOrcamento(itens: OrcamentoItemComDetalhes[]): AlertaDesvio[] {
    return itens
        .map(gerarAlertaDesvio)
        .filter((alerta): alerta is AlertaDesvio => alerta !== null)
        .sort((a, b) => {
            // Ordenar por severidade (critico primeiro)
            const ordem: Record<SeveridadeAlerta, number> = { critico: 0, alerta: 1, informativo: 2 };
            return ordem[a.tipo] - ordem[b.tipo];
        });
}

// ============================================================================
// Constantes e Labels
// ============================================================================

export const STATUS_LABELS: Record<StatusOrcamento, string> = {
    rascunho: 'Rascunho',
    aprovado: 'Aprovado',
    em_execucao: 'Em Execucao',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado'
};

export const PERIODO_LABELS: Record<PeriodoOrcamento, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual'
};

export const STATUS_ITEM_LABELS: Record<StatusItemOrcamento, string> = {
    dentro_meta: 'Dentro da Meta',
    acima_meta: 'Acima da Meta',
    abaixo_meta: 'Abaixo da Meta'
};

export const SEVERIDADE_LABELS: Record<SeveridadeAlerta, string> = {
    critico: 'Critico',
    alerta: 'Atencao',
    informativo: 'Informacao'
};

export const TENDENCIA_LABELS: Record<TendenciaOrcamento, string> = {
    positiva: 'Positiva',
    neutra: 'Neutra',
    negativa: 'Negativa'
};

export const STATUS_CORES: Record<StatusOrcamento, string> = {
    rascunho: 'gray',
    aprovado: 'blue',
    em_execucao: 'green',
    encerrado: 'purple',
    cancelado: 'red'
};

export const STATUS_ITEM_CORES: Record<StatusItemOrcamento, string> = {
    dentro_meta: 'green',
    acima_meta: 'red',
    abaixo_meta: 'yellow'
};

export const SEVERIDADE_CORES: Record<SeveridadeAlerta, string> = {
    critico: 'red',
    alerta: 'yellow',
    informativo: 'blue'
};

/**
 * Lista de meses para selecao
 */
export const MESES: Array<{ value: number; label: string }> = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Marco' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
];

/**
 * Obtem nome do mes
 */
export function getNomeMes(mes: number): string {
    return MESES.find((m) => m.value === mes)?.label ?? '';
}

/**
 * Gera anos para selecao (ultimos 2 + proximos 3)
 */
export function gerarAnosParaSelecao(): number[] {
    const anoAtual = new Date().getFullYear();
    return [anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2, anoAtual + 3];
}

// ============================================================================
// Limiares de Alerta
// ============================================================================

export const LIMIAR_DESVIO_INFORMATIVO = 10; // 10%
export const LIMIAR_DESVIO_ALERTA = 20; // 20%
export const LIMIAR_DESVIO_CRITICO = 30; // 30%
