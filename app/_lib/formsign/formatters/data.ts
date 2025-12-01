// Formatador e parser de data
export const formatData = (data: string | undefined | null): string => {
  // Validar se data existe e é uma string
  if (!data || typeof data !== 'string') {
    return '';
  }

  // Se receber formato ISO (YYYY-MM-DD), converte para dd/mm/aaaa
  // Validação rigorosa: deve ter exatamente 10 caracteres e formato YYYY-MM-DD
  if (data.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  }

  // Se receber apenas números (sem separadores), aplica máscara dd/mm/aaaa
  const cleaned = data.replace(/\D/g, '');
  if (cleaned.length === 8 && cleaned === data) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
  }

  // Retorna valor original se não reconhecer o formato
  return data;
};

export const parseData = (data: string | undefined | null): string => {
  // Validar se data existe e é uma string
  if (!data || typeof data !== 'string') {
    return '';
  }
  
  // Se receber formato dd/mm/aaaa, converte para ISO (YYYY-MM-DD)
  if (data.includes('/')) {
    const [day, month, year] = data.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return data;
};

export const parseDataToNumbers = (data: string | undefined | null): string => {
  // Validar se data existe e é uma string
  if (!data || typeof data !== 'string') {
    return '';
  }
  
  // Remove toda formatação, mantém apenas números
  return data.replace(/\D/g, '');
};

// Converte data dd/mm/aaaa para formato ISO (YYYY-MM-DD)
export const convertToISO = (data: string): string => {
  // Validar se data existe, é uma string e contém o formato esperado
  if (!data || typeof data !== 'string' || !data.includes('/')) {
    return data || '';
  }

  const [day, month, year] = data.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Formata data no formato extenso brasileiro
 *
 * @param data - Data em formato ISO (YYYY-MM-DD), Date object, ou ISO string completa
 * @returns Data formatada no formato extenso (ex: "16 de outubro de 2025")
 *
 * @example
 * formatDataExtenso("2025-10-16") // "16 de outubro de 2025"
 * formatDataExtenso(new Date(2025, 9, 16)) // "16 de outubro de 2025"
 * formatDataExtenso("2025-10-16T14:30:45.123Z") // "16 de outubro de 2025"
 */
export const formatDataExtenso = (data: string | Date): string => {
  if (!data) {
    return '';
  }

  try {
    // Converter para Date object
    let dataObj: Date;

    if (data instanceof Date) {
      dataObj = data;
    } else if (typeof data === 'string') {
      // Suporta ISO completo (com hora) ou apenas data
      dataObj = new Date(data);
    } else {
      return '';
    }

    // Validar se é uma data válida
    if (isNaN(dataObj.getTime())) {
      return '';
    }

    // Meses em português (índice 0-11)
    const mesesExtenso = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const dia = dataObj.getDate();
    const mes = mesesExtenso[dataObj.getMonth()];
    const ano = dataObj.getFullYear();

    return `${dia} de ${mes} de ${ano}`;
  } catch {
    return '';
  }
};

/**
 * Formata timestamp ISO 8601 para formato brasileiro com data e hora.
 *
 * @param isoString - Data em formato ISO 8601 (ex: "2024-07-26T10:30:00.000Z")
 * @returns Data formatada (ex: "26/07/2024 às 10:30") ou string vazia se inválida
 *
 * @example
 * formatarDataHoraAssinatura("2024-07-26T10:30:00.000Z") // "26/07/2024 às 10:30"
 * formatarDataHoraAssinatura("2024-07-26T13:45:30Z") // "26/07/2024 às 13:45"
 * formatarDataHoraAssinatura(null) // ""
 */
export const formatarDataHoraAssinatura = (isoString: string | undefined | null): string => {
  // Validação de entrada
  if (!isoString || typeof isoString !== 'string') {
    return '';
  }

  try {
    // Converter para Date object
    const dataObj = new Date(isoString);

    // Validar se é data válida
    if (isNaN(dataObj.getTime())) {
      return '';
    }

    // Formatar usando Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo', // Timezone padrão do Brasil
    });

    const formatted = formatter.format(dataObj);
    // Resultado: "26/07/2024, 10:30"
    // Substituir vírgula por "às" para melhor legibilidade
    return formatted.replace(',', ' às');
    // Resultado final: "26/07/2024 às 10:30"
  } catch {
    return '';
  }
};

/**
 * Formata timestamp ISO 8601 para formato brasileiro apenas com data.
 *
 * @param isoString - Data em formato ISO 8601 (ex: "2024-07-26T10:30:00.000Z")
 * @returns Data formatada (ex: "26/07/2024") ou string vazia se inválida
 *
 * @example
 * formatarDataAssinatura("2024-07-26T10:30:00.000Z") // "26/07/2024"
 * formatarDataAssinatura("2024-07-26T13:45:30Z") // "26/07/2024"
 * formatarDataAssinatura(null) // ""
 */
export const formatarDataAssinatura = (isoString: string | undefined | null): string => {
  // Validação de entrada
  if (!isoString || typeof isoString !== 'string') {
    return '';
  }

  try {
    // Converter para Date object
    const dataObj = new Date(isoString);

    // Validar se é data válida
    if (isNaN(dataObj.getTime())) {
      return '';
    }

    // Formatar usando Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });

    return formatter.format(dataObj);
    // Resultado: "26/07/2024"
  } catch {
    return '';
  }
};

/**
 * Formata timestamp ISO em formato relativo (ex: "2 horas atrás")
 *
 * Utiliza cálculo simples de diferença de tempo sem dependência do date-fns
 * para manter a bundle size otimizada.
 *
 * @param isoTimestamp - Timestamp ISO 8601
 * @returns String formatada em português (ex: "2h atrás", "5min atrás", "agora")
 *
 * @example
 * formatarTempoRelativo("2025-10-18T10:00:00Z") // "2h atrás"
 * formatarTempoRelativo("2025-10-18T12:55:00Z") // "5min atrás"
 * formatarTempoRelativo("2025-10-18T13:00:00Z") // "agora"
 */
export function formatarTempoRelativo(isoTimestamp: string): string {
  // Validação de entrada
  if (!isoTimestamp || typeof isoTimestamp !== 'string') {
    return 'desconhecido';
  }

  try {
    const date = new Date(isoTimestamp);
    const now = new Date();

    // Validar se é data válida
    if (isNaN(date.getTime())) {
      return 'desconhecido';
    }

    const diffMs = now.getTime() - date.getTime();

    // Menos de 1 minuto
    if (diffMs < 60000) {
      return 'agora';
    }

    const diffMinutes = Math.floor(diffMs / 60000);

    // Menos de 1 hora
    if (diffMinutes < 60) {
      return `${diffMinutes}min atrás`;
    }

    const diffHours = Math.floor(diffMs / 3600000);

    // Menos de 24 horas
    if (diffHours < 24) {
      return `${diffHours}h atrás`;
    }

    const diffDays = Math.floor(diffMs / 86400000);

    // Menos de 30 dias
    if (diffDays < 30) {
      return `${diffDays}d atrás`;
    }

    const diffMonths = Math.floor(diffDays / 30);

    // Menos de 12 meses
    if (diffMonths < 12) {
      return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'} atrás`;
    }

    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} ${diffYears === 1 ? 'ano' : 'anos'} atrás`;
  } catch {
    return 'desconhecido';
  }
}