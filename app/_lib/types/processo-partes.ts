/**
 * Tipos frontend para Processo-Partes (N:N relationship)
 * Re-exporta tipos do backend e adiciona utilitários para uso em componentes React
 */

// Importa o tipo ProcessoParte para uso nas funções
import type { ProcessoParte } from '@/backend/types/partes/processo-partes-types';

// Re-exporta todos os tipos de processo-partes do backend
export type {
  EntidadeTipoProcessoParte,
  GrauProcessoParte,
  PoloProcessoParte,
  TipoParteProcesso,
  ProcessoParte,
  CriarProcessoParteParams,
  AtualizarProcessoParteParams,
  ListarProcessoPartesParams,
  ListarProcessoPartesResult,
  BuscarPartesPorProcessoParams,
  ParteComDadosCompletos,
  BuscarProcessosPorEntidadeParams,
  ProcessoComParticipacao,
  VincularParteProcessoParams,
  DesvincularParteProcessoParams,
  OrdenarPorProcessoParte,
  OrdemProcessoParte,
} from '@/backend/types/partes/processo-partes-types';

// Tipos auxiliares para formulários
export interface ProcessoParteFormData {
  // Campos obrigatórios
  processo_id: number;
  tipo_entidade: 'cliente' | 'parte_contraria' | 'terceiro';
  entidade_id: number;
  id_pje: number;
  tipo_parte: string;
  polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';
  trt: string;
  grau: '1' | '2';
  numero_processo: string;

  // Campos opcionais
  id_pessoa_pje?: number;
  id_tipo_parte?: number;
  principal?: boolean;
  ordem?: number;
  status_pje?: string;
  situacao_pje?: string;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  dados_pje_completo?: Record<string, unknown>;
  ultima_atualizacao_pje?: string;
}

/**
 * Valida se é parte principal no polo
 */
export function isPartePrincipal(processoParte: { principal: boolean | null }): boolean {
  return processoParte.principal === true;
}

/**
 * Valida se é autoridade
 */
export function isAutoridade(processoParte: { autoridade: boolean | null }): boolean {
  return processoParte.autoridade === true;
}

/**
 * Valida se endereço é desconhecido
 */
export function isEnderecoDesconhecido(processoParte: { endereco_desconhecido: boolean | null }): boolean {
  return processoParte.endereco_desconhecido === true;
}

/**
 * Retorna label do polo processual
 */
export function getPoloLabel(polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'): string {
  const labels = {
    ATIVO: 'Polo Ativo',
    PASSIVO: 'Polo Passivo',
    NEUTRO: 'Polo Neutro',
    TERCEIRO: 'Terceiro',
  };
  return labels[polo] || polo;
}

/**
 * Retorna cor da badge do polo
 */
export function getPoloColor(polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'): string {
  const colors = {
    ATIVO: 'blue',
    PASSIVO: 'red',
    NEUTRO: 'gray',
    TERCEIRO: 'purple',
  };
  return colors[polo] || 'default';
}

/**
 * Retorna label do tipo de parte
 */
export function getTipoParteLabel(tipoParte: string): string {
  const labels: Record<string, string> = {
    AUTOR: 'Autor',
    REU: 'Réu',
    RECLAMANTE: 'Reclamante',
    RECLAMADO: 'Reclamado',
    EXEQUENTE: 'Exequente',
    EXECUTADO: 'Executado',
    EMBARGANTE: 'Embargante',
    EMBARGADO: 'Embargado',
    APELANTE: 'Apelante',
    APELADO: 'Apelado',
    AGRAVANTE: 'Agravante',
    AGRAVADO: 'Agravado',
    RECORRENTE: 'Recorrente',
    RECORRIDO: 'Recorrido',
    IMPETRANTE: 'Impetrante',
    IMPETRADO: 'Impetrado',
    REQUERENTE: 'Requerente',
    REQUERIDO: 'Requerido',
    INTERESSADO: 'Interessado',
    OPOENTE: 'Opoente',
    OPOSTO: 'Oposto',
    OUTRO: 'Outro',
  };
  return labels[tipoParte] || tipoParte;
}

/**
 * Retorna cor da badge do tipo de parte
 */
export function getTipoParteColor(tipoParte: string): string {
  // Polo ativo: azul
  const poloAtivo = ['AUTOR', 'RECLAMANTE', 'EXEQUENTE', 'EMBARGANTE', 'APELANTE', 'AGRAVANTE', 'RECORRENTE', 'IMPETRANTE', 'REQUERENTE', 'OPOENTE'];
  // Polo passivo: vermelho
  const poloPassivo = ['REU', 'RECLAMADO', 'EXECUTADO', 'EMBARGADO', 'APELADO', 'AGRAVADO', 'RECORRIDO', 'IMPETRADO', 'REQUERIDO', 'OPOSTO'];

  if (poloAtivo.includes(tipoParte)) return 'blue';
  if (poloPassivo.includes(tipoParte)) return 'red';
  if (tipoParte === 'INTERESSADO') return 'purple';
  return 'gray';
}

