import { Cliente, ParteContraria, Terceiro } from "../../partes/domain";
import { Usuario } from "../../usuarios/domain";
import type { Representante } from "../../partes/types/representantes-types";

// Helper to format address
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatAddress = (endereco: any) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  if (!d.endereco) return data;
  const endereco = { ...d.endereco };
  if (!endereco.cidade_uf && endereco.cidade) {
    endereco.cidade_uf = `${endereco.cidade}${
      endereco.estado ? "/" + endereco.estado : ""
    }`;
  }
  return { ...data, endereco };
};

export const adaptClienteToProfile = (cliente: Cliente) => {
  const enriched = enrichAddress(cliente);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = enriched as any;
  return {
    ...enriched,
    cpf_cnpj: src.cpf || src.cnpj,
    endereco_formatado: formatAddress(src.endereco),
    // Mock stats if not present
    stats: src.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    // Ensure lists exist
    processos: src.processos || [],
    activities: src.activities || [],
  };
};

export const adaptParteContrariaToProfile = (parte: ParteContraria) => {
  const enriched = enrichAddress(parte);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = enriched as any;
  return {
    ...enriched,
    cpf_cnpj: src.cpf || src.cnpj,
    endereco_formatado: formatAddress(src.endereco),
    stats: src.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    processos: src.processos || [],
    activities: src.activities || [],
  };
};

export const adaptTerceiroToProfile = (terceiro: Terceiro) => {
  const enriched = enrichAddress(terceiro);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = enriched as any;
  return {
    ...enriched,
    tipo: src.tipo_parte || "Terceiro",
    cpf_cnpj: src.cpf || src.cnpj,
    stats: src.stats || {
      total_participacoes: 0,
    },
    processos: src.processos || [],
    activities: src.activities || [],
  };
};

export const adaptRepresentanteToProfile = (rep: Representante) => {
  const enriched = enrichAddress(rep);
  // Try to find OAB principal or fallback to first
  const oabPrincipal = enriched.oabs?.[0];
  const oabStr = oabPrincipal
    ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
    : "";

  const oabsFormatadas = enriched.oabs
    ?.map((i) => `${i.numero}/${i.uf} (${i.situacao})`)
    .join(", ");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const src = enriched as any;

  return {
    ...enriched,
    oab_principal: oabStr,
    oabs_formatadas: oabsFormatadas,
    stats: src.stats || {
      total_processos: 0,
      total_clientes: 0,
    },
    processos: src.processos || [],
    clientes: src.clientes || [],
    activities: src.activities || [],
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
