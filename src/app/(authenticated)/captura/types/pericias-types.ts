/**
 * Tipos para perícias do PJE
 */

/**
 * Interface: SituacaoPericia
 * 
 * PROPÓSITO:
 * Representa a situação de uma perícia no PJE.
 * 
 * CAMPOS:
 * - codigo: 'S' | 'L' | 'C' | 'F' | 'P' | 'R' - Código da situação:
 *   - 'S': Aguardando Esclarecimentos
 *   - 'L': Aguardando Laudo
 *   - 'C': Cancelada
 *   - 'F': Finalizada
 *   - 'P': Laudo Juntado
 *   - 'R': Redesignada
 * - descricao: string - Descrição da situação (ex: "Finalizada", "Aguardando Laudo")
 * 
 * USO:
 * Utilizada dentro da interface Pericia para indicar o estado atual da perícia.
 */
export interface SituacaoPericia {
  codigo: 'S' | 'L' | 'C' | 'F' | 'P' | 'R';
  descricao: string;
}

/**
 * Interface: PermissoesPericia
 * 
 * PROPÓSITO:
 * Representa as permissões disponíveis para uma perícia no PJE.
 * Cada campo booleano indica se uma ação específica é permitida para esta perícia.
 * 
 * CAMPOS:
 * - permitidoPeticionar: boolean - Permite criar petições relacionadas à perícia
 * - permitidoAceitarOuRecusar: boolean - Permite aceitar ou recusar a perícia
 * - permitidoJuntarLaudo: boolean - Permite juntar laudo à perícia
 * - permitidoCancelar: boolean - Permite cancelar a perícia
 * - permitidoSerFinalizada: boolean - Permite finalizar a perícia
 * - permitidoTerEslarecimentoSolicitados: boolean - Permite solicitar esclarecimentos
 * - permitidoRegistrarPagamento: boolean - Permite registrar pagamento
 * - permitidoJuntarEsclarecimentos: boolean - Permite juntar esclarecimentos
 * - permitidoRedesignar: boolean - Permite redesignar a perícia
 * - permitidoTomarCienciaIntimacao: boolean - Permite tomar ciência de intimação
 * - permitidoOutrasIntimacoes: boolean - Permite outras intimações
 * 
 * USO:
 * Utilizada dentro da interface Pericia para controlar quais ações estão disponíveis
 * no contexto da perícia atual.
 */
export interface PermissoesPericia {
  permitidoPeticionar: boolean;
  permitidoAceitarOuRecusar: boolean;
  permitidoJuntarLaudo: boolean;
  permitidoCancelar: boolean;
  permitidoSerFinalizada: boolean;
  permitidoTerEslarecimentoSolicitados: boolean;
  permitidoRegistrarPagamento: boolean;
  permitidoJuntarEsclarecimentos: boolean;
  permitidoRedesignar: boolean;
  permitidoTomarCienciaIntimacao: boolean;
  permitidoOutrasIntimacoes: boolean;
}

/**
 * Interface: Pericia
 * 
 * PROPÓSITO:
 * Representa uma perícia retornada pela API do PJE.
 * Contém todas as informações sobre uma perícia relacionada a um processo judicial.
 * 
 * CAMPOS:
 * - id: number - ID único da perícia no sistema PJE
 * - prazoEntrega?: string - Prazo para entrega do laudo (formato ISO, opcional)
 * - dataAceite?: string - Data de aceite da perícia (formato ISO, opcional)
 * - dataCriacao: string - Data de criação da perícia (formato ISO)
 * - situacao: SituacaoPericia - Situação atual da perícia (código e descrição)
 * - idDocumentoLaudo?: number - ID do documento do laudo (opcional, presente quando laudo foi juntado)
 * - idEspecialidade: number - ID da especialidade da perícia
 * - descricaoEspecialidade: string - Descrição da especialidade (ex: "Perícia de Insalubridade")
 * - idPerito: number - ID do perito designado
 * - nomePerito: string - Nome do perito designado
 * - idProcesso: number - ID do processo relacionado
 * - numeroProcesso: string - Número do processo no formato CNJ
 * - processoEmSegredoJustica: boolean - Indica se o processo está em segredo de justiça
 * - siglaClasseJudicialProcesso?: string - Sigla da classe judicial do processo (opcional)
 * - dataProximaAudienciaProcesso?: string - Data da próxima audiência do processo (opcional)
 * - situacaoPericia: string - Situação da perícia em formato texto (ex: "FINALIZADA", "CANCELADA")
 * - permissoesPericia: PermissoesPericia - Permissões disponíveis para esta perícia
 * - nomeOrgaoJulgador: string - Nome do órgão julgador responsável
 * - juizoDigital: boolean - Indica se o juízo é digital
 * - laudoJuntado: boolean - Indica se o laudo foi juntado
 * - arquivado: boolean - Indica se a perícia está arquivada
 * - funcionalidadeEditor?: string - Código da funcionalidade do editor (opcional)
 * - prioridadeProcessual: boolean - Indica se o processo tem prioridade processual
 * 
 * USO:
 * Utilizada por todas as funções que retornam perícias:
 * - obterPericias() retorna Pericia[]
 * 
 * Usada pelos serviços de captura e persistence para salvar perícias no banco de dados.
 */
export interface Pericia {
  id: number;
  prazoEntrega?: string;
  dataAceite?: string;
  dataCriacao: string;
  situacao: SituacaoPericia;
  idDocumentoLaudo?: number;
  idEspecialidade: number;
  descricaoEspecialidade: string;
  idPerito: number;
  nomePerito: string;
  idProcesso: number;
  numeroProcesso: string;
  processoEmSegredoJustica: boolean;
  siglaClasseJudicialProcesso?: string;
  dataProximaAudienciaProcesso?: string;
  situacaoPericia: string;
  permissoesPericia: PermissoesPericia;
  nomeOrgaoJulgador: string;
  juizoDigital: boolean;
  laudoJuntado: boolean;
  arquivado: boolean;
  funcionalidadeEditor?: string;
  prioridadeProcessual: boolean;
}

