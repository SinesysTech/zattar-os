/**
 * Script de Processamento de Contratos - MinIO para Supabase + Backblaze
 *
 * Processa pastas de clientes no MinIO com padrão NOME_CPF,
 * extrai dados de contratos via IA (Gemini 2.5 Flash),
 * persiste no Supabase e migra arquivos para Backblaze.
 *
 * Uso:
 *   node process_contracts_to_supabase.js --dry-run
 *   node process_contracts_to_supabase.js --limit=10
 *   node process_contracts_to_supabase.js
 */

import dotenv from 'dotenv';
import * as Minio from 'minio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// Obter diretório do projeto (2 níveis acima de workflows-docs/scripts/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Carregar variáveis de ambiente do projeto raiz
dotenv.config({ path: path.join(PROJECT_ROOT, '.env.local') });
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

// Importar pdf-parse dinamicamente
const pdfParseModule = await import('pdf-parse');
const PDFParse = pdfParseModule?.PDFParse;

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CONFIG = {
  minio: {
    endPoint: process.env.MINIO_ENDPOINT ?? 'storage-api.sinesys.app',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    useSSL: (process.env.MINIO_SECURE ?? 'true').toLowerCase() !== 'false',
    bucket: 'docs-12132024',
    prefix: 'polastrizattar/clientes/'
  },
  backblaze: {
    endpoint: process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT,
    region: process.env.BACKBLAZE_REGION || process.env.B2_REGION,
    keyId: process.env.BACKBLAZE_ACCESS_KEY_ID || process.env.B2_KEY_ID,
    applicationKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY || process.env.B2_APPLICATION_KEY,
    bucket: process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET
  },
  ai: {
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash'
  },
  defaults: {
    dryRunLimit: 10,
    concurrency: 3
  }
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  console.log(`${nowIso()} - ${msg}`);
}

function getArgValue(flag) {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf(flag);
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  // Suporte para --flag=value
  const match = argv.find(a => a.startsWith(`${flag}=`));
  if (match) return match.split('=')[1];
  return null;
}

function hasFlag(flag) {
  return process.argv.slice(2).some(a => a === flag || a.startsWith(`${flag}=`));
}

/**
 * Verifica se o nome da pasta segue o padrão NOME_CPF
 * Ex: ALBERTO_JORGE_GOMES_DE_OLIVEIRA_03975367474
 */
function isNomeCpfFolder(folderName) {
  const name = String(folderName ?? '').trim();
  if (!name) return false;

  // Deve ter underscores e terminar com 11 dígitos (CPF)
  const parts = name.split('_');
  if (parts.length < 2) return false;

  const lastPart = parts[parts.length - 1];
  // Verificar se o último segmento tem 11 dígitos (CPF)
  if (!/^\d{11}$/.test(lastPart)) return false;

  // Verificar se as outras partes são texto (nome)
  const nameParts = parts.slice(0, -1);
  if (nameParts.length === 0) return false;

  // Cada parte do nome deve ser texto (não apenas números)
  return nameParts.every(p => /^[A-Z]+$/i.test(p));
}

/**
 * Extrai CPF do nome da pasta
 */
function extractCpfFromFolderName(folderName) {
  const parts = String(folderName ?? '').split('_');
  const lastPart = parts[parts.length - 1];
  if (/^\d{11}$/.test(lastPart)) {
    return lastPart;
  }
  return null;
}

/**
 * Extrai nome do nome da pasta
 */
function extractNameFromFolderName(folderName) {
  const parts = String(folderName ?? '').split('_');
  // Remove o último item (CPF)
  const nameParts = parts.slice(0, -1);
  return nameParts.join(' ');
}

/**
 * Formata CPF para exibição
 */
function formatCpf(cpf) {
  const digits = String(cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Normaliza CPF (remove formatação)
 */
function normalizeCpf(value) {
  const raw = String(value ?? '');
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 11) return null;
  return digits;
}

/**
 * Verifica se arquivo contém "contrato" no nome (case insensitive)
 */
function isContratoFile(fileName) {
  const lower = String(fileName ?? '').toLowerCase();
  return lower.includes('contrato') && lower.endsWith('.pdf');
}

/**
 * Inferir gênero do nome
 */
function inferGeneroFromNome(nome) {
  const n = String(nome ?? '').trim();
  if (!n) return null;
  const last = n[n.length - 1]?.toUpperCase();
  if (last === 'A') return 'feminino';
  if (last === 'O') return 'masculino';
  return 'prefiro_nao_informar';
}

/**
 * Normaliza estado civil
 */
function normalizeEstadoCivil(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;

  const v = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');

  const map = {
    solteira: 'solteiro',
    solteiro: 'solteiro',
    casada: 'casado',
    casado: 'casado',
    divorciada: 'divorciado',
    divorciado: 'divorciado',
    viuva: 'viuvo',
    viuvo: 'viuvo',
    uniao_estavel: 'uniao_estavel',
    uniao: 'uniao_estavel',
    outro: 'outro'
  };

  return map[v] ?? null;
}

/**
 * Converte data BR para timestamptz
 */
function parseDateBrToTimestamptz(value) {
  const raw = String(value ?? '').trim();
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 12, 0, 0, 0)).toISOString();
}

