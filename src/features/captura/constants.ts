import { CodigoTRT, GrauTRT, FiltroPrazoPendentes } from './types';

/**
 * Lista de códigos de tribunais disponíveis (TRTs + TST)
 */
export const TRT_CODIGOS: CodigoTRT[] = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24', 'TST',
];

/**
 * Lista de graus disponíveis
 */
export const GRAUS: { value: GrauTRT; label: string }[] = [
  { value: 'primeiro_grau', label: 'Primeiro Grau' },
  { value: 'segundo_grau', label: 'Segundo Grau' },
  { value: 'tribunal_superior', label: 'Tribunal Superior' },
];

/**
 * Lista de filtros de prazo para pendências
 */
export const FILTROS_PRAZO: { value: FiltroPrazoPendentes; label: string }[] = [
  { value: 'sem_prazo', label: 'Sem Prazo' },
  { value: 'no_prazo', label: 'No Prazo' },
];

/**
 * Opções de status de audiências
 */
export const STATUS_AUDIENCIA_OPTIONS = [
  { value: 'C', label: 'Cancelada' },
  { value: 'M', label: 'Designada' },
  { value: 'F', label: 'Realizada' },
] as const;
