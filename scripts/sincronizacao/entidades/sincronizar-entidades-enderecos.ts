/**
 * Script: sincronizar-entidades-enderecos.ts
 *
 * PROPÓSITO:
 * Sincroniza entidades (clientes, partes contrárias, terceiros) e seus endereços
 * a partir dos payloads brutos armazenados no MongoDB.
 *
 * MOTIVAÇÃO:
 * Bug identificado: terceiros não estavam sendo persistidos porque a função
 * identificarTipoParte() não reconhecia o tipo "TERCEIRO INTERESSADO".
 * Este script usa diretamente as chaves do payload (ATIVO, PASSIVO, TERCEIROS)
 * para garantir a classificação correta.
 *
 * USO:
 *   npx tsx scripts/sincronizacao/sincronizar-entidades-enderecos.ts [opções]
 *
 * OPÇÕES:
 *   --dry-run        Simula sem persistir
 *   --limit N        Limita documentos a processar
 *   --batch-size N   Docs por página (default: 100)
 *   --verbose        Logs detalhados
 *   --trt TRT3       Filtra por tribunal
 *
 * EXEMPLOS:
 *   npx tsx scripts/sincronizacao/sincronizar-entidades-enderecos.ts --dry-run --limit 5 --verbose
 *   npx tsx scripts/sincronizacao/sincronizar-entidades-enderecos.ts --trt TRT3 --limit 100
 *   npx tsx scripts/sincronizacao/sincronizar-entidades-enderecos.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente ANTES de importar outros módulos
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { getMongoDatabase, closeMongoConnection } from '@/backend/utils/mongodb/client';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

// Clientes
import {
  buscarClientePorCPF,
  buscarClientePorCNPJ,
  upsertClientePorCPF,
  upsertClientePorCNPJ,
} from '@/backend/clientes/services/persistence/cliente-persistence.service';

// Partes Contrárias
import {
  buscarParteContrariaPorCPF,
  buscarParteContrariaPorCNPJ,
  upsertParteContrariaPorCPF,
  upsertParteContrariaPorCNPJ,
} from '@/backend/partes-contrarias/services/persistence/parte-contraria-persistence.service';

// Terceiros
import {
  buscarTerceiroPorCPF,
  buscarTerceiroPorCNPJ,
  upsertTerceiroPorCPF,
  upsertTerceiroPorCNPJ,
  criarTerceiroSemDocumento,
} from '@/backend/terceiros/services/persistence/terceiro-persistence.service';

// Endereços
import {
  upsertEnderecoPorIdPje,
} from '@/backend/enderecos/services/enderecos-persistence.service';

import type { EntidadeTipoEndereco, SituacaoEndereco, ClassificacaoEndereco } from '@/backend/types/partes/enderecos-types';

// ============================================================================
// TIPOS
// ============================================================================

interface ConfiguracaoScript {
  dryRun: boolean;
  limit?: number;
  batchSize: number;
  verbose: boolean;
  trt?: string;
}

interface ResultadoScript {
  documentosProcessados: number;
  partesProcessadas: number;
  entidadesCriadas: {
    clientes: number;
    partesContrarias: number;
    terceiros: number;
  };
  enderecosUpserted: number;
  enderecosVinculados: number;
  erros: string[];
  ignorados: {
    semDocumentoValido: number;
    payloadSemEndereco: number;
  };
}

interface EnderecoPJE {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  idMunicipio?: number;
  municipio?: string;
  municipioIbge?: string;
  estado?: { id?: number; sigla?: string; descricao?: string };
  pais?: { id?: number; codigo?: string; descricao?: string };
  nroCep?: string;
  correspondencia?: boolean;
  situacao?: string;
  classificacoesEndereco?: string[];
  idUsuarioCadastrador?: number;
  dtAlteracao?: string;
}

interface PartePJE {
  id: number;
  nome: string;
  documento?: string;
  tipoDocumento?: 'CPF' | 'CNPJ' | string;
  tipo?: string;
  polo?: string;
  principal?: boolean;
  emails?: string[];
  idPessoa?: number;
  tipoPessoa?: string;
  status?: string;
  situacao?: string;
  autoridade?: boolean;
  sexo?: string;
  endereco?: EnderecoPJE;
  pessoaFisica?: Record<string, unknown>;
  pessoaJuridica?: Record<string, unknown>;
  representantes?: unknown[];
}

type TipoEntidade = 'cliente' | 'parte_contraria' | 'terceiro';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse argumentos da linha de comando
 */