/**
 * Escreve JSON atomicamente
 */
async function writeJsonAtomic(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, payload, { encoding: 'utf-8' });
  await fs.rename(tmpPath, filePath);
}

// ============================================================================
// CLIENTE GEMINI AI
// ============================================================================

class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.model = CONFIG.ai.model;
  }

  async extractContractData(pdfText) {
    const prompt = `Analise este contrato de prestação de serviços advocatícios e extraia os dados estruturados.

TEXTO DO CONTRATO:
${pdfText.slice(0, 15000)}

Extraia e retorne APENAS um JSON válido com esta estrutura (sem markdown, sem explicações):
{
  "contratante": {
    "nome_completo": "",
    "cpf": "",
    "rg": "",
    "email": "",
    "telefone": "",
    "endereco": {
      "logradouro": "",
      "numero": "",
      "complemento": "",
      "bairro": "",
      "cep": "",
      "municipio": "",
      "estado": ""
    },
    "estado_civil": "",
    "nacionalidade": "",
    "profissao": ""
  },
  "reclamada": {
    "nome": "",
    "cnpj": ""
  },
  "objeto_contrato": "",
  "tipo_acao": "",
  "valor_causa_estimado": null,
  "honorarios": {
    "tipo": "pro_exito",
    "percentual": null,
    "valor_fixo": null
  },
  "data_assinatura": ""
}

Se algum campo não estiver disponível, use null ou string vazia.
Retorne APENAS o JSON, sem explicações ou formatação markdown.`;

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // Limpar resposta (remover markdown se houver)
      let jsonStr = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Tentar parsear JSON
      return JSON.parse(jsonStr);
    } catch (error) {
      log(`Erro na extração com IA: ${error.message}`);
      return null;
    }
  }
}

// ============================================================================
// CLIENTE BACKBLAZE
// ============================================================================

class BackblazeClient {
  constructor() {
    const { endpoint, region, keyId, applicationKey, bucket } = CONFIG.backblaze;

    if (!endpoint || !region || !keyId || !applicationKey || !bucket) {
      log('⚠️ Backblaze não configurado - migração de arquivos desabilitada');
      this.enabled = false;
      return;
    }

    this.bucket = bucket;
    this.endpoint = endpoint;
    this.enabled = true;

    this.client = new S3Client({
      endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
      region,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: applicationKey
      }
    });
  }

  async uploadFile(key, buffer, contentType = 'application/octet-stream') {
    if (!this.enabled) return null;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      });

      await this.client.send(command);

      const url = this.endpoint.startsWith('http')
        ? `${this.endpoint}/${this.bucket}/${key}`
        : `https://${this.endpoint}/${this.bucket}/${key}`;

      return { url, key, bucket: this.bucket };
    } catch (error) {
      log(`Erro ao fazer upload para Backblaze: ${error.message}`);
      return null;
    }
  }

  async listFiles(prefix) {
    if (!this.enabled) return [];

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix
      });

      const response = await this.client.send(command);
      return response.Contents?.map(obj => obj.Key) ?? [];
    } catch (error) {
      log(`Erro ao listar arquivos do Backblaze: ${error.message}`);
      return [];
    }
  }
}

// ============================================================================
// CLIENTE MINIO
// ============================================================================

class MinIOClient {
  constructor() {
    const { endPoint, accessKey, secretKey, useSSL, bucket, prefix } = CONFIG.minio;

    if (!accessKey || !secretKey) {
      throw new Error('MINIO_ACCESS_KEY/MINIO_SECRET_KEY não encontradas no .env');
    }

    this.bucket = bucket;
    this.prefix = prefix;

    this.client = new Minio.Client({
      endPoint,
      accessKey,
      secretKey,
      useSSL
    });
  }

