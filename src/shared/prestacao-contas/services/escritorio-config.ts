export interface EscritorioConfig {
  razaoSocial: string;
  oab: string;
  cidade: string;
}

// v1: env vars. Ajustar para ler perfil do representante em fase posterior.
export function getEscritorioConfig(): EscritorioConfig {
  return {
    razaoSocial: process.env.ESCRITORIO_RAZAO_SOCIAL ?? 'Synthropic Advocacia',
    oab: process.env.ESCRITORIO_OAB ?? 'SP',
    cidade: process.env.ESCRITORIO_CIDADE ?? 'São Paulo',
  };
}
