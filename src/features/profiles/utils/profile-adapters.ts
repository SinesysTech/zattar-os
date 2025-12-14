import { format } from "date-fns";

// Helper to format address
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
const enrichAddress = (data: any) => {
  if (!data.endereco) return data;
  const endereco = { ...data.endereco };
  if (!endereco.cidade_uf && endereco.cidade) {
    endereco.cidade_uf = `${endereco.cidade}${
      endereco.estado ? "/" + endereco.estado : ""
    }`;
  }
  return { ...data, endereco };
};

export const adaptClienteToProfile = (cliente: any) => {
  const enriched = enrichAddress(cliente);
  return {
    ...enriched,
    cpf_cnpj: enriched.cpf || enriched.cnpj,
    endereco_formatado: formatAddress(enriched.endereco),
    // Mock stats if not present
    stats: enriched.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    // Ensure lists exist
    processos: enriched.processos || [],
    activities: enriched.activities || [],
  };
};

export const adaptParteContrariaToProfile = (parte: any) => {
  const enriched = enrichAddress(parte);
  return {
    ...enriched,
    cpf_cnpj: enriched.cpf || enriched.cnpj,
    endereco_formatado: formatAddress(enriched.endereco),
    stats: enriched.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    processos: enriched.processos || [],
    activities: enriched.activities || [],
  };
};

export const adaptTerceiroToProfile = (terceiro: any) => {
  const enriched = enrichAddress(terceiro);
  return {
    ...enriched,
    tipo: enriched.tipo_parte || "Terceiro",
    cpf_cnpj: enriched.cpf || enriched.cnpj,
    stats: enriched.stats || {
      total_participacoes: 0,
    },
    processos: enriched.processos || [],
    activities: enriched.activities || [],
  };
};

export const adaptRepresentanteToProfile = (rep: any) => {
  const enriched = enrichAddress(rep);
  // Try to find OAB principal
  const oabPrincipal =
    enriched.inscricoes_oab?.find((i: any) => i.principal) ||
    enriched.inscricoes_oab?.[0];
  const oabStr = oabPrincipal
    ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
    : "";

  const oabsFormatadas = enriched.inscricoes_oab
    ?.map((i: any) => `${i.numero}/${i.uf} (${i.situacao})`)
    .join(", ");

  return {
    ...enriched,
    oab_principal: oabStr,
    oabs_formatadas: oabsFormatadas,
    stats: enriched.stats || {
      total_processos: 0,
      total_clientes: 0,
    },
    processos: enriched.processos || [],
    clientes: enriched.clientes || [],
    activities: enriched.activities || [],
  };
};

export const adaptUsuarioToProfile = (usuario: any) => {
  return {
    ...usuario,
    // Add computed fields
    stats: usuario.stats || {
      total_processos: 0,
      total_audiencias: 0,
    },
    processos: usuario.processos || [],
    activities: usuario.activities || [],
    is_super_admin: String(usuario.is_super_admin),
  };
};