/**
 * Retorna label do tipo de entidade
 */
export function getEntidadeTipoLabel(tipo: 'cliente' | 'parte_contraria' | 'terceiro'): string {
  const labels = {
    cliente: 'Cliente',
    parte_contraria: 'Parte Contrária',
    terceiro: 'Terceiro',
  };
  return labels[tipo] || tipo;
}

/**
 * Retorna cor da badge do tipo de entidade
 */
export function getEntidadeTipoColor(tipo: 'cliente' | 'parte_contraria' | 'terceiro'): string {
  const colors = {
    cliente: 'green',
    parte_contraria: 'orange',
    terceiro: 'purple',
  };
  return colors[tipo] || 'default';
}

/**
 * Retorna label do grau
 */
export function getGrauLabel(grau: '1' | '2' | 'primeiro_grau' | 'segundo_grau' | string): string {
  if (grau === '1' || grau === 'primeiro_grau') return 'Primeiro Grau';
  if (grau === '2' || grau === 'segundo_grau') return 'Segundo Grau';
  return grau;
}

/**
 * Retorna label do TRT
 */
export function getTrtLabel(trt: string): string {
  return `TRT${trt}`;
}

/**
 * Retorna ícone para parte principal
 */
export function getPrincipalIcon(principal: boolean | null): string {
  return principal ? '⭐' : '';
}

/**
 * Retorna ícone para autoridade
 */
export function getAutoridadeIcon(autoridade: boolean | null): string {
  return autoridade ? '⚖️' : '';
}

/**
 * Agrupa partes por polo
 */
export function agruparPartesPorPolo(partes: ProcessoParte[]): Record<string, ProcessoParte[]> {
  const grupos: Record<string, ProcessoParte[]> = {
    ATIVO: [],
    PASSIVO: [],
    NEUTRO: [],
    TERCEIRO: [],
  };

  partes.forEach(parte => {
    if (parte.polo in grupos) {
      grupos[parte.polo].push(parte);
    }
  });

  // Ordena cada grupo por ordem e principal
  Object.keys(grupos).forEach(polo => {
    grupos[polo].sort((a, b) => {
      // Principal primeiro
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      // Depois por ordem
      const ordemA = a.ordem || 999;
      const ordemB = b.ordem || 999;
      return ordemA - ordemB;
    });
  });

  return grupos;
}

/**
 * Conta partes por polo
 */
export function contarPartesPorPolo(partes: ProcessoParte[]): Record<string, number> {
  const contadores: Record<string, number> = {
    ATIVO: 0,
    PASSIVO: 0,
    NEUTRO: 0,
    TERCEIRO: 0,
  };

  partes.forEach(parte => {
    if (parte.polo in contadores) {
      contadores[parte.polo]++;
    }
  });

  return contadores;
}

/**
 * Retorna partes principais de cada polo
 */
export function getPartesPrincipais(partes: ProcessoParte[]): ProcessoParte[] {
  return partes.filter(parte => parte.principal === true);
}

/**
 * Retorna partes de um polo específico
 */
export function getPartesPorPolo(partes: ProcessoParte[], polo: 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO'): ProcessoParte[] {
  return partes
    .filter(parte => parte.polo === polo)
    .sort((a, b) => {
      // Principal primeiro
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      // Depois por ordem
      const ordemA = a.ordem || 999;
      const ordemB = b.ordem || 999;
      return ordemA - ordemB;
    });
}

/**
 * Valida se o número do processo está no formato correto
 */
export function validarNumeroProcesso(numero: string): boolean {
  // Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
  const regex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  return regex.test(numero);
}

/**
 * Formata número do processo (adiciona pontuação)
 */
export function formatarNumeroProcesso(numero: string): string {
  const numeros = numero.replace(/\D/g, '');
  if (numeros.length !== 20) return numero;
  return numeros.replace(
    /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
    '$1-$2.$3.$4.$5.$6'
  );
}

/**
 * Extrai TRT do número do processo
 */
export function extrairTrtDoNumero(numero: string): string | null {
  const numeros = numero.replace(/\D/g, '');
  if (numeros.length !== 20) return null;
  return numeros.substring(13, 15);
}

/**
 * Extrai ano do número do processo
 */
export function extrairAnoDoNumero(numero: string): string | null {
  const numeros = numero.replace(/\D/g, '');
  if (numeros.length !== 20) return null;
  return numeros.substring(9, 13);
}
