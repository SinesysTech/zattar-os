/**
 * Exportação centralizada de todos os tipos frontend relacionados a partes
 */

// Clientes
export * from './clientes';

// Partes Contrárias
export * from './partes-contrarias';

// Re-exporta tipos do backend para uso no frontend
export type {
  // Endereços
  EntidadeTipoEndereco,
  SituacaoEndereco,
  ClassificacaoEndereco,
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
} from '@/backend/types/partes/enderecos-types';

export type {
  // Terceiros
  TipoParteTerceiro,
  PoloTerceiro,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  CriarTerceiroParams,
  AtualizarTerceiroParams,
  ListarTerceirosParams,
  ListarTerceirosResult,
  UpsertTerceiroPorIdPessoaParams,
  BuscarTerceirosPorProcessoParams,
} from '@/backend/types/partes/terceiros-types';

export type {
  // Processo-Partes (N:N)
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
} from '@/backend/types/partes/processo-partes-types';

// Funções utilitárias compartilhadas
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
    PERITO: 'Perito',
    MINISTERIO_PUBLICO: 'Ministério Público',
    ASSISTENTE: 'Assistente',
    TESTEMUNHA: 'Testemunha',
    CUSTOS_LEGIS: 'Custos Legis',
    AMICUS_CURIAE: 'Amicus Curiae',
    OUTRO: 'Outro',
  };
  return labels[tipoParte] || tipoParte;
}

export function getPoloLabel(polo: string): string {
  const labels: Record<string, string> = {
    ATIVO: 'Polo Ativo',
    PASSIVO: 'Polo Passivo',
    NEUTRO: 'Polo Neutro',
    TERCEIRO: 'Terceiro',
  };
  return labels[polo] || polo;
}

export function getPoloColor(polo: string): string {
  const colors: Record<string, string> = {
    ATIVO: 'blue',
    PASSIVO: 'red',
    NEUTRO: 'gray',
    TERCEIRO: 'purple',
  };
  return colors[polo] || 'default';
}

export function getGrauLabel(grau: string): string {
  return grau === '1' || grau === 'primeiro_grau' ? 'Primeiro Grau' : 'Segundo Grau';
}

export function getTrtLabel(trt: string): string {
  return `TRT${trt}`;
}