  /**
   * Lista todas as pastas de clientes
   */
  async listClientFolders() {
    const folders = new Set();
    const stream = this.client.listObjectsV2(this.bucket, this.prefix, true);

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj?.name) {
          const relative = obj.name.replace(this.prefix, '');
          const folderName = relative.split('/')[0];
          if (folderName) folders.add(folderName);
        }
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    return Array.from(folders).sort();
  }

  /**
   * Lista todos os arquivos em uma pasta (recursivo)
   */
  async listFilesInFolder(folderName) {
    const files = [];
    const prefix = `${this.prefix}${folderName}/`;
    const stream = this.client.listObjectsV2(this.bucket, prefix, true);

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj?.name) files.push(obj.name);
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    return files;
  }

  /**
   * Download de arquivo
   */
  async downloadFile(objectName) {
    try {
      const stream = await this.client.getObject(this.bucket, objectName);
      const chunks = [];

      await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', resolve);
      });

      return Buffer.concat(chunks);
    } catch (error) {
      log(`Erro ao baixar ${objectName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Extrai texto de PDF
   */
  async extractTextFromPdf(pdfBuffer) {
    try {
      if (!PDFParse || !pdfBuffer || pdfBuffer.length === 0) return '';

      const bytes = pdfBuffer instanceof Uint8Array && !Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : new Uint8Array(pdfBuffer);

      const parser = new PDFParse(bytes);
      await parser.load();
      const result = await parser.getText();
      return String(result?.text ?? '');
    } catch (error) {
      log(`Erro ao extrair texto do PDF: ${error.message}`);
      return '';
    }
  }
}

// ============================================================================
// SERVIÇOS SUPABASE
// ============================================================================

class SupabaseService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Busca cliente por CPF
   */
  async findClienteByCpf(cpf) {
    const digits = normalizeCpf(cpf);
    if (!digits) return null;

    const { data, error } = await this.client
      .from('clientes')
      .select('id, nome, cpf, documentos')
      .eq('cpf', digits)
      .limit(1);

    if (error) {
      log(`Erro ao buscar cliente: ${error.message}`);
      return null;
    }

    return data?.[0] ?? null;
  }

  /**
   * Cria ou atualiza cliente
   */
  async upsertCliente(dados, metaInfo) {
    const cpf = normalizeCpf(dados.cpf);
    const nome = String(dados.nome_completo ?? '').trim();

    if (!cpf || !nome) {
      log(`Dados insuficientes para criar cliente: nome=${nome}, cpf=${cpf}`);
      return null;
    }

    try {
      const genero = inferGeneroFromNome(nome);
      const estadoCivil = normalizeEstadoCivil(dados.estado_civil);

      const payload = {
        tipo_pessoa: 'pf',
        nome,
        cpf,
        rg: dados.rg ?? null,
        nacionalidade: dados.nacionalidade ?? null,
        estado_civil: estadoCivil,
        genero,
        tipo_documento: 'CPF',
        emails: dados.email ? [String(dados.email).trim()] : null,
        observacoes: dados.profissao ? `profissao: ${dados.profissao}` : null,
        dados_anteriores: {
          import: {
            source: 'process_contracts_to_supabase',
            folder_name: metaInfo?.folder_name ?? null,
            document_file: metaInfo?.document_file ?? null,
            processed_at: metaInfo?.processed_at ?? null
          }
        }
      };

      const { data, error } = await this.client
        .from('clientes')
        .upsert(payload, { onConflict: 'cpf' })
        .select('id, cpf, nome')
        .limit(1);

      if (error) throw error;

      const cliente = Array.isArray(data) ? data[0] : data;
      return cliente ?? null;
    } catch (error) {
      log(`Erro ao upsert cliente ${nome}: ${error.message}`);
      return null;
    }
  }

  /**
   * Atualiza coluna documentos do cliente
   */
  async updateClienteDocumentos(clienteId, documentosPath) {
    try {
      const { error } = await this.client
        .from('clientes')
        .update({ documentos: documentosPath })
        .eq('id', clienteId);

      if (error) throw error;
      return true;
    } catch (error) {
      log(`Erro ao atualizar documentos do cliente: ${error.message}`);
      return false;
    }
  }

  /**
   * Atualiza coluna documentos do contrato
   */
  async updateContratoDocumentos(contratoId, documentosPath) {
    try {
      const { error } = await this.client
        .from('contratos')
        .update({ documentos: documentosPath })
        .eq('id', contratoId);

      if (error) throw error;
      return true;
    } catch (error) {
      log(`Erro ao atualizar documentos do contrato: ${error.message}`);
      return false;
    }
  }

  /**
   * Cria ou atualiza endereço
   */
  async upsertEndereco(clienteId, endereco) {
    if (!clienteId || !endereco) return null;

    try {
      const { data: existing } = await this.client
        .from('enderecos')
        .select('id')
        .eq('entidade_tipo', 'cliente')
        .eq('entidade_id', clienteId)
        .limit(1);

      const payload = {
        entidade_tipo: 'cliente',
        entidade_id: clienteId,
        logradouro: endereco.logradouro ?? null,
        numero: endereco.numero ?? null,
        complemento: endereco.complemento ?? null,
        bairro: endereco.bairro ?? null,
        cep: endereco.cep ?? null,
        municipio: endereco.municipio ?? null,
        estado_sigla: endereco.estado ?? null,
        ativo: true
      };

      if (existing?.length) {
        const { error } = await this.client
          .from('enderecos')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id);

        if (error) throw error;
        return existing[0].id;
      }

      const { data, error } = await this.client
        .from('enderecos')
        .insert(payload)
        .select('id')
        .limit(1);

      if (error) throw error;

      const enderecoId = data?.[0]?.id;

      // Vincular endereço ao cliente
      if (enderecoId) {
        await this.client
          .from('clientes')
          .update({ endereco_id: enderecoId })
          .eq('id', clienteId);
      }

      return enderecoId;
    } catch (error) {
      log(`Erro ao upsert endereço: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca parte contrária por nome (LIKE)
   */
  async findParteContrariaLike(nome) {
    const q = String(nome ?? '').trim();
    if (!q) return null;

    try {
      const { data, error } = await this.client
        .from('partes_contrarias')
        .select('id, nome')
        .ilike('nome', `%${q}%`)
        .order('nome', { ascending: true })
        .limit(1);

      if (error) throw error;
      return data?.[0] ?? null;
    } catch (error) {
      log(`Erro ao buscar parte contrária: ${error.message}`);
      return null;
    }
  }

  /**
   * Cria parte contrária
   */
  async createParteContraria(dados) {
    const nome = String(dados.nome ?? '').trim();
    if (!nome) return null;

    try {
      const payload = {
        tipo_pessoa: dados.cnpj ? 'pj' : 'pf',
        nome,
        cnpj: dados.cnpj ?? null,
        tipo_documento: dados.cnpj ? 'CNPJ' : null
      };

      const { data, error } = await this.client
        .from('partes_contrarias')
        .insert(payload)
        .select('id, nome')
        .limit(1);

      if (error) throw error;
      return data?.[0] ?? null;
    } catch (error) {
      log(`Erro ao criar parte contrária: ${error.message}`);
      return null;
    }
  }

  /**
   * Verifica se contrato já existe
   */
  async contratoExists(clienteId, documentFile) {
    try {
      let query = this.client
        .from('contratos')
        .select('id')
        .eq('cliente_id', clienteId);

      if (documentFile) {
        query = query.ilike('observacoes', `%${documentFile}%`);
      }

      const { data, error } = await query.limit(1);
      if (error) throw error;
      return Boolean(data?.length);
    } catch (error) {
      log(`Erro ao verificar contrato existente: ${error.message}`);
      return false;
    }
  }

  /**
   * Cria contrato
   */
  async createContrato(dados, metaInfo, clienteId) {
    try {
      const exists = await this.contratoExists(clienteId, metaInfo?.document_file);
      if (exists) {
        log(`    Contrato já existe para este cliente`);
        return { inserted: false, reason: 'already_exists' };
      }

      const cadastradoEm = parseDateBrToTimestamptz(dados?.data_assinatura) ?? null;

      const payload = {
        tipo_contrato: 'ajuizamento',
        tipo_cobranca: dados?.honorarios?.tipo === 'pro_labore' ? 'pro_labore' : 'pro_exito',
        cliente_id: clienteId,
        papel_cliente_no_contrato: 'autora',
        status: 'contratado',
        segmento_id: 1, // Trabalhista
        ...(cadastradoEm ? { cadastrado_em: cadastradoEm } : {}),
        observacoes: `import: folder=${metaInfo?.folder_name ?? ''}; document_file=${metaInfo?.document_file ?? ''}; objeto=${dados?.objeto_contrato ?? 'N/A'}`,
        dados_anteriores: {
          import: {
            source: 'process_contracts_to_supabase',
            folder_name: metaInfo?.folder_name,
            document_file: metaInfo?.document_file,
            processed_at: metaInfo?.processed_at,
            extracted_data: dados
          }
        }
      };

      const { data, error } = await this.client
        .from('contratos')
        .insert(payload)
        .select('id')
        .limit(1);

      if (error) throw error;

      const contratoId = data?.[0]?.id;
      return { inserted: true, contratoId };
    } catch (error) {
      log(`Erro ao criar contrato: ${error.message}`);
      return { inserted: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Vincula parte ao contrato
   */
  async createContratoParte(contratoId, tipoEntidade, entidadeId, papelContratual, ordem = 0) {
    try {
      const payload = {
        contrato_id: contratoId,
        tipo_entidade: tipoEntidade,
        entidade_id: entidadeId,
        papel_contratual: papelContratual,
        ordem
      };

      const { error } = await this.client.from('contrato_partes').insert(payload);
      if (error) throw error;
      return true;
    } catch (error) {
      log(`Erro ao vincular parte ao contrato: ${error.message}`);
      return false;
    }
  }

  /**
   * Registra histórico de status do contrato
   */
  async createContratoStatusHistorico(contratoId, toStatus, changedAt = null, reason = null, metadata = null) {
    try {
      const payload = {
        contrato_id: contratoId,
        from_status: null,
        to_status: toStatus,
        ...(changedAt ? { changed_at: changedAt } : {}),
        reason: reason ?? 'Contrato importado via script',
        metadata: metadata ?? {
          source: 'process_contracts_to_supabase',
          automated: true
        }
      };

      const { error } = await this.client.from('contrato_status_historico').insert(payload);
      if (error) throw error;
      return true;
    } catch (error) {
      log(`Erro ao registrar histórico de status: ${error.message}`);
      return false;
    }
  }
}

// ============================================================================
// PROCESSADOR PRINCIPAL
// ============================================================================

class ContractProcessor {
  constructor(supabase) {
    this.minio = new MinIOClient();
    this.backblaze = new BackblazeClient();
    this.gemini = new GeminiClient(CONFIG.ai.apiKey);
    this.supabase = supabase ? new SupabaseService(supabase) : null;

    this.results = {
      metadata: {
        started_at: nowIso(),
        bucket: CONFIG.minio.bucket,
        prefix: CONFIG.minio.prefix
      },
      results: [],
      summary: {
        total_pastas: 0,
        pastas_processadas: 0,
        clientes_criados: 0,
        clientes_atualizados: 0,
        contratos_criados: 0,
        partes_contrarias_criadas: 0,
        partes_contrarias_existentes: 0,
        arquivos_migrados: 0,
        erros: 0
      }
    };
  }

  /**
   * Salva resultados em JSON
   */
  async saveResults(outputFile) {
    if (!outputFile) return;

    this.results.summary.finished_at = nowIso();
    await writeJsonAtomic(outputFile, this.results);
    log(`Resultados salvos em ${outputFile}`);
  }

  /**
   * Processa uma única pasta de cliente
   */
  async processFolder(folderName, dryRun = false) {
    const result = {
      pasta_original: folderName,
      cpf_extraido: extractCpfFromFolderName(folderName),
      nome_extraido: extractNameFromFolderName(folderName),
      contrato_pdf: null,
      dados_extraidos: null,
      supabase: {
        cliente_id: null,
        cliente_criado: false,
        endereco_id: null,
        parte_contraria_id: null,
        parte_contraria_criada: false,
        contrato_id: null,
        contrato_partes_ids: [],
        status_historico_id: null
      },
      backblaze: {
        path: null,
        arquivos_migrados: 0,
        tamanho_total_mb: 0
      },
      status: 'PENDING',
      processed_at: nowIso()
    };

    try {
      // 1. Listar arquivos da pasta
      const files = await this.minio.listFilesInFolder(folderName);
      log(`  Arquivos encontrados: ${files.length}`);

      // 2. Encontrar PDF de contrato
      const contratoFile = files.find(f => isContratoFile(path.basename(f)));

      if (!contratoFile) {
        log(`  ⚠️ Nenhum arquivo de contrato encontrado`);
        result.status = 'NO_CONTRACT_FILE';
        return result;
      }

      result.contrato_pdf = contratoFile;
      log(`  📄 Contrato encontrado: ${path.basename(contratoFile)}`);

      // 3. Download e extração de texto
      const pdfBuffer = await this.minio.downloadFile(contratoFile);
      if (!pdfBuffer || pdfBuffer.length === 0) {
        log(`  ❌ Erro ao baixar PDF`);
        result.status = 'DOWNLOAD_ERROR';
        return result;
      }

      const pdfText = await this.minio.extractTextFromPdf(pdfBuffer);
      if (!pdfText || pdfText.trim().length < 100) {
        log(`  ⚠️ Texto extraído muito curto ou vazio`);
        result.status = 'EMPTY_TEXT';
        return result;
      }

      log(`  📝 Texto extraído: ${pdfText.length} caracteres`);

      // 4. Processar com IA
      log(`  🤖 Processando com Gemini...`);
      const dadosExtraidos = await this.gemini.extractContractData(pdfText);

      if (!dadosExtraidos) {
        log(`  ❌ Falha na extração com IA`);
        result.status = 'AI_EXTRACTION_FAILED';
        return result;
      }

      result.dados_extraidos = dadosExtraidos;
      log(`  ✅ Dados extraídos com sucesso`);

      // Se dry run, parar aqui
      if (dryRun) {
        result.status = 'DRY_RUN_SUCCESS';
        log(`  🔍 [DRY-RUN] Dados extraídos (não persistidos)`);
        return result;
      }

      // 5. Persistir no Supabase
      if (this.supabase) {
        const metaInfo = {
          folder_name: folderName,
          document_file: contratoFile,
          processed_at: nowIso()
        };

        // 5.1 Cliente
        const cpfFromFolder = result.cpf_extraido;
        const cpfFromExtraction = normalizeCpf(dadosExtraidos.contratante?.cpf);
        const cpfToUse = cpfFromExtraction || cpfFromFolder;

        const nomeFromFolder = result.nome_extraido;
        const nomeFromExtraction = dadosExtraidos.contratante?.nome_completo;
        const nomeToUse = nomeFromExtraction || nomeFromFolder;

        // Verificar se cliente já existe
        const existingCliente = await this.supabase.findClienteByCpf(cpfToUse);

        let cliente;
        if (existingCliente) {
          cliente = existingCliente;
          result.supabase.cliente_id = cliente.id;
          result.supabase.cliente_criado = false;
          this.results.summary.clientes_atualizados++;
          log(`  👤 Cliente existente: ${cliente.nome} (ID: ${cliente.id})`);
        } else {
          cliente = await this.supabase.upsertCliente({
            ...dadosExtraidos.contratante,
            cpf: cpfToUse,
            nome_completo: nomeToUse
          }, metaInfo);

          if (cliente) {
            result.supabase.cliente_id = cliente.id;
            result.supabase.cliente_criado = true;
            this.results.summary.clientes_criados++;
            log(`  👤 Cliente criado: ${cliente.nome} (ID: ${cliente.id})`);
          }
        }

        if (!cliente) {
          log(`  ❌ Erro ao criar/buscar cliente`);
          result.status = 'CLIENT_ERROR';
          return result;
        }

        // 5.2 Endereço
        if (dadosExtraidos.contratante?.endereco) {
          const enderecoId = await this.supabase.upsertEndereco(cliente.id, dadosExtraidos.contratante.endereco);
          if (enderecoId) {
            result.supabase.endereco_id = enderecoId;
            log(`  📍 Endereço salvo (ID: ${enderecoId})`);
          }
        }

        // 5.3 Parte Contrária (Reclamada)
        if (dadosExtraidos.reclamada?.nome) {
          let parteContraria = await this.supabase.findParteContrariaLike(dadosExtraidos.reclamada.nome);

          if (parteContraria) {
            result.supabase.parte_contraria_id = parteContraria.id;
            result.supabase.parte_contraria_criada = false;
            this.results.summary.partes_contrarias_existentes++;
            log(`  🏢 Parte contrária existente: ${parteContraria.nome} (ID: ${parteContraria.id})`);
          } else {
            parteContraria = await this.supabase.createParteContraria(dadosExtraidos.reclamada);
            if (parteContraria) {
              result.supabase.parte_contraria_id = parteContraria.id;
              result.supabase.parte_contraria_criada = true;
              this.results.summary.partes_contrarias_criadas++;
              log(`  🏢 Parte contrária criada: ${parteContraria.nome} (ID: ${parteContraria.id})`);
            }
          }
        }

        // 5.4 Contrato
        const contratoResult = await this.supabase.createContrato(dadosExtraidos, metaInfo, cliente.id);

        if (contratoResult.inserted) {
          result.supabase.contrato_id = contratoResult.contratoId;
          this.results.summary.contratos_criados++;
          log(`  📋 Contrato criado (ID: ${contratoResult.contratoId})`);

          // 5.5 Contrato Partes - Cliente como autora
          await this.supabase.createContratoParte(
            contratoResult.contratoId,
            'cliente',
            cliente.id,
            'autora',
            0
          );
          result.supabase.contrato_partes_ids.push({ tipo: 'cliente', id: cliente.id });

          // 5.5 Contrato Partes - Reclamada como ré
          if (result.supabase.parte_contraria_id) {
            await this.supabase.createContratoParte(
              contratoResult.contratoId,
              'parte_contraria',
              result.supabase.parte_contraria_id,
              're',
              1
            );
            result.supabase.contrato_partes_ids.push({ tipo: 'parte_contraria', id: result.supabase.parte_contraria_id });
          }

          // 5.6 Status Histórico
          const cadastradoEm = parseDateBrToTimestamptz(dadosExtraidos.data_assinatura);
          await this.supabase.createContratoStatusHistorico(
            contratoResult.contratoId,
            'contratado',
            cadastradoEm,
            'Contrato assinado importado via script',
            { source: 'process_contracts_to_supabase', folder_name: folderName }
          );
        } else {
          log(`  ⚠️ Contrato não criado: ${contratoResult.reason}`);
        }

        // 6. Migrar arquivos para Backblaze
        if (this.backblaze.enabled && cliente) {
          const backblazePath = `clientes/${cpfToUse}/`;
          let totalSize = 0;
          let migratedCount = 0;

          log(`  ☁️ Migrando arquivos para Backblaze: ${backblazePath}`);

          for (const file of files) {
            const fileName = path.basename(file);
            const buffer = await this.minio.downloadFile(file);

            if (buffer) {
              const contentType = fileName.toLowerCase().endsWith('.pdf')
                ? 'application/pdf'
                : 'application/octet-stream';

              const uploadResult = await this.backblaze.uploadFile(
                `${backblazePath}${fileName}`,
                buffer,
                contentType
              );

              if (uploadResult) {
                migratedCount++;
                totalSize += buffer.length;
              }
            }
          }

          result.backblaze.path = backblazePath;
          result.backblaze.arquivos_migrados = migratedCount;
          result.backblaze.tamanho_total_mb = Number((totalSize / (1024 * 1024)).toFixed(2));
          this.results.summary.arquivos_migrados += migratedCount;

          log(`  ✅ ${migratedCount} arquivos migrados (${result.backblaze.tamanho_total_mb} MB)`);

          // Atualizar coluna documentos do cliente e do contrato
          if (migratedCount > 0) {
            await this.supabase.updateClienteDocumentos(cliente.id, backblazePath);

            // Atualizar documentos do contrato também
            if (result.supabase.contrato_id) {
              await this.supabase.updateContratoDocumentos(result.supabase.contrato_id, backblazePath);
            }
          }
        }
      }

      result.status = 'SUCCESS';
      return result;

    } catch (error) {
      log(`  ❌ Erro ao processar pasta: ${error.message}`);
      result.status = 'ERROR';
      result.error = error.message;
      this.results.summary.erros++;
      return result;
    }
  }

  /**
   * Processa todas as pastas
   */
  async processAll({ dryRun = false, limit = null, skip = 0, outputFile = null }) {
    log('╔════════════════════════════════════════════════════════════════╗');
    log('║     Processamento de Contratos - MinIO → Supabase + Backblaze  ║');
    log('╚════════════════════════════════════════════════════════════════╝\n');

    log(`📅 Data: ${nowIso()}`);
    log(`🪣 Bucket: ${CONFIG.minio.bucket}`);
    log(`📁 Prefixo: ${CONFIG.minio.prefix}`);
    log(`🤖 Modelo IA: ${CONFIG.ai.model}`);
    if (dryRun) log(`🔍 MODO DRY-RUN: Nenhuma alteração será feita`);
    if (skip > 0) log(`⏭️ Pulando: ${skip} pastas já processadas`);
    if (limit) log(`🔢 Limite: ${limit} pastas`);
    log('');

    // Listar todas as pastas
    log('⏳ Listando pastas de clientes...');
    const allFolders = await this.minio.listClientFolders();
    log(`📦 Total de pastas encontradas: ${allFolders.length}`);

    // Filtrar apenas pastas com padrão NOME_CPF
    const eligibleFolders = allFolders.filter(isNomeCpfFolder);
    log(`✅ Pastas com padrão NOME_CPF: ${eligibleFolders.length}`);
    log(`⏭️ Pastas ignoradas (outros padrões): ${allFolders.length - eligibleFolders.length}`);
    log('');

    // Aplicar skip e limite
    const afterSkip = skip > 0 ? eligibleFolders.slice(skip) : eligibleFolders;
    const foldersToProcess = limit ? afterSkip.slice(0, limit) : afterSkip;
    this.results.summary.total_pastas = foldersToProcess.length;

    if (foldersToProcess.length === 0) {
      log('⚠️ Nenhuma pasta elegível para processamento');
      return this.results;
    }

    log(`🚀 Processando ${foldersToProcess.length} pastas...\n`);
    log('═'.repeat(70));

    // Processar cada pasta
    for (let i = 0; i < foldersToProcess.length; i++) {
      const folderName = foldersToProcess[i];
      const progress = `[${i + 1}/${foldersToProcess.length}]`;

      log(`\n${progress} 📁 ${folderName}`);
      log(`    CPF: ${formatCpf(extractCpfFromFolderName(folderName))}`);
      log(`    Nome: ${extractNameFromFolderName(folderName)}`);

      const result = await this.processFolder(folderName, dryRun);
      this.results.results.push(result);
      this.results.summary.pastas_processadas++;

      // Salvar resultados após cada pasta (tempo real)
      if (outputFile) {
        await this.saveResults(outputFile);
      }

      log(`    Status: ${result.status}`);
    }

    // Resumo final
    log('\n');
    log('═'.repeat(70));
    log('╔════════════════════════════════════════════════════════════════╗');
    log('║                      RESUMO DA OPERAÇÃO                        ║');
    log('╚════════════════════════════════════════════════════════════════╝\n');
    log(`   📊 Total de pastas:              ${this.results.summary.total_pastas}`);
    log(`   ✅ Pastas processadas:           ${this.results.summary.pastas_processadas}`);
    log(`   👤 Clientes criados:             ${this.results.summary.clientes_criados}`);
    log(`   👤 Clientes atualizados:         ${this.results.summary.clientes_atualizados}`);
    log(`   📋 Contratos criados:            ${this.results.summary.contratos_criados}`);
    log(`   🏢 Partes contrárias criadas:    ${this.results.summary.partes_contrarias_criadas}`);
    log(`   🏢 Partes contrárias existentes: ${this.results.summary.partes_contrarias_existentes}`);
    log(`   ☁️ Arquivos migrados:            ${this.results.summary.arquivos_migrados}`);
    log(`   ❌ Erros:                        ${this.results.summary.erros}\n`);

    // Salvar resultados finais
    if (outputFile) {
      await this.saveResults(outputFile);
    }

    return this.results;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  // Verificar configurações
  if (!CONFIG.ai.apiKey) {
    log('❌ GOOGLE_API_KEY ou GEMINI_API_KEY não configurada');
    process.exit(1);
  }

  // Configurar Supabase
  let supabase = null;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.SUPABASE_SECRET_KEY
    ?? process.env.SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    log(`✅ Supabase configurado: ${supabaseUrl}`);
  } else {
    log('⚠️ Supabase não configurado - apenas salvando em JSON');
    log(`   SUPABASE_URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
    log(`   SUPABASE_KEY: ${supabaseKey ? 'OK' : 'MISSING'}`);
  }

  // Parsear argumentos
  const dryRun = hasFlag('--dry-run');
  const limitRaw = getArgValue('--limit');
  const skipRaw = getArgValue('--skip');
  const limit = dryRun && !limitRaw
    ? CONFIG.defaults.dryRunLimit  // Dry run usa limite de 10 por padrão
    : (limitRaw ? Number(limitRaw) : null);
  const skip = skipRaw ? Number(skipRaw) : 0;

  // Configurar output
  const timestamp = nowIso().replace(/[:.]/g, '-');
  const outDir = getArgValue('--outdir') ?? path.join('workflows-docs', 'output', 'contracts', timestamp);
  const outputFile = path.join(outDir, 'results.json');

  // Processar
  const processor = new ContractProcessor(supabase);
  await processor.processAll({ dryRun, limit, skip, outputFile });

  log(`\n✨ Processamento concluído!`);
  log(`📄 Resultados salvos em: ${outputFile}`);
}

main().catch((e) => {
  log(`❌ Fatal: ${e?.message ?? e}`);
  console.error(e);
  process.exitCode = 1;
});
