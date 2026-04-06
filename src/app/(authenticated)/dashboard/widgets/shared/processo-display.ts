interface ProcessoContexto {
  local?: string | null;
  sala?: string | null;
  descricao_orgao_julgador?: string | null;
  classe_judicial?: string | null;
}

export function formatarPartes(...nomes: Array<string | null | undefined>): string | undefined {
  const partes = nomes.filter((nome): nome is string => Boolean(nome?.trim()));

  if (partes.length >= 2) {
    return `${partes[0]} vs ${partes[1]}`;
  }

  return partes[0];
}

export function obterContextoProcesso({
  local,
  sala,
  descricao_orgao_julgador,
  classe_judicial,
}: ProcessoContexto): string | undefined {
  const contexto = [local, sala, descricao_orgao_julgador, classe_judicial]
    .find((valor): valor is string => Boolean(valor?.trim()));
  return contexto;
}