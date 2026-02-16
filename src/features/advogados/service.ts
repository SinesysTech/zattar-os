/**
 * Service Layer for Advogados Feature
 * Business logic orchestration
 */

import {
  listarAdvogados as listarAdvogadosDb,
  buscarAdvogado as buscarAdvogadoDb,
  buscarAdvogadoPorCpf as buscarAdvogadoPorCpfDb,
  criarAdvogado as criarAdvogadoDb,
  atualizarAdvogado as atualizarAdvogadoDb,
  listarCredenciais as listarCredenciaisDb,
  criarCredencial as criarCredencialDb,
  buscarCredencial as buscarCredencialDb,
  atualizarCredencial as atualizarCredencialDb,
  buscarCredenciaisExistentes,
  criarCredenciaisEmLoteBatch,
  atualizarSenhaCredenciais,
  atualizarStatusCredenciaisEmLote as atualizarStatusCredenciaisEmLoteDb,
} from './repository';

import type {
  ListarAdvogadosParams,
  CriarAdvogadoParams,
  AtualizarAdvogadoParams,
  ListarCredenciaisParams,
  CriarCredencialParams,
  AtualizarCredencialParams,
  CriarCredenciaisEmLoteParams,
  ResumoCriacaoEmLote,
  ResultadoCredencialLote,
  GrauCredencial,
} from './domain';

// ============================================================================
// Advogados
// ============================================================================

export async function listarAdvogados(params: ListarAdvogadosParams = {}) {
  // Business logic: enforce max limit or specific filters if necessary
  return listarAdvogadosDb(params);
}

export async function buscarAdvogado(id: number) {
  if (!id) throw new Error('ID obrigatório');
  return buscarAdvogadoDb(id);
}

export async function buscarAdvogadoPorCpf(cpf: string) {
  if (!cpf) throw new Error('CPF obrigatório');
  // Simple validation
  const cpfClean = cpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) throw new Error('CPF inválido');
  return buscarAdvogadoPorCpfDb(cpfClean);
}

export async function criarAdvogado(params: CriarAdvogadoParams) {
  // Pre-validation logic
  const cpfClean = params.cpf.replace(/\D/g, '');
  if (cpfClean.length !== 11) throw new Error('CPF inválido');
  if (params.nome_completo.length < 3) throw new Error('Nome curto demais');

  // Validar OABs
  if (!params.oabs || params.oabs.length === 0) {
    throw new Error('Pelo menos uma OAB é obrigatória');
  }

  for (const oab of params.oabs) {
    if (!oab.numero || oab.numero.trim().length === 0) {
      throw new Error('Número OAB obrigatório');
    }
    if (!oab.uf || oab.uf.length !== 2) {
      throw new Error('UF OAB inválido');
    }
  }

  return criarAdvogadoDb({
    ...params,
    cpf: cpfClean,
    nome_completo: params.nome_completo.trim(),
    oabs: params.oabs.map((oab) => ({
      numero: oab.numero.trim(),
      uf: oab.uf.toUpperCase(),
    })),
  });
}

export async function atualizarAdvogado(id: number, params: AtualizarAdvogadoParams) {
  if (!id) throw new Error('ID obrigatório');

  const updateParams = { ...params };

  if (updateParams.cpf) {
    const cpfClean = updateParams.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) throw new Error('CPF inválido');
    updateParams.cpf = cpfClean;
  }

  // Validar OABs se fornecidas
  if (updateParams.oabs !== undefined) {
    if (updateParams.oabs.length === 0) {
      throw new Error('Pelo menos uma OAB é obrigatória');
    }

    for (const oab of updateParams.oabs) {
      if (!oab.numero || oab.numero.trim().length === 0) {
        throw new Error('Número OAB obrigatório');
      }
      if (!oab.uf || oab.uf.length !== 2) {
        throw new Error('UF OAB inválido');
      }
    }

    updateParams.oabs = updateParams.oabs.map((oab) => ({
      numero: oab.numero.trim(),
      uf: oab.uf.toUpperCase(),
    }));
  }

  return atualizarAdvogadoDb(id, updateParams);
}

// ============================================================================
// Credenciais
// ============================================================================

export async function listarCredenciais(params: ListarCredenciaisParams) {
  // Se advogado_id vier, validamos minimamente.
  if (params.advogado_id !== undefined && params.advogado_id <= 0) {
    throw new Error('Advogado ID inválido');
  }
  return listarCredenciaisDb(params);
}

export async function criarCredencial(params: CriarCredencialParams) {
  if (!params.advogado_id) throw new Error('Advogado ID obrigatório');
  if (!params.tribunal) throw new Error('Tribunal obrigatório');
  if (!params.senha) throw new Error('Senha obrigatória');
  // Could add specific tribunal validation here
  
  return criarCredencialDb(params);
}