function parseArgs(): ConfiguracaoScript {
  const args = process.argv.slice(2);
  const config: ConfiguracaoScript = {
    dryRun: false,
    batchSize: 100,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--limit':
        config.limit = parseInt(args[++i], 10);
        break;
      case '--batch-size':
        config.batchSize = parseInt(args[++i], 10);
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--trt':
        config.trt = args[++i];
        break;
    }
  }

  return config;
}

/**
 * Normaliza CPF/CNPJ removendo caracteres especiais
 */
function normalizarDocumento(documento: string | undefined | null): string {
  if (!documento) return '';
  return documento.replace(/\D/g, '');
}

/**
 * Valida se documento é CPF válido (11 dígitos)
 */
function isCpfValido(cpf: string): boolean {
  const normalizado = normalizarDocumento(cpf);
  if (normalizado.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(normalizado)) return false;
  return true;
}

/**
 * Valida se documento é CNPJ válido (14 dígitos)
 */
function isCnpjValido(cnpj: string): boolean {
  const normalizado = normalizarDocumento(cnpj);
  if (normalizado.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(normalizado)) return false;
  return true;
}

/**
 * Mapeia endereço do PJE para params de upsert
 */
function mapearEnderecoPJE(
  endereco: EnderecoPJE,
  tipoEntidade: TipoEntidade,
  entidadeId: number
): Parameters<typeof upsertEnderecoPorIdPje>[0] {
  return {
    id_pje: endereco.id || 0,
    entidade_tipo: tipoEntidade as EntidadeTipoEndereco,
    entidade_id: entidadeId,
    logradouro: endereco.logradouro?.trim() || undefined,
    numero: endereco.numero?.trim() || undefined,
    complemento: endereco.complemento?.trim() || undefined,
    bairro: endereco.bairro?.trim() || undefined,
    id_municipio_pje: endereco.idMunicipio || undefined,
    municipio: endereco.municipio?.trim() || undefined,
    municipio_ibge: endereco.municipioIbge?.trim() || undefined,
    estado_id_pje: endereco.estado?.id || undefined,
    estado_sigla: endereco.estado?.sigla?.trim() || undefined,
    estado_descricao: endereco.estado?.descricao?.trim() || undefined,
    estado: endereco.estado?.sigla?.trim() || undefined,
    pais_id_pje: endereco.pais?.id || undefined,
    pais_codigo: endereco.pais?.codigo?.trim() || undefined,
    pais_descricao: endereco.pais?.descricao?.trim() || undefined,
    pais: endereco.pais?.descricao?.trim() || undefined,
    cep: endereco.nroCep?.replace(/\D/g, '') || undefined,
    correspondencia: endereco.correspondencia,
    situacao: (endereco.situacao as SituacaoEndereco) || undefined,
    classificacoes_endereco: (endereco.classificacoesEndereco as ClassificacaoEndereco[]) || undefined,
    id_usuario_cadastrador_pje: endereco.idUsuarioCadastrador || undefined,
    data_alteracao_pje: endereco.dtAlteracao || undefined,
    dados_pje_completo: endereco as unknown as Record<string, unknown>,
  };
}

/**
 * Extrai campos comuns da parte para criar entidade
 */
function extrairDadosComuns(parte: PartePJE) {
  return {
    nome: parte.nome?.trim() || 'SEM NOME',
    emails: parte.emails && parte.emails.length > 0 ? parte.emails : undefined,
  };
}

/**
 * Extrai campos específicos de PF
 */
function extrairDadosPF(parte: PartePJE) {
  const pf = parte.pessoaFisica || {};
  return {
    sexo: parte.sexo || (pf as Record<string, unknown>).sexo as string || undefined,
    data_nascimento: (pf as Record<string, unknown>).dataNascimento as string || undefined,
    nome_genitora: (pf as Record<string, unknown>).nomeGenitora as string || undefined,
  };
}

// ============================================================================
// PROCESSAMENTO
// ============================================================================

/**
 * Processa uma parte individual
 */
