"use server";

import { createDbClient } from "@/lib/supabase";
import type {
  PoloProcessoParte,
  TipoParteProcesso,
} from "@/types/domain/processo-partes";
import type { ParteComDadosCompletos } from "../types/processo-partes";

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };

type VínculoProcessoParteRow = {
  id: number;
  processo_id: number;
  tipo_entidade: "cliente" | "parte_contraria" | "terceiro";
  entidade_id: number;
  id_pje: number;
  id_pessoa_pje: number | null;
  tipo_parte: TipoParteProcesso;
  polo: PoloProcessoParte;
  trt: string;
  grau: string;
  numero_processo: string;
  principal: boolean;
  ordem: number;
  dados_pje_completo: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type EntidadeContatoRow = {
  id: number;
  nome: string;
  tipo_pessoa: "pf" | "pj";
  cpf: string | null;
  cnpj: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
};

function mapTelefone(entidade: EntidadeContatoRow): {
  ddd_telefone: string | null;
  numero_telefone: string | null;
} {
  // Preferir residencial; fallback para comercial
  const ddd = entidade.ddd_residencial ?? entidade.ddd_comercial ?? null;
  const numero =
    entidade.numero_residencial ?? entidade.numero_comercial ?? null;
  return { ddd_telefone: ddd, numero_telefone: numero };
}

function mapParteComDados(
  vinculo: VínculoProcessoParteRow,
  entidade: EntidadeContatoRow | undefined
): ParteComDadosCompletos {
  const telefone = entidade
    ? mapTelefone(entidade)
    : { ddd_telefone: null, numero_telefone: null };

  return {
    ...vinculo,
    nome: entidade?.nome ?? "—",
    tipo_pessoa: entidade?.tipo_pessoa ?? "pf",
    cpf: entidade?.cpf ?? null,
    cnpj: entidade?.cnpj ?? null,
    emails: entidade?.emails ?? null,
    ddd_celular: entidade?.ddd_celular ?? null,
    numero_celular: entidade?.numero_celular ?? null,
    ddd_telefone: telefone.ddd_telefone,
    numero_telefone: telefone.numero_telefone,
  };
}

export async function actionBuscarPartesPorProcessoEPolo(
  processoId: number,
  polo: PoloProcessoParte
): Promise<
  ActionResult<{
    partes: ParteComDadosCompletos[];
    principal: ParteComDadosCompletos | null;
  }>
> {
  try {
    if (!processoId || processoId <= 0) {
      return {
        success: false,
        error: "processoId inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const polosValidos: PoloProcessoParte[] = [
      "ATIVO",
      "PASSIVO",
      "NEUTRO",
      "TERCEIRO",
    ];
    if (!polosValidos.includes(polo)) {
      return {
        success: false,
        error: "polo inválido",
        message: "Parâmetros inválidos.",
      };
    }

    const supabase = createDbClient();

    const { data: vinculosRaw, error: vinculosError } = await supabase
      .from("processo_partes")
      .select(
        "id,processo_id,tipo_entidade,entidade_id,id_pje,id_pessoa_pje,tipo_parte,polo,trt,grau,numero_processo,principal,ordem,dados_pje_completo,created_at,updated_at"
      )
      .eq("processo_id", processoId)
      .eq("polo", polo)
      .order("principal", { ascending: false })
      .order("ordem", { ascending: true });

    if (vinculosError) {
      return {
        success: false,
        error: vinculosError.message,
        message: "Falha ao buscar partes do processo.",
      };
    }

    const vinculos = (vinculosRaw ??
      []) as unknown as VínculoProcessoParteRow[];
    if (vinculos.length === 0) {
      return {
        success: true,
        data: { partes: [], principal: null },
        message: "Nenhuma parte encontrada.",
      };
    }

    const idsClientes = vinculos
      .filter((v) => v.tipo_entidade === "cliente")
      .map((v) => v.entidade_id);
    const idsPartesContrarias = vinculos
      .filter((v) => v.tipo_entidade === "parte_contraria")
      .map((v) => v.entidade_id);
    const idsTerceiros = vinculos
      .filter((v) => v.tipo_entidade === "terceiro")
      .map((v) => v.entidade_id);

    const [clientesRes, partesContrariasRes, terceirosRes] = await Promise.all([
      idsClientes.length > 0
        ? supabase
            .from("clientes")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsClientes)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      idsPartesContrarias.length > 0
        ? supabase
            .from("partes_contrarias")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsPartesContrarias)
        : Promise.resolve({ data: [] as unknown[], error: null }),
      idsTerceiros.length > 0
        ? supabase
            .from("terceiros")
            .select(
              "id,nome,tipo_pessoa,cpf,cnpj,emails,ddd_celular,numero_celular,ddd_residencial,numero_residencial,ddd_comercial,numero_comercial"
            )
            .in("id", idsTerceiros)
        : Promise.resolve({ data: [] as unknown[], error: null }),
    ]);

    const firstError =
      clientesRes.error ?? partesContrariasRes.error ?? terceirosRes.error;
    if (firstError) {
      return {
        success: false,
        error: firstError.message,
        message: "Falha ao buscar dados das partes.",
      };
    }

    const clientes = (clientesRes.data ??
      []) as unknown as EntidadeContatoRow[];
    const partesContrarias = (partesContrariasRes.data ??
      []) as unknown as EntidadeContatoRow[];
    const terceiros = (terceirosRes.data ??
      []) as unknown as EntidadeContatoRow[];

    const mapClientes = new Map(clientes.map((c) => [c.id, c]));
    const mapPartesContrarias = new Map(partesContrarias.map((c) => [c.id, c]));
    const mapTerceiros = new Map(terceiros.map((c) => [c.id, c]));

    const partes: ParteComDadosCompletos[] = vinculos.map((v) => {
      const entidade =
        v.tipo_entidade === "cliente"
          ? mapClientes.get(v.entidade_id)
          : v.tipo_entidade === "parte_contraria"
          ? mapPartesContrarias.get(v.entidade_id)
          : mapTerceiros.get(v.entidade_id);

      return mapParteComDados(v, entidade);
    });

    const principal = partes.find((p) => p.principal) ?? partes[0] ?? null;

    return {
      success: true,
      data: { partes, principal },
      message: "Partes carregadas com sucesso.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Falha ao buscar partes do processo.",
    };
  }
}
