/**
 * Funções utilitárias de formatação para o Meu Processo
 * IMPORTANTE: Estas funções NÃO transformam a estrutura de dados,
 * apenas formatam valores para exibição
 *
 * @module lib/utils/formatters
 */

/**
 * Formata uma data ISO para o formato brasileiro (DD/MM/YYYY)
 *
 * @param isoDate - Data no formato ISO (YYYY-MM-DD ou ISO 8601)
 * @returns Data formatada como DD/MM/YYYY
 *
 * @example
 * formatarData('2024-12-08') // '08/12/2024'
 * formatarData('2024-12-08T14:30:00Z') // '08/12/2024'
 */
export function formatarData(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate; // Retorna original se falhar
  }
}

/**
 * Combina data e horário em formato legível
 *
 * @param data - Data no formato ISO (YYYY-MM-DD)
 * @param horario - Horário (ex: "14:00 - 15:00")
 * @returns String formatada (ex: "08/12/2024 às 14:00 - 15:00")
 *
 * @example
 * formatarDataHora('2024-12-08', '14:00 - 15:00')
 * // '08/12/2024 às 14:00 - 15:00'
 */
export function formatarDataHora(data: string, horario: string): string {
  const dataFormatada = formatarData(data);
  return `${dataFormatada} às ${horario}`;
}

/**
 * Formata um número como valor monetário brasileiro
 *
 * @param valor - Valor numérico
 * @returns String formatada (ex: "R$ 10.000,50")
 *
 * @example
 * formatarMoeda(10000.50) // 'R$ 10.000,50'
 * formatarMoeda(1500) // 'R$ 1.500,00'
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Extrai a UF do nome do tribunal
 *
 * @param tribunal - Nome do tribunal (ex: "TRT da 3ª Região (MG)")
 * @returns Sigla da UF ou string vazia se não encontrada
 *
 * @example
 * extrairEstado('TRT da 3ª Região (MG)') // 'MG'
 * extrairEstado('TRT da 15ª Região (Campinas/SP)') // 'SP'
 */
export function extrairEstado(tribunal: string): string {
  const match = tribunal.match(/\((\w{2})\)/);
  return match ? match[1] : '';
}

/**
 * Extrai o município do nome da vara
 *
 * @param vara - Nome da vara (ex: "1ª Vara do Trabalho de Belo Horizonte")
 * @returns Nome do município ou string vazia se não encontrado
 *
 * @example
 * extrairMunicipio('1ª Vara do Trabalho de Belo Horizonte')
 * // 'Belo Horizonte'
 */
export function extrairMunicipio(vara: string): string {
  const match = vara.match(/de (.+)$/);
  return match ? match[1] : '';
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 *
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado ou original se inválido
 *
 * @example
 * formatarCpf('12345678901') // '123.456.789-01'
 */
export function formatarCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Sanitiza CPF para consultas (remove formatação)
 *
 * @param cpf - CPF com ou sem formatação
 * @returns CPF apenas com números
 *
 * @example
 * sanitizarCpf('123.456.789-01') // '12345678901'
 */
export function sanitizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Determina o texto de exibição para o tipo de local de audiência
 *
 * @param modalidade - Modalidade da audiência
 * @param local - Objeto com informações do local
 * @returns Texto descritivo do local
 *
 * @example
 * formatarModalidadeLocal('Virtual', { tipo: 'virtual', url_virtual: 'https://...' })
 * // 'Virtual - Link disponível'
 */
export function formatarModalidadeLocal(
  modalidade: string,
  local: { tipo: string; url_virtual?: string; sala?: string }
): string {
  if (modalidade === 'Virtual' && local.url_virtual) {
    return 'Virtual - Link disponível';
  }
  if (modalidade === 'Presencial' && local.sala) {
    return `Presencial - Sala ${local.sala}`;
  }
  return modalidade;
}

/**
 * Formata número do processo para exibição limpa
 *
 * @param numero - Número do processo
 * @returns Número formatado ou original
 *
 * @example
 * formatarNumeroProcesso('0001234-56.2024.5.03.0001')
 * // '0001234-56.2024.5.03.0001'
 */
export function formatarNumeroProcesso(numero: string): string {
  // Por enquanto apenas retorna o número original
  // Pode ser estendido para formatar de forma específica se necessário
  return numero;
}

/**
 * Calcula diferença em dias entre uma data e hoje
 *
 * @param dataIso - Data no formato ISO
 * @returns Número de dias (positivo = futuro, negativo = passado)
 *
 * @example
 * diasAteData('2024-12-25') // Número de dias até 25/12/2024
 */
export function diasAteData(dataIso: string): number {
  const data = new Date(dataIso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  data.setHours(0, 0, 0, 0);

  const diffTime = data.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Formata texto relativo para data (ex: "Hoje", "Amanhã", "Em 5 dias")
 *
 * @param dataIso - Data no formato ISO
 * @returns Texto descritivo relativo
 *
 * @example
 * formatarDataRelativa('2024-12-08') // 'Hoje' (se for hoje)
 * formatarDataRelativa('2024-12-09') // 'Amanhã'
 * formatarDataRelativa('2024-12-13') // 'Em 5 dias'
 */
export function formatarDataRelativa(dataIso: string): string {
  const dias = diasAteData(dataIso);

  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  if (dias === -1) return 'Ontem';
  if (dias > 1) return `Em ${dias} dias`;
  if (dias < -1) return `Há ${Math.abs(dias)} dias`;

  return formatarData(dataIso);
}