async function processarParte(
  parte: PartePJE,
  tipoEntidade: TipoEntidade,
  config: ConfiguracaoScript,
  resultado: ResultadoScript
): Promise<void> {
  const documento = normalizarDocumento(parte.documento);
  const tipoDoc = parte.tipoDocumento?.toUpperCase();
  const isPF = tipoDoc === 'CPF';
  const isPJ = tipoDoc === 'CNPJ';

  // Validar documento
  const temDocumentoValido =
    (isPF && isCpfValido(documento)) ||
    (isPJ && isCnpjValido(documento));

  if (!temDocumentoValido && tipoEntidade !== 'terceiro') {
    resultado.ignorados.semDocumentoValido++;
    if (config.verbose) {
      console.log(`  ⏭️  Ignorado: ${parte.nome} (documento inválido: ${parte.documento})`);
    }
    return;
  }

  try {
    let entidadeId: number | null = null;
    let entidadeCriada = false;

    // ========================================================================
    // BUSCAR OU CRIAR ENTIDADE
    // ========================================================================

    if (tipoEntidade === 'cliente') {
      // Buscar cliente existente
      const existente = isPF
        ? await buscarClientePorCPF(documento)
        : await buscarClientePorCNPJ(documento);

      if (existente) {
        entidadeId = existente.id;
      } else if (!config.dryRun) {
        // Criar cliente
        const dados = { ...extrairDadosComuns(parte), ...extrairDadosPF(parte) };
        const result = isPF
          ? await upsertClientePorCPF({ ...dados, tipo_pessoa: 'pf', cpf: documento })
          : await upsertClientePorCNPJ({ ...dados, tipo_pessoa: 'pj', cnpj: documento });

        if (result.sucesso && result.cliente) {
          entidadeId = result.cliente.id;
          entidadeCriada = true;
          resultado.entidadesCriadas.clientes++;
        }
      } else if (config.dryRun) {
        console.log(`  [DRY-RUN] Criaria cliente: ${parte.nome} (${parte.documento})`);
      }
    } else if (tipoEntidade === 'parte_contraria') {
      // Buscar parte contrária existente
      const existente = isPF
        ? await buscarParteContrariaPorCPF(documento)
        : await buscarParteContrariaPorCNPJ(documento);

      if (existente) {
        entidadeId = existente.id;
      } else if (!config.dryRun) {
        // Criar parte contrária
        const dados = extrairDadosComuns(parte);
        const result = isPF
          ? await upsertParteContrariaPorCPF({ ...dados, tipo_pessoa: 'pf', cpf: documento })
          : await upsertParteContrariaPorCNPJ({ ...dados, tipo_pessoa: 'pj', cnpj: documento });

        if (result.sucesso && result.parteContraria) {
          entidadeId = result.parteContraria.id;
          entidadeCriada = true;
          resultado.entidadesCriadas.partesContrarias++;
        }
      } else if (config.dryRun) {
        console.log(`  [DRY-RUN] Criaria parte contrária: ${parte.nome} (${parte.documento})`);
      }
    } else {
      // TERCEIRO
      if (temDocumentoValido) {
        // Terceiro com documento válido
        const existente = isPF
          ? await buscarTerceiroPorCPF(documento)
          : await buscarTerceiroPorCNPJ(documento);

        if (existente) {
          entidadeId = existente.id;
        } else if (!config.dryRun) {
          const dados = { ...extrairDadosComuns(parte), tipo_parte: parte.tipo, polo: parte.polo };
          const result = isPF
            ? await upsertTerceiroPorCPF({ ...dados, tipo_pessoa: 'pf', cpf: documento })
            : await upsertTerceiroPorCNPJ({ ...dados, tipo_pessoa: 'pj', cnpj: documento });

          if (result.sucesso && result.terceiro) {
            entidadeId = result.terceiro.id;
            entidadeCriada = true;
            resultado.entidadesCriadas.terceiros++;
          }
        } else if (config.dryRun) {
          console.log(`  [DRY-RUN] Criaria terceiro: ${parte.nome} (${parte.documento})`);
        }
      } else {
        // Terceiro SEM documento válido (ex: Ministério Público)
        if (!config.dryRun) {
          const pareceSerPJ = /^(MINISTÉRIO|MINISTERIO|UNIÃO|UNIAO|ESTADO|MUNICÍPIO|MUNICIPIO|INSTITUTO|INSS|IBAMA|ANVISA|RECEITA|FAZENDA|FUNDAÇÃO|FUNDACAO|AUTARQUIA|EMPRESA|ÓRGÃO|ORGAO)/i.test(parte.nome.trim());
          const result = await criarTerceiroSemDocumento({
            nome: parte.nome?.trim() || 'SEM NOME',
            tipo_pessoa: pareceSerPJ ? 'pj' : 'pf',
            tipo_parte: parte.tipo,
            polo: parte.polo,
            emails: parte.emails && parte.emails.length > 0 ? parte.emails : undefined,
          });

          if (result.sucesso && result.terceiro) {
            entidadeId = result.terceiro.id;
            entidadeCriada = true;
            resultado.entidadesCriadas.terceiros++;
          }
        } else if (config.dryRun) {
          console.log(`  [DRY-RUN] Criaria terceiro sem doc: ${parte.nome}`);
        }
      }
    }

    // ========================================================================
    // PROCESSAR ENDEREÇO
    // ========================================================================

    if (!parte.endereco || !parte.endereco.id) {
      resultado.ignorados.payloadSemEndereco++;
      if (config.verbose && entidadeId) {
        console.log(`  ℹ️  Entidade ${entidadeId} sem endereço no payload`);
      }
      return;
    }

    if (entidadeId && !config.dryRun) {
      // Upsert endereço
      const enderecoParams = mapearEnderecoPJE(parte.endereco, tipoEntidade, entidadeId);
      const enderecoResult = await upsertEnderecoPorIdPje(enderecoParams);

      if (enderecoResult.sucesso && enderecoResult.endereco) {
        resultado.enderecosUpserted++;

        // Vincular endereco_id na entidade
        const supabase = createServiceClient();
        const tableName = tipoEntidade === 'cliente' ? 'clientes'
          : tipoEntidade === 'parte_contraria' ? 'partes_contrarias'
          : 'terceiros';

        const { error } = await supabase
          .from(tableName)
          .update({ endereco_id: enderecoResult.endereco.id })
          .eq('id', entidadeId);

        if (!error) {
          resultado.enderecosVinculados++;
        } else if (config.verbose) {
          console.log(`  ⚠️  Erro ao vincular endereço: ${error.message}`);
        }
      } else if (config.verbose) {
        console.log(`  ⚠️  Falha no upsert endereço: ${enderecoResult.erro || 'erro desconhecido'}`);
      }
    } else if (config.dryRun && parte.endereco?.id) {
      console.log(`  [DRY-RUN] Upsert endereço ID PJE: ${parte.endereco.id}`);
    }

    if (config.verbose) {
      const status = entidadeCriada ? '✅ CRIADO' : '📝 EXISTENTE';
      console.log(`  ${status}: ${tipoEntidade} "${parte.nome}" (ID: ${entidadeId})`);
    }

  } catch (error) {
    const errorMsg = `Erro ao processar ${tipoEntidade} "${parte.nome}": ${error instanceof Error ? error.message : String(error)}`;
    resultado.erros.push(errorMsg);
    if (config.verbose) {
      console.error(`  ❌ ${errorMsg}`);
    }
  }

  resultado.partesProcessadas++;
}