export async function buscarCredencial(id: number) {
  return buscarCredencialDb(id);
}

export async function atualizarCredencial(id: number, params: AtualizarCredencialParams) {
    return atualizarCredencialDb(id, params);
}

export async function atualizarStatusCredenciaisEmLote(ids: number[], active: boolean) {
  if (ids.length === 0) throw new Error('Nenhuma credencial selecionada');
  if (ids.length > 500) throw new Error('Máximo de 500 credenciais por operação');
  return atualizarStatusCredenciaisEmLoteDb(ids, active);
}

// ============================================================================
// Credenciais em Lote
// ============================================================================

/**
 * Cria credenciais em lote para múltiplos tribunais e graus.
 * Retorna um resumo detalhado de cada credencial criada/atualizada/pulada.
 */
export async function criarCredenciaisEmLote(
  params: CriarCredenciaisEmLoteParams
): Promise<ResumoCriacaoEmLote> {
  const { advogado_id, tribunais, graus, senha, modo_duplicata = 'pular' } = params;

  // Validar advogado existe
  const advogado = await buscarAdvogadoDb(advogado_id);
  if (!advogado) {
    throw new Error('Advogado não encontrado');
  }

  // Gerar todas as combinações tribunal × grau
  const combinacoes: Array<{ tribunal: string; grau: GrauCredencial }> = [];
  for (const tribunal of tribunais) {
    for (const grau of graus) {
      combinacoes.push({ tribunal, grau });
    }
  }

  if (combinacoes.length === 0) {
    return {
      total: 0,
      criadas: 0,
      atualizadas: 0,
      puladas: 0,
      erros: 0,
      detalhes: [],
    };
  }

  // Buscar credenciais existentes para este advogado
  const existentes = await buscarCredenciaisExistentes(advogado_id, tribunais, graus);
  const existentesMap = new Map(
    existentes.map((e) => [`${e.tribunal}-${e.grau}`, e])
  );

  // Separar em: criar, atualizar, pular
  const aCriar: Array<{ tribunal: string; grau: GrauCredencial }> = [];
  const aAtualizar: number[] = [];
  const detalhes: ResultadoCredencialLote[] = [];

  for (const combo of combinacoes) {
    const key = `${combo.tribunal}-${combo.grau}`;
    const existente = existentesMap.get(key);

    if (existente) {
      if (modo_duplicata === 'sobrescrever') {
        aAtualizar.push(existente.id);
        detalhes.push({
          tribunal: combo.tribunal,
          grau: combo.grau,
          status: 'atualizada',
          credencial_id: existente.id,
        });
      } else {
        detalhes.push({
          tribunal: combo.tribunal,
          grau: combo.grau,
          status: 'pulada',
          mensagem: 'Credencial já existe',
          credencial_id: existente.id,
        });
      }
    } else {
      aCriar.push(combo);
    }
  }

  // Criar novas credenciais em lote
  if (aCriar.length > 0) {
    try {
      const novas = await criarCredenciaisEmLoteBatch(
        aCriar.map((c) => ({
          advogado_id,
          tribunal: c.tribunal,
          grau: c.grau,
          usuario: null,
          senha,
          active: true,
        }))
      );

      for (const nova of novas) {
        detalhes.push({
          tribunal: nova.tribunal,
          grau: nova.grau as GrauCredencial,
          status: 'criada',
          credencial_id: nova.id,
        });
      }
    } catch (error) {
      // Em caso de erro, marcar todas como erro
      for (const combo of aCriar) {
        detalhes.push({
          tribunal: combo.tribunal,
          grau: combo.grau,
          status: 'erro',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }
  }

  // Atualizar credenciais existentes (atualizar senha e reativar)
  if (aAtualizar.length > 0) {
    try {
      await atualizarSenhaCredenciais(aAtualizar, senha);
    } catch (error) {
      // Atualizar status para erro nos detalhes
      for (const detalhe of detalhes) {
        if (detalhe.status === 'atualizada' && aAtualizar.includes(detalhe.credencial_id!)) {
          detalhe.status = 'erro';
          detalhe.mensagem = error instanceof Error ? error.message : 'Erro ao atualizar';
        }
      }
    }
  }

  // Calcular resumo
  const resumo: ResumoCriacaoEmLote = {
    total: combinacoes.length,
    criadas: detalhes.filter((d) => d.status === 'criada').length,
    atualizadas: detalhes.filter((d) => d.status === 'atualizada').length,
    puladas: detalhes.filter((d) => d.status === 'pulada').length,
    erros: detalhes.filter((d) => d.status === 'erro').length,
    detalhes,
  };

  return resumo;
}
