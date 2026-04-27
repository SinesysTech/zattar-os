export const TIPO_CAPTURA_LABELS: Record<string, string> = {
  acervo_geral: 'Acervo Geral',
  arquivados: 'Arquivados',
  audiencias: 'Audiências',
  audiencias_designadas: 'Audiências Designadas',
  audiencias_realizadas: 'Audiências Realizadas',
  audiencias_canceladas: 'Audiências Canceladas',
  pendentes: 'Pendentes de Manifestação',
  partes: 'Partes e Representantes',
  combinada: 'Captura Combinada',
  expedientes_no_prazo: 'Expedientes no Prazo',
  expedientes_sem_prazo: 'Expedientes sem Prazo',
  pericias: 'Perícias',
  timeline: 'Timeline de Documentos',
};

export const STATUS_CAPTURA_LABELS: Record<string, string> = {
  completed: 'Concluída',
  in_progress: 'Em Andamento',
  failed: 'Falha',
  pending: 'Pendente',
};

const GRAU_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  tribunal_superior: 'Tribunal Superior',
};

const FILTRO_LABELS: Record<string, string> = {
  sem_prazo: 'Sem Prazo',
  no_prazo: 'No Prazo',
};

const ENTIDADE_LABELS: Record<string, string> = {
  acervo: 'Acervo',
  audiencias: 'Audiências',
  expedientes: 'Expedientes',
  auth: 'Autenticação',
  partes: 'Partes',
  timeline: 'Timeline',
  pericias: 'Perícias',
};

const CAMPO_LABELS: Record<string, string> = {
  numero_cnj_processo: 'Número CNJ',
  numero_processo: 'Número do Processo',
  status_processo: 'Status do Processo',
  classe_judicial: 'Classe Judicial',
  classe_judicial_id: 'Classe Judicial',
  especialidade: 'Especialidade',
  especialidade_id: 'Especialidade',
  orgao_julgador: 'Órgão Julgador',
  orgao_julgador_id: 'Órgão Julgador',
  assunto_principal: 'Assunto Principal',
  assunto_principal_id: 'Assunto Principal',
  valor_causa: 'Valor da Causa',
  distribuido_em: 'Data de Distribuição',
  data_ultimo_movimento: 'Último Movimento',
  data_audiencia: 'Data da Audiência',
  hora_audiencia: 'Hora da Audiência',
  local_audiencia: 'Local',
  sala_audiencia: 'Sala',
  tipo_audiencia: 'Tipo de Audiência',
  status_audiencia: 'Status',
  modalidade_audiencia: 'Modalidade',
  tipo_expediente: 'Tipo de Expediente',
  prazo: 'Prazo',
  data_vencimento: 'Data de Vencimento',
  status_expediente: 'Status do Expediente',
  nome: 'Nome',
  cpf_cnpj: 'CPF/CNPJ',
  polo: 'Polo',
  tipo_parte: 'Tipo de Parte',
  data_pericia: 'Data da Perícia',
  local_pericia: 'Local da Perícia',
  perito: 'Perito',
  tipo_pericia: 'Tipo de Perícia',
};

export function formatarTipoCaptura(tipo: string): string {
  return (
    TIPO_CAPTURA_LABELS[tipo] ??
    tipo.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function formatarStatusCaptura(status: string): string {
  return STATUS_CAPTURA_LABELS[status] ?? status;
}

export function formatarGrau(grau: string): string {
  return GRAU_LABELS[grau] ?? grau;
}

export function formatarFiltro(filtro: string): string {
  return FILTRO_LABELS[filtro] ?? filtro;
}

export function formatarEntidade(entidade: string): string {
  return ENTIDADE_LABELS[entidade] ?? entidade;
}

export function formatarCampoAlterado(campo: string): string {
  return (
    CAMPO_LABELS[campo] ??
    campo.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function formatarDuracao(inicioIso: string, fimIso: string | null): string | null {
  if (!fimIso) return null;
  const ms = new Date(fimIso).getTime() - new Date(inicioIso).getTime();
  if (ms < 1000) return `${ms}ms`;
  const segundos = Math.floor(ms / 1000);
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const segsRestantes = segundos % 60;
  if (minutos < 60) return `${minutos}m ${segsRestantes}s`;
  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;
  return `${horas}h ${minsRestantes}m ${segsRestantes}s`;
}
