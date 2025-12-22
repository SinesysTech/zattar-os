import { Cliente, ParteContraria, Terceiro } from "../../partes/domain";
import { Usuario } from "../../usuarios/domain";
import type { Representante } from "../../partes/types/representantes";

// Interface para endereço
interface EnderecoData {
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cidade_uf?: string | null;
  [key: string]: unknown;
}

// Type guard para verificar se tem endereço
function hasEndereco(data: unknown): data is { endereco: EnderecoData | null | undefined } {
  return typeof data === 'object' && data !== null && 'endereco' in data;
}

// Helper to format address
const formatAddress = (endereco: EnderecoData | null | undefined): string => {
  if (!endereco) return "";
  const parts = [
    endereco.logradouro,
    endereco.numero,
    endereco.bairro,
    endereco.cidade
      ? `${endereco.cidade}${endereco.estado ? "/" + endereco.estado : ""}`
      : "",
  ].filter(Boolean);
  return parts.join(", ");
};

// Helper to provide cidade/uf parts even if data source has it differently
const enrichAddress = <T>(data: T): T => {
  if (!hasEndereco(data) || !data.endereco) return data;
  
  const endereco: EnderecoData = { ...data.endereco };
  if (!endereco.cidade_uf && endereco.cidade) {
    endereco.cidade_uf = `${endereco.cidade}${
      endereco.estado ? "/" + endereco.estado : ""
    }`;
  }
  return { ...data, endereco };
};

export const adaptClienteToProfile = (cliente: Cliente) => {
  const enriched = enrichAddress(cliente);
  const endereco = hasEndereco(enriched) ? enriched.endereco : null;
  const enrichedAny = enriched as unknown as { cpf?: string | null; cnpj?: string | null; stats?: unknown; processos?: unknown[]; activities?: unknown[] };
  return {
    ...enriched,
    cpf_cnpj: enrichedAny.cpf || enrichedAny.cnpj || null,
    endereco_formatado: formatAddress(endereco),
    // Mock stats if not present
    stats: enrichedAny.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    // Ensure lists exist
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptParteContrariaToProfile = (parte: ParteContraria) => {
  const enriched = enrichAddress(parte);
  const endereco = hasEndereco(enriched) ? enriched.endereco : null;
  const enrichedAny = enriched as unknown as { cpf?: string | null; cnpj?: string | null; stats?: unknown; processos?: unknown[]; activities?: unknown[] };
  return {
    ...enriched,
    cpf_cnpj: enrichedAny.cpf || enrichedAny.cnpj || null,
    endereco_formatado: formatAddress(endereco),
    stats: enrichedAny.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptTerceiroToProfile = (terceiro: Terceiro) => {
  const enriched = enrichAddress(terceiro);
  const enrichedAny = enriched as unknown as { tipo_parte?: string; cpf?: string | null; cnpj?: string | null; stats?: unknown; processos?: unknown[]; activities?: unknown[] };
  return {
    ...enriched,
    tipo: enrichedAny.tipo_parte || "Terceiro",
    cpf_cnpj: enrichedAny.cpf || enrichedAny.cnpj || null,
    stats: enrichedAny.stats || {
      total_participacoes: 0,
    },
    processos: enrichedAny.processos || [],
    activities: enrichedAny.activities || [],
  };
};

export const adaptRepresentanteToProfile = (rep: Representante) => {
  const enriched = enrichAddress(rep);
  // Try to find OAB principal or fallback to first
  const oabs = (enriched as { oabs?: Array<{ numero: string; uf: string; situacao?: string }> }).oabs;
  const oabPrincipal = oabs?.[0];
  const oabStr = oabPrincipal
    ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
    : "";

  const oabsFormatadas = oabs
    ?.map((i) => `${i.numero}/${i.uf}${i.situacao ? ` (${i.situacao})` : ''}`)
    .join(", ");

  return {
    ...enriched,
    oab_principal: oabStr,
    oabs_formatadas: oabsFormatadas,
    stats: (enriched as { stats?: unknown }).stats || {
      total_processos: 0,
      total_clientes: 0,
    },
    processos: (enriched as { processos?: unknown[] }).processos || [],
    clientes: (enriched as { clientes?: unknown[] }).clientes || [],
    activities: (enriched as { activities?: unknown[] }).activities || [],
  };
};

export const adaptUsuarioToProfile = (usuario: Usuario) => {
  return {
    ...usuario,
    // Add computed fields
    stats: {
      total_processos: 0,
      total_audiencias: 0,
    },
    processos: [],
    activities: [],
    is_super_admin: String(usuario.isSuperAdmin),
  };
};
