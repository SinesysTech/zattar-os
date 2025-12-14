import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export const adaptClienteToProfile = (cliente: any) => {
  return {
    ...cliente,
    cpf_cnpj: cliente.cpf || cliente.cnpj,
    endereco_formatado: formatAddress(cliente.endereco),
    // Mock stats if not present
    stats: cliente.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    // Ensure lists exist
    processos: cliente.processos || [],
    activities: cliente.activities || [],
  };
};

export const adaptParteContrariaToProfile = (parte: any) => {
  return {
    ...parte,
    cpf_cnpj: parte.cpf || parte.cnpj,
    endereco_formatado: formatAddress(parte.endereco),
    stats: parte.stats || {
      total_processos: 0,
      processos_ativos: 0,
    },
    processos: parte.processos || [],
    activities: parte.activities || [],
  };
};

export const adaptTerceiroToProfile = (terceiro: any) => {
  return {
    ...terceiro,
    tipo: terceiro.tipo_parte || "Terceiro",
    cpf_cnpj: terceiro.cpf || terceiro.cnpj,
    stats: terceiro.stats || {
      total_participacoes: 0,
    },
    processos: terceiro.processos || [],
    activities: terceiro.activities || [],
  };
};

export const adaptRepresentanteToProfile = (rep: any) => {
  // Try to find OAB principal
  const oabPrincipal =
    rep.inscricoes_oab?.find((i: any) => i.principal) ||
    rep.inscricoes_oab?.[0];
  const oabStr = oabPrincipal
    ? `${oabPrincipal.numero}/${oabPrincipal.uf}`
    : "";

  const oabsFormatadas = rep.inscricoes_oab
    ?.map((i: any) => `${i.numero}/${i.uf} (${i.situacao})`)
    .join(", ");

  return {
    ...rep,
    oab_principal: oabStr,
    oabs_formatadas: oabsFormatadas,
    stats: rep.stats || {
      total_processos: 0,
      total_clientes: 0,
    },
    processos: rep.processos || [],
    clientes: rep.clientes || [],
    activities: rep.activities || [],
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
    is_super_admin: String(usuario.is_super_admin), // badges map expects string often
  };
};