/**
 * Processa um documento do MongoDB
 */
async function processarDocumento(
  doc: Record<string, unknown>,
  config: ConfiguracaoScript,
  resultado: ResultadoScript
): Promise<void> {
  const payloadBruto = doc.payload_bruto as Record<string, PartePJE[]> | undefined;
  if (!payloadBruto) {
    if (config.verbose) {
      console.log(`  ⚠️  Documento sem payload_bruto`);
    }
    return;
  }

  const requisicao = doc.requisicao as { numero_processo?: string } | undefined;
  const numeroProcesso = requisicao?.numero_processo || 'N/A';

  if (config.verbose) {
    console.log(`\n📄 Processando: ${numeroProcesso} (${doc.trt})`);
  }

  // Extrair partes de cada polo
  const ATIVO = payloadBruto.ATIVO || [];
  const PASSIVO = payloadBruto.PASSIVO || [];
  const TERCEIROS = payloadBruto.TERCEIROS || [];

  // Processar ATIVO (clientes)
  for (const parte of ATIVO) {
    await processarParte(parte, 'cliente', config, resultado);
  }

  // Processar PASSIVO (partes contrárias)
  for (const parte of PASSIVO) {
    await processarParte(parte, 'parte_contraria', config, resultado);
  }

  // Processar TERCEIROS
  for (const parte of TERCEIROS) {
    await processarParte(parte, 'terceiro', config, resultado);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SINCRONIZAÇÃO DE ENTIDADES E ENDEREÇOS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  if (config.dryRun) {
    console.log('🔸 MODO DRY-RUN: Nenhuma alteração será persistida\n');
  }

  const resultado: ResultadoScript = {
    documentosProcessados: 0,
    partesProcessadas: 0,
    entidadesCriadas: {
      clientes: 0,
      partesContrarias: 0,
      terceiros: 0,
    },
    enderecosUpserted: 0,
    enderecosVinculados: 0,
    erros: [],
    ignorados: {
      semDocumentoValido: 0,
      payloadSemEndereco: 0,
    },
  };

  try {
    const db = await getMongoDatabase();
    const collection = db.collection('captura_logs_brutos');

    // Filtro base
    const filtro: Record<string, unknown> = { tipo_captura: 'partes', status: 'success' };
    if (config.trt) {
      filtro.trt = config.trt;
      console.log(`🔍 Filtrando por TRT: ${config.trt}`);
    }

    // Contar total
    const total = await collection.countDocuments(filtro);
    console.log(`📊 Total de documentos: ${total}`);
    if (config.limit) {
      console.log(`🔢 Limite: ${config.limit}`);
    }
    console.log(`📦 Batch size: ${config.batchSize}`);
    console.log('');

    // Processar em lotes
    let skip = 0;
    const startTime = Date.now();

    while (true) {
      const docs = await collection
        .find(filtro)
        .sort({ criado_em: -1 })
        .skip(skip)
        .limit(config.batchSize)
        .toArray();

      if (docs.length === 0) break;

      for (const doc of docs) {
        await processarDocumento(doc as Record<string, unknown>, config, resultado);
        resultado.documentosProcessados++;

        if (!config.verbose) {
          const progress = config.limit
            ? `${resultado.documentosProcessados}/${Math.min(total, config.limit)}`
            : `${resultado.documentosProcessados}/${total}`;
          process.stdout.write(`\r⏳ Processando... ${progress}`);
        }

        if (config.limit && resultado.documentosProcessados >= config.limit) {
          break;
        }
      }

      if (config.limit && resultado.documentosProcessados >= config.limit) {
        break;
      }

      skip += config.batchSize;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Relatório final
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  RELATÓRIO FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`📄 Documentos processados: ${resultado.documentosProcessados}`);
    console.log(`👥 Partes processadas: ${resultado.partesProcessadas}`);
    console.log('');
    console.log('📊 ENTIDADES CRIADAS:');
    console.log(`   ├─ Clientes: ${resultado.entidadesCriadas.clientes}`);
    console.log(`   ├─ Partes Contrárias: ${resultado.entidadesCriadas.partesContrarias}`);
    console.log(`   └─ Terceiros: ${resultado.entidadesCriadas.terceiros}`);
    console.log('');
    console.log('🏠 ENDEREÇOS:');
    console.log(`   ├─ Upserted: ${resultado.enderecosUpserted}`);
    console.log(`   └─ Vinculados: ${resultado.enderecosVinculados}`);
    console.log('');
    console.log('⏭️  IGNORADOS:');
    console.log(`   ├─ Sem documento válido: ${resultado.ignorados.semDocumentoValido}`);
    console.log(`   └─ Payload sem endereço: ${resultado.ignorados.payloadSemEndereco}`);
    console.log('');
    console.log(`❌ Erros: ${resultado.erros.length}`);

    if (resultado.erros.length > 0 && config.verbose) {
      console.log('\nDetalhes dos erros:');
      resultado.erros.slice(0, 10).forEach((erro, i) => {
        console.log(`   ${i + 1}. ${erro}`);
      });
      if (resultado.erros.length > 10) {
        console.log(`   ... e mais ${resultado.erros.length - 10} erros`);
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await closeMongoConnection();
  }
}

main().catch(console.error);
