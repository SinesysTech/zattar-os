import dotenv from 'dotenv';
import * as Minio from 'minio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { OpenRouterClient } from './openrouter_client.js';

// Carregar variáveis de ambiente (prioriza .env.local como no Next.js)
dotenv.config({ path: '.env.local' });
dotenv.config();

const pdfParseModule = await import('pdf-parse');
const PDFParse = pdfParseModule?.PDFParse;

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'storage-api.sinesys.app';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_SECURE = (process.env.MINIO_SECURE ?? 'true').toLowerCase() !== 'false';

const CONTRACT_KEYWORDS = ['contrato', 'contract'];
const POWER_OF_ATTORNEY_KEYWORDS = ['procuracao', 'procuração'];
const DECLARATION_KEYWORDS = ['declaracao', 'declaração'];

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
  return null;
}

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag);
}

function safeFilePart(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function filenameHasTeste(value) {
  const text = normalizeText(value);
  if (!text) return false;
  // Pedido do usuário: não processar nenhum documento que contenha TESTE no nome
  return text.includes('teste');
}

function filenameHasSigned(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return text.includes('signed');
}

function filenameHasContrato(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return text.includes('contrato') || text.includes('contract');
}

function isNumericFolderName(value) {
  const s = String(value ?? '').trim();
  return /^\d+$/.test(s);
}

function _isFolderId(value) {
  const s = String(value ?? '');
  return /^[a-z0-9]+$/i.test(s);
}

function isRenamedFolder(value) {
  const s = String(value ?? '');
  // Regex para identificar pastas já renomeadas no padrão "Nome - XXX.XXX.XXX-XX"
  return / - \d{3}\.\d{3}\.\d{3}-\d{2}$/.test(s);
}

function sanitizeFolderName(name) {
  let out = String(name ?? '');
  out = out.replace(/[<>:"/\\|?*]/g, '_');
  out = out.replace(/\s+/g, ' ');
  if (out.length > 200) out = out.slice(0, 200);
  return out.trim();
}

function normalizeCpf(value) {
  const raw = String(value ?? '');
  const match = raw.match(/\d{3}\.?(\d{3})\.?(\d{3})-?(\d{2})/);
  if (!match) return null;

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 11) return null;
  const cpf = digits.slice(0, 11);
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

function cpfDigits(value) {
  const cpf = normalizeCpf(value);
  return cpf ? cpf.replace(/\D/g, '') : null;
}

function parseDateBrToIso(value) {
  const raw = String(value ?? '').trim();
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateBrToTimestamptz(value) {
  const isoDate = parseDateBrToIso(value);
  if (!isoDate) return null;
  const [yyyy, mm, dd] = isoDate.split('-').map((v) => Number(v));
  // Meio-dia UTC para evitar “voltar um dia” dependendo do timezone do servidor
  return new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0, 0)).toISOString();
}

function normalizeRootPrefix(prefix) {
  return String(prefix ?? '').trim().replace(/^\/+|\/+$/g, '');
}

function joinObjectKey(prefix, key) {
  const p = normalizeRootPrefix(prefix);
  const k = String(key ?? '').replace(/^\/+/, '');
  if (!p) return k;
  if (!k) return p;
  return `${p}/${k}`;
}

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

function inferGeneroFromNome(nome) {
  const n = String(nome ?? '').trim();
  if (!n) return null;
  const last = n[n.length - 1]?.toUpperCase();
  if (last === 'A') return 'feminino';
  if (last === 'O') return 'masculino';
  return 'prefiro_nao_informar';
}

function parseBrazilPhone(phone) {
  const raw = String(phone ?? '').trim();
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) digits = digits.slice(2);
  if (digits.length < 10) return null;
  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  return { ddd, number };
}

async function loadJsonArrayIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, { encoding: 'utf-8' });
    const text = raw.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      const lastBracket = text.lastIndexOf(']');
      if (lastBracket > 0) {
        const sliced = text.slice(0, lastBracket + 1);
        const parsed = JSON.parse(sliced);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    }
  } catch {
    return [];
  }
}

async function writeJsonArrayAtomic(filePath, arr) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const bakPath = `${filePath}.bak`;
  const payload = JSON.stringify(arr, null, 2);
  await fs.writeFile(tmpPath, payload, { encoding: 'utf-8' });

  try {
    await fs.unlink(bakPath);
  } catch {

  }

  try {
    await fs.rename(filePath, bakPath);
  } catch {

  }

  await fs.rename(tmpPath, filePath);
}

// ==================== FUNÇÕES SUPABASE ====================

async function upsertEndereco(supabase, enderecoTexto, entidadeTipo, entidadeId) {
  if (!enderecoTexto || !entidadeTipo || !entidadeId) return null;

  try {
    // Verificar se já existe endereço para esta entidade
    const { data: existing } = await supabase
      .from('enderecos')
      .select('id')
      .eq('entidade_tipo', entidadeTipo)
      .eq('entidade_id', entidadeId)
      .limit(1);

    if (existing?.length) {
      // Atualizar endereço existente
      const { error: updateError } = await supabase
        .from('enderecos')
        .update({ logradouro: enderecoTexto, updated_at: new Date().toISOString() })
        .eq('id', existing[0].id);

      if (updateError) throw updateError;
      return existing[0].id;
    }

    // Criar novo endereço
    const payload = {
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      logradouro: enderecoTexto,
      ativo: true
    };

    const { data, error } = await supabase
      .from('enderecos')
      .insert(payload)
      .select('id')
      .limit(1);

    if (error) throw error;
    return data?.[0]?.id ?? null;
  } catch (e) {
    log(`Erro ao upsert endereço: ${e?.message ?? e}`);
    return null;
  }
}

async function upsertCliente(supabase, qualificacao, metaInfo) {
  const cpf = cpfDigits(qualificacao?.cpf);
  const nome = String(qualificacao?.nome_completo ?? '').trim();
  if (!cpf || !nome) return null;

  try {
    const genero = inferGeneroFromNome(nome);
    const estadoCivil = normalizeEstadoCivil(qualificacao?.estado_civil);
    const phone = parseBrazilPhone(qualificacao?.telefone);

    const payload = {
      tipo_pessoa: 'pf',
      nome,
      cpf,
      rg: qualificacao?.rg ?? null,
      nacionalidade: qualificacao?.nacionalidade ?? null,
      estado_civil: estadoCivil,
      genero,
      tipo_documento: 'CPF',
      emails: qualificacao?.email ? [String(qualificacao.email).trim()] : null,
      ddd_celular: phone?.ddd ?? null,
      numero_celular: phone?.number ?? null,
      observacoes: qualificacao?.profissao ? `profissao: ${qualificacao.profissao}` : null,
      dados_anteriores: {
        import: {
          source: 'workflow-docs-ai',
          folder_id: metaInfo?.folder_id ?? null,
          document_file: metaInfo?.document_file ?? null,
          processed_at: metaInfo?.processed_at ?? null
        }
      }
    };

    const { data, error } = await supabase
      .from('clientes')
      .upsert(payload, { onConflict: 'cpf' })
      .select('id, cpf, nome')
      .limit(1);

    if (error) throw error;
    const rec = Array.isArray(data) ? data[0] : data;
    const clienteId = rec?.id ?? null;

    // Criar/atualizar endereço DEPOIS do cliente, se houver
    if (clienteId && qualificacao?.endereco) {
      const enderecoId = await upsertEndereco(supabase, qualificacao.endereco, 'cliente', clienteId);

      // Vincular endereço ao cliente
      if (enderecoId) {
        await supabase
          .from('clientes')
          .update({ endereco_id: enderecoId })
          .eq('id', clienteId);
      }
    }

    return clienteId;
  } catch (e) {
    log(`Erro ao upsert cliente ${nome}: ${e?.message ?? e}`);
    return null;
  }
}

async function resolveParteContrariaId(supabase, objetoNome) {
  const q = String(objetoNome ?? '').trim();
  if (!q) return null;

  try {
    const { data: found, error: findErr } = await supabase
      .from('partes_contrarias')
      .select('id, nome')
      .ilike('nome', `%${q}%`)
      .order('nome', { ascending: true })
      .limit(1);

    if (findErr) throw findErr;
    if (found?.length) {
      log(`    Parte contrária encontrada: ${found[0].nome} (ID: ${found[0].id})`);
      return found[0].id;
    }

    const payload = {
      tipo_pessoa: 'pj',
      nome: q,
      tipo_documento: 'CNPJ'
    };

    const { data: created, error: createErr } = await supabase
      .from('partes_contrarias')
      .insert(payload)
      .select('id')
      .limit(1);

    if (createErr) throw createErr;
    log(`    Parte contrária criada: ${q} (ID: ${created?.[0]?.id})`);
    return created?.[0]?.id ?? null;
  } catch (e) {
    log(`Erro ao resolver parte contrária ${q}: ${e?.message ?? e}`);
    return null;
  }
}

async function contratoExists(supabase, { clienteId, documentFile }) {
  try {
    let query = supabase
      .from('contratos')
      .select('id')
      .eq('cliente_id', clienteId);

    if (documentFile) {
      query = query.ilike('observacoes', `%${documentFile}%`);
    }

    query = query.limit(1);

    const { data, error } = await query;
    if (error) throw error;
    return Boolean(data?.length);
  } catch (e) {
    log(`Erro ao verificar se contrato existe: ${e?.message ?? e}`);
    return false;
  }
}

async function insertContratoPartes(supabase, contratoId, parteContrariaId) {
  if (!contratoId || !parteContrariaId) return false;

  try {
    const payload = {
      contrato_id: contratoId,
      tipo_entidade: 'parte_contraria',
      entidade_id: parteContrariaId,
      papel_contratual: 're',
      ordem: 1
    };

    const { error } = await supabase.from('contrato_partes').insert(payload);
    if (error) throw error;

    log(`    Parte contrária vinculada ao contrato (ID: ${parteContrariaId})`);
    return true;
  } catch (e) {
    log(`Erro ao vincular parte contrária ao contrato: ${e?.message ?? e}`);
    return false;
  }
}

async function insertContratoStatusHistorico(supabase, contratoId, toStatus, changedAtIso = null, reason = null, metadata = null) {
  if (!contratoId || !toStatus) return false;

  try {
    const payload = {
      contrato_id: contratoId,
      from_status: null, // Primeiro status, não tem from_status
      to_status: toStatus,
      ...(changedAtIso ? { changed_at: changedAtIso } : {}),
      reason: reason ?? 'Contrato criado via importação automática',
      metadata: metadata ?? {
        source: 'workflow-docs-ai',
        automated: true
      }
    };

    const { error } = await supabase.from('contrato_status_historico').insert(payload);
    if (error) throw error;

    log(`    Status inicial registrado no histórico: ${toStatus}`);
    return true;
  } catch (e) {
    log(`Erro ao inserir histórico de status: ${e?.message ?? e}`);
    return false;
  }
}

async function insertContrato(supabase, contratoData, metaInfo, { clienteId, parteContrariaId }) {
  const documentFile = metaInfo?.original_file ?? null;

  try {
    const exists = await contratoExists(supabase, {
      clienteId,
      documentFile
    });

    if (exists) {
      log(`    Contrato já existe no banco`);
      return { inserted: false, reason: 'already_exists' };
    }

    const cadastradoEm = parseDateBrToTimestamptz(contratoData?.data_assinatura) ?? null;

    const payload = {
      tipo_contrato: 'ajuizamento',
      tipo_cobranca: 'pro_exito',
      cliente_id: clienteId,
      papel_cliente_no_contrato: 'autora',
      status: 'contratado',
      segmento_id: 1, // Trabalhista
      ...(cadastradoEm ? { cadastrado_em: cadastradoEm } : {}),
      observacoes: `import: folder_id=${metaInfo?.folder_id ?? ''}; document_file=${documentFile ?? ''}; data_assinatura_extraida=${contratoData?.data_assinatura ?? 'N/A'}`,
      dados_anteriores: {
        import: {
          source: 'workflow-docs-ai',
          folder_id: metaInfo?.folder_id ?? null,
          document_file: documentFile,
          processed_at: metaInfo?.processed_at ?? null,
          extracted_data: contratoData
        }
      }
    };

    const { data, error } = await supabase
      .from('contratos')
      .insert(payload)
      .select('id')
      .limit(1);

    if (error) throw error;

    const contratoId = data?.[0]?.id;

    // Vincular parte contrária na tabela contrato_partes
    if (contratoId && parteContrariaId) {
      await insertContratoPartes(supabase, contratoId, parteContrariaId);
    }

    // Registrar status inicial no histórico
    if (contratoId) {
      await insertContratoStatusHistorico(
        supabase,
        contratoId,
        'contratado',
        cadastradoEm,
        'Contrato assinado importado via AI',
        {
          source: 'workflow-docs-ai',
          folder_id: metaInfo?.folder_id,
          document_file: documentFile,
          data_assinatura_extraida: contratoData?.data_assinatura,
          cadastrado_em: cadastradoEm
        }
      );
    }

    log(`    ✅ Contrato inserido no banco (ID: ${contratoId})`);
    return { inserted: true, contratoId };
  } catch (e) {
    log(`Erro ao inserir contrato: ${e?.message ?? e}`);
    return { inserted: false, reason: 'error', error: e?.message ?? e };
  }
}

class MinIOProcessor {
  constructor(bucketName, supabase = null, rootPrefix = '') {
    if (!MINIO_ACCESS_KEY || !MINIO_SECRET_KEY) {
      throw new Error('MINIO_ACCESS_KEY/MINIO_SECRET_KEY não encontradas no .env');
    }

    this.bucketName = bucketName;
    this.supabase = supabase;
    this.rootPrefix = normalizeRootPrefix(rootPrefix);
    this.client = new Minio.Client({
      endPoint: MINIO_ENDPOINT,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
      useSSL: MINIO_SECURE
    });

    this.aiClient = new OpenRouterClient();
  }

  withRootPrefix(key) {
    return joinObjectKey(this.rootPrefix, key);
  }

  stripRootPrefix(key) {
    const full = String(key ?? '');
    if (!this.rootPrefix) return full;
    const prefix = `${this.rootPrefix}/`;
    if (full.startsWith(prefix)) return full.slice(prefix.length);
    return full;
  }

  async findContractDocumentInFolder(folderId) {
    const prefix = this.withRootPrefix(`${folderId}/`);
    const stream = this.client.listObjectsV2(this.bucketName, prefix, true);

    return await new Promise((resolve, reject) => {
      let resolved = false;

      const done = (val) => {
        if (resolved) return;
        resolved = true;
        resolve(val);
      };

      stream.on('data', (obj) => {
        if (resolved) return;
        const objectName = obj?.name;
        if (!objectName) return;
        const lower = String(objectName).toLowerCase();
        if (!lower.endsWith('.pdf')) return;
        if (!CONTRACT_KEYWORDS.some((kw) => lower.includes(kw))) return;

        try {
          if (typeof stream.destroy === 'function') stream.destroy();
        } catch {
          
        }

        done({ objectName: String(objectName), documentType: 'CONTRACT' });
      });

      stream.on('error', (e) => {
        if (resolved) return;
        reject(e);
      });

      stream.on('end', () => {
        if (resolved) return;
        done(null);
      });
    });
  }

  async listAllObjectNames(prefix = '', recursive = true) {
    const names = [];
    const stream = this.client.listObjectsV2(this.bucketName, this.withRootPrefix(prefix), recursive);

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj?.name) names.push(obj.name);
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    return names;
  }

  async listClientFolders() {
    const objects = await this.listAllObjectNames('', true);
    const folders = new Set();

    for (const objectName of objects) {
      const relative = this.stripRootPrefix(objectName);
      const parts = String(relative).split('/');
      if (parts.length > 1 && parts[0]) folders.add(parts[0]);
    }

    return Array.from(folders).sort();
  }

  async getFilesInFolder(folderId) {
    return this.listAllObjectNames(`${folderId}/`, true);
  }

  async downloadFile(objectName) {
    try {
      const stream = await this.client.getObject(this.bucketName, objectName);
      const chunks = [];

      await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', resolve);
      });

      return Buffer.concat(chunks);
    } catch (e) {
      log(`Erro ao baixar ${objectName}: ${e?.message ?? e}`);
      return Buffer.from([]);
    }
  }

  listPdfsRecursive(files) {
    const pdfs = [];
    for (const file of files) {
      const objectName = String(file);
      if (!objectName.toLowerCase().endsWith('.pdf')) continue;
      pdfs.push(objectName);
    }
    return pdfs;
  }

  findContractDocument(folderId, files) {
    const pdfs = this.listPdfsRecursive(files);
    for (const objectName of pdfs) {
      const filenameLower = objectName.toLowerCase();
      if (CONTRACT_KEYWORDS.some((kw) => filenameLower.includes(kw))) {
        return { objectName, documentType: 'CONTRACT' };
      }
    }
    return null;
  }

  findFallbackDocument(folderId, files) {
    const pdfs = this.listPdfsRecursive(files);
    const powers = [];
    const declarations = [];
    const otherPdfs = [];

    for (const objectName of pdfs) {
      const filenameLower = objectName.toLowerCase();
      if (POWER_OF_ATTORNEY_KEYWORDS.some((kw) => filenameLower.includes(kw))) {
        powers.push(objectName);
        continue;
      }
      if (DECLARATION_KEYWORDS.some((kw) => filenameLower.includes(kw))) {
        declarations.push(objectName);
        continue;
      }
      otherPdfs.push(objectName);
    }

    if (powers.length) return { objectName: powers[0], documentType: 'POWER_OF_ATTORNEY' };
    if (declarations.length) return { objectName: declarations[0], documentType: 'DECLARATION' };
    if (otherPdfs.length) return { objectName: otherPdfs[0], documentType: 'OTHER' };
    return null;
  }

  async extractTextFromPdf(pdfBuffer) {
    try {
      if (!PDFParse) {
        throw new Error('PDFParse não disponível no pacote pdf-parse');
      }

      if (!pdfBuffer || pdfBuffer.length === 0) return '';

      // pdf-parse (v2+) espera Uint8Array (não Buffer)
      const bytes =
        pdfBuffer instanceof Uint8Array && !Buffer.isBuffer(pdfBuffer)
          ? pdfBuffer
          : new Uint8Array(pdfBuffer);
      const parser = new PDFParse(bytes);
      await parser.load();
      const result = await parser.getText();
      return String(result?.text ?? '');
    } catch (e) {
      log(`Erro ao extrair texto do PDF: ${e?.message ?? e}`);
      return '';
    }
  }

  async renameFolder(oldFolderId, newName) {
    try {
      const sanitized = sanitizeFolderName(newName);
      if (!sanitized) {
        log(`Nome inválido para renomeação: ${newName}`);
        return false;
      }

      const objects = await this.listAllObjectNames(`${oldFolderId}/`, true);
      if (!objects.length) {
        log(`Nenhum objeto encontrado na pasta ${oldFolderId}`);
        return false;
      }

      let copied = 0;
      for (const oldPath of objects) {
        const relOld = this.stripRootPrefix(oldPath);
        const relNew = String(relOld).replace(`${oldFolderId}/`, `${sanitized}/`);
        const newPath = this.withRootPrefix(relNew);
        const source = `/${this.bucketName}/${oldPath}`;
        await this.client.copyObject(this.bucketName, newPath, source);
        copied += 1;
      }

      for (const oldPath of objects) {
        await this.client.removeObject(this.bucketName, oldPath);
      }

      log(`Pasta renomeada: ${oldFolderId} -> ${sanitized} (${copied} arquivos)`);
      return true;
    } catch (e) {
      log(`Erro ao renomear pasta ${oldFolderId}: ${e?.message ?? e}`);
      return false;
    }
  }

  async renameFile(oldName, newName) {
    try {
      if (oldName === newName) return true;
      const source = `/${this.bucketName}/${oldName}`;
      await this.client.copyObject(this.bucketName, newName, source);
      await this.client.removeObject(this.bucketName, oldName);
      return true;
    } catch (e) {
      log(`Erro ao renomear arquivo ${oldName} -> ${newName}: ${e?.message ?? e}`);
      return false;
    }
  }

  async saveResults(results, outputFile) {
    if (!outputFile || !results) return;
    try {
      await writeJsonArrayAtomic(outputFile, results);
      log(`Resultados salvos em ${outputFile} (${results.length} registros)`);
    } catch (e) {
      log(`Erro ao salvar resultados em ${outputFile}: ${e?.message ?? e}`);
    }
  }

  async processAllFolders({
    dryRun = false,
    limit = null,
    outputContractsFile,
    outputNonContractsFile,
    _sampleWithContract = false,
    renameFolders = false,
    renameFiles = false,
    fileMode = 'signed', // signed | smart
    onlyNumericFolders = false,
    randomize = false,
    randomSeed = null,
    includeFolders = null
  }) {
    const allFolders = await this.listClientFolders();
    // Filtro: ignora pastas já renomeadas (padrão " - CPF") e, opcionalmente, mantém só pastas numéricas
    const folders = allFolders
      .filter((f) => !isRenamedFolder(f))
      .filter((f) => (onlyNumericFolders ? isNumericFolderName(f) : true));
    log(`Encontradas ${allFolders.length} pastas de clientes (total)`);
    log(`Processando pastas NÃO renomeadas (padrão ' - CPF'): ${folders.length}`);

    const includeSet =
      Array.isArray(includeFolders) && includeFolders.length
        ? new Set(includeFolders.map((v) => String(v)))
        : null;

    const seededRand = (() => {
      if (randomSeed == null) return null;
      // LCG simples (determinístico) só para shuffle reproduzível
      let state = Number(randomSeed) || 1;
      return () => {
        state = (state * 48271) % 0x7fffffff;
        return state / 0x7fffffff;
      };
    })();

    const shuffleInPlace = (arr) => {
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const r = seededRand ? seededRand() : Math.random();
        const j = Math.floor(r * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      return arr;
    };

    let list = folders;

    if (includeSet) {
      list = folders.filter((f) => includeSet.has(String(f)));
      log(`Filtro --folder/--folders habilitado: ${list.length} pasta(s) selecionada(s)`);
    }

    if (randomize) {
      list = shuffleInPlace([...folders]);
      log(`Modo randômico habilitado${randomSeed != null ? ` (seed=${randomSeed})` : ''}`);
    }

    if (limit) {
      list = list.slice(0, limit);
      log(`Limitando processamento a ${limit} pastas`);
    }

    // Carregar resultados existentes
    const resultsContracts = outputContractsFile
      ? await loadJsonArrayIfExists(outputContractsFile)
      : [];
    const resultsNonContracts = outputNonContractsFile
      ? await loadJsonArrayIfExists(outputNonContractsFile)
      : [];

    const processedFolderIds = new Set();
    // Nota: Como agora podemos ter múltiplos arquivos por pasta, a verificação de "pasta processada"
    // pode ser mais complexa se quisermos retomar.
    // simplificação: se a pasta já tem ALGUM registro no output, pulamos.
    // (O usuário pode limpar o json se quiser reprocessar)
    for (const r of resultsContracts) {
      if (r?.meta?.folder_id) processedFolderIds.add(String(r.meta.folder_id));
    }
    for (const r of resultsNonContracts) {
      if (r?.meta?.folder_id) processedFolderIds.add(String(r.meta.folder_id));
    }

    for (let idx = 0; idx < list.length; idx += 1) {
      const folderId = list[idx];
      if (processedFolderIds.has(String(folderId))) {
        continue;
      }
      log(`Processando pasta ${idx + 1}/${list.length}: ${folderId}`);

      try {
        const files = await this.getFilesInFolder(folderId);
        // Requisito: nunca processar nenhum arquivo com "TESTE" no nome.
        const pdfsAll = this.listPdfsRecursive(files).filter((f) => !filenameHasTeste(f));

        // Seleção do PDF principal:
        // - modo "signed": mantém comportamento anterior (somente *signed*.pdf)
        // - modo "smart": prioriza arquivo com "contrato" no nome; se não houver, pega o 1º pdf disponível
        const pdfs =
          fileMode === 'signed'
            ? pdfsAll.filter((f) => filenameHasSigned(f))
            : pdfsAll;

        if (pdfs.length === 0) {
          log(
            fileMode === 'signed'
              ? `Nenhum PDF "signed" encontrado em ${folderId}`
              : `Nenhum PDF elegível encontrado em ${folderId}`
          );
          continue;
        }

        let folderBestName = null;
        let folderBestCpf = null;
        let folderHasContractData = false;
        let foundContract = false;

        const pickPrimaryPdf = () => {
          const byScore = [...pdfs].sort((a, b) => {
            const sa =
              (filenameHasContrato(a) ? 100 : 0) +
              (filenameHasSigned(a) ? 10 : 0);
            const sb =
              (filenameHasContrato(b) ? 100 : 0) +
              (filenameHasSigned(b) ? 10 : 0);
            return sb - sa;
          });
          return byScore[0];
        };

        const primaryPdf = fileMode === 'smart' ? pickPrimaryPdf() : pdfs[0];
        const pdfsToProcess = [primaryPdf];

        // Processar apenas o PDF principal por pasta (reduz custo de IA e evita renomeações conflitantes)
        for (const documentFile of pdfsToProcess) {
          log(`  > Arquivo: ${documentFile}`);

          if (filenameHasTeste(documentFile)) {
            log(`    Ignorado (contém 'TESTE' no nome): ${documentFile}`);
            continue;
          }

          const pdfData = await this.downloadFile(documentFile);
          const pdfText = await this.extractTextFromPdf(pdfData);

          if (!pdfText || pdfText.trim().length < 50) {
            log(`    Texto vazio ou insuficiente.`);
            resultsNonContracts.push({
              meta: {
                folder_id: folderId,
                status: 'EMPTY_TEXT',
                document_file: documentFile,
                processed_at: nowIso(),
                error: 'Texto extraído muito curto'
              }
            });
            continue;
          }

          log(`    Enviando para IA...`);
          const extracted = await this.aiClient.extractContractData(pdfText);
          // Fail-safe: se a IA falhar, tentar inferir pelo nome do arquivo
          const inferredFromFilename = (() => {
            const lower = String(documentFile).toLowerCase();
            if (lower.includes('contrato')) return 'CONTRATO';
            if (lower.includes('procuracao') || lower.includes('procuração')) return 'PROCURACAO';
            if (lower.includes('declaracao') || lower.includes('declaração')) return 'DECLARACAO';
            return null;
          })();

          const docType = extracted?.tipo_documento ?? inferredFromFilename ?? 'OUTROS';
          const qualificacao = extracted?.qualificacao_contratante ?? {};
          
          const nome = qualificacao?.nome_completo;
          const cpf = normalizeCpf(qualificacao?.cpf);
          const hasData = Boolean(nome || cpf);

          log(`    Tipo identificado: ${docType}. Dados: ${hasData ? 'SIM' : 'NÃO'}`);

          // Preparar objeto de resultado
          const resultEntry = {
            ...extracted,
            qualificacao_contratante: {
              ...qualificacao,
              cpf: cpf // normalizado
            },
            meta: {
              folder_id: folderId,
              original_file: documentFile,
              final_file: documentFile, // pode mudar se houver renomeação de arquivo
              status: 'SUCCESS',
              processed_at: nowIso()
            }
          };

          // Requisito: NÃO renomear arquivos (o "signed" já está correto).
          // Novo modo: pode renomear arquivo também.

          // Lógica de armazenamento de resultados
          if (docType === 'CONTRATO') {
            foundContract = true;

            // INSERIR NO SUPABASE se habilitado
            if (!dryRun && this.supabase && nome && cpf) {
              try {
                log(`    Inserindo contrato no Supabase...`);

                // 1. Criar/buscar cliente
                const clienteId = await upsertCliente(this.supabase, qualificacao, resultEntry.meta);

                if (clienteId) {
                  log(`    Cliente: ${nome} (ID: ${clienteId})`);

                  // 2. Criar/buscar parte contrária
                  const parteContrariaId = await resolveParteContrariaId(
                    this.supabase,
                    extracted?.objeto_contrato?.nome
                  );

                  // 3. Inserir contrato
                  const contratoResult = await insertContrato(
                    this.supabase,
                    extracted,
                    resultEntry.meta,
                    { clienteId, parteContrariaId }
                  );

                  resultEntry.meta.supabase_inserted = contratoResult.inserted;
                  resultEntry.meta.supabase_reason = contratoResult.reason ?? null;
                  if (contratoResult.inserted) {
                    log(`    🎯 Contrato salvo no banco!`);
                  }
                } else {
                  log(`    ⚠️ Não foi possível criar/buscar cliente no Supabase`);
                  resultEntry.meta.supabase_inserted = false;
                }
              } catch (supabaseError) {
                log(`    Erro ao inserir no Supabase: ${supabaseError?.message ?? supabaseError}`);
                resultEntry.meta.supabase_error = supabaseError?.message ?? String(supabaseError);
                resultEntry.meta.supabase_inserted = false;
              }
            } else if (!dryRun && this.supabase && (!nome || !cpf)) {
              log(`    ⚠️ Contrato sem dados suficientes para inserir no Supabase (nome ou CPF ausente)`);
            }

            resultsContracts.push(resultEntry);

            // Salvar IMEDIATAMENTE após processar o arquivo (antes de renomear pasta)
            await this.saveResults(resultsContracts, outputContractsFile);
            await this.saveResults(resultsNonContracts, outputNonContractsFile);

            // Renomear ARQUIVO (após salvar JSON e persistir) - somente se houver nome+CPF
            if (renameFiles && nome && cpf && !dryRun) {
              const safeType = safeFilePart(docType);
              const safeName = safeFilePart(nome);
              const safeCpf = safeFilePart(cpf);
              const origBase = safeFilePart(path.basename(documentFile, '.pdf')).slice(0, 60);
              const relFolder = this.stripRootPrefix(documentFile).split('/').slice(0, -1).join('/');
              const desiredRel = `${relFolder}/${safeType} - ${safeName} - ${safeCpf} - ${origBase}.pdf`;
              const desiredKey = this.withRootPrefix(desiredRel);

              if (desiredKey !== documentFile) {
                log(`    Renomeando arquivo -> ${desiredKey}`);
                const renamed = await this.renameFile(documentFile, desiredKey);
                if (renamed) {
                  resultEntry.meta.final_file = desiredKey;
                  resultEntry.meta.file_renamed = true;
                }
              }
            }

            // Renomear a PASTA MÃE imediatamente (após extrair + salvar JSON + persistir)
            if (renameFolders && nome && cpf && !dryRun) {
              const supabaseOk = !this.supabase
                ? true
                : Boolean(
                    resultEntry.meta.supabase_inserted === true ||
                      resultEntry.meta.supabase_reason === 'already_exists'
                  );

              if (!supabaseOk) {
                log(`  ⚠️ Pasta NÃO renomeada: persistência no Supabase não confirmada.`);
                break;
              }

              folderBestName = nome;
              folderBestCpf = cpf;
              folderHasContractData = true;

              const newFolderName = `${folderBestName} - ${folderBestCpf}`;
              log(`  Renomeando pasta ${folderId} -> ${newFolderName}`);
              const folderRenamed = await this.renameFolder(folderId, newFolderName);
              if (folderRenamed) {
                resultEntry.meta.folder_renamed = true;
                resultEntry.meta.folder_new_name = newFolderName;

                // Como a pasta mudou, o caminho do arquivo também muda.
                // Não renomeamos o arquivo, apenas movemos junto com a pasta.
                try {
                  const oldRel = `${folderId}/`;
                  const newRel = `${newFolderName}/`;
                  resultEntry.meta.final_file = String(documentFile).replace(oldRel, newRel);
                } catch {
                  // best-effort
                }

                // Persistir a atualização do meta após renomear a pasta
                await this.saveResults(resultsContracts, outputContractsFile);
                await this.saveResults(resultsNonContracts, outputNonContractsFile);
              }
            }

            // Como estamos processando apenas *signed*.pdf, podemos encerrar a pasta aqui
            break;
          } else {
            resultsNonContracts.push(resultEntry);

            // Salvar IMEDIATAMENTE (antes de renomear)
            await this.saveResults(resultsContracts, outputContractsFile);
            await this.saveResults(resultsNonContracts, outputNonContractsFile);

            // Renomear ARQUIVO (não-contrato) - somente se houver nome+CPF
            if (renameFiles && nome && cpf && !dryRun && docType !== 'OUTROS') {
              const safeType = safeFilePart(docType);
              const safeName = safeFilePart(nome);
              const safeCpf = safeFilePart(cpf);
              const origBase = safeFilePart(path.basename(documentFile, '.pdf')).slice(0, 60);
              const relFolder = this.stripRootPrefix(documentFile).split('/').slice(0, -1).join('/');
              const desiredRel = `${relFolder}/${safeType} - ${safeName} - ${safeCpf} - ${origBase}.pdf`;
              const desiredKey = this.withRootPrefix(desiredRel);

              if (desiredKey !== documentFile) {
                log(`    Renomeando arquivo -> ${desiredKey}`);
                const renamed = await this.renameFile(documentFile, desiredKey);
                if (renamed) {
                  resultEntry.meta.final_file = desiredKey;
                  resultEntry.meta.file_renamed = true;
                }
              }
            }

            // Renomear PASTA (não-contrato): nome + cpf (sem persistência no Supabase)
            if (renameFolders && nome && cpf && !dryRun) {
              folderBestName = nome;
              folderBestCpf = cpf;
              folderHasContractData = true;

              const newFolderName = `${folderBestName} - ${folderBestCpf}`;
              log(`  Renomeando pasta ${folderId} -> ${newFolderName}`);
              const folderRenamed = await this.renameFolder(folderId, newFolderName);
              if (folderRenamed) {
                resultEntry.meta.folder_renamed = true;
                resultEntry.meta.folder_new_name = newFolderName;
                await this.saveResults(resultsContracts, outputContractsFile);
                await this.saveResults(resultsNonContracts, outputNonContractsFile);
              }
            }
          }

          // Salvar IMEDIATAMENTE após cada arquivo processado
          await this.saveResults(resultsContracts, outputContractsFile);
          await this.saveResults(resultsNonContracts, outputNonContractsFile);
        }

        // Fail-safe: se achou contrato, mas não achou nome/CPF para renomear pasta
        if (renameFolders && foundContract && !folderHasContractData) {
          log(`  Contrato encontrado mas sem dados suficientes para renomear pasta (nome/CPF ausente).`);
        }

        // Checkpoint salvar
        if ((idx + 1) % 5 === 0) {
          await this.saveResults(resultsContracts, outputContractsFile);
          await this.saveResults(resultsNonContracts, outputNonContractsFile);
        }

      } catch (e) {
        log(`Erro ao processar pasta ${folderId}: ${e?.message ?? e}`);
      }
    }

    await this.saveResults(resultsContracts, outputContractsFile);
    await this.saveResults(resultsNonContracts, outputNonContractsFile);
    return { contracts: resultsContracts, nonContracts: resultsNonContracts };
  }
}

async function main() {
  log('=== Processamento de Documentos com IA + Supabase ===');

  const rawBucketArg = getArgValue('--bucket') ?? process.env.MINIO_BUCKET_NAME ?? 'docs-12132024';
  const rawPrefixArg = getArgValue('--prefix') ?? process.env.MINIO_ROOT_PREFIX ?? '';

  // Se o usuário passar algo com espaços em --bucket, assumimos que isso é o "prefixo/pasta"
  // dentro do bucket padrão, pois buckets S3/MinIO normalmente não aceitam espaços.
  const bucketName = /\s/.test(String(rawBucketArg)) && !getArgValue('--prefix')
    ? (process.env.MINIO_BUCKET_NAME ?? 'docs-12132024')
    : rawBucketArg;

  const rootPrefix = /\s/.test(String(rawBucketArg)) && !getArgValue('--prefix')
    ? rawBucketArg
    : rawPrefixArg;

  log(`Bucket: ${bucketName}`);
  if (rootPrefix) log(`Prefix: ${rootPrefix}`);

  // Configurar Supabase (opcional)
  let supabase = null;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_OR_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

  const usingSecretKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY
  );

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    log(`Supabase habilitado: ${supabaseUrl}`);
    log(`Supabase key: ${usingSecretKey ? 'SECRET/SERVICE' : 'PUBLISHABLE/ANON'}`);
  } else {
    log(`Supabase NÃO configurado - apenas salvando em JSON`);
  }

  const processor = new MinIOProcessor(bucketName, supabase, rootPrefix);

  const dryRun = hasFlag('--dry-run');
  const limitRaw = getArgValue('--limit');
  const limit = limitRaw ? Number(limitRaw) : null;
  const renameFolders = hasFlag('--rename-folders');
  const renameFiles = hasFlag('--rename-files');
  const fileMode = getArgValue('--file-mode') ?? 'signed';
  const onlyNumericFolders = hasFlag('--only-numeric-folders');
  const randomize = hasFlag('--random');
  const seedRaw = getArgValue('--seed');
  const seed = seedRaw != null ? Number(seedRaw) : null;

  const runId = safeFilePart(getArgValue('--run-id') ?? '');
  const timestamp = safeFilePart(nowIso());
  const bucketFilePart = safeFilePart(bucketName);
  const prefixPart = safeFilePart(rootPrefix || 'root');
  const outDir =
    getArgValue('--outdir') ??
    path.join(
      'workflows-docs',
      'output',
      bucketFilePart,
      runId ? `run-${prefixPart}-${runId}` : `run-${prefixPart}-${timestamp}`
    );

  const contractsFile = path.join(outDir, 'contracts.json');
  const nonContractsFile = path.join(outDir, 'non_contracts.json');

  const finalRun = await processor.processAllFolders({
    dryRun,
    limit,
    sampleWithContract: false,
    renameFolders,
    renameFiles,
    fileMode,
    onlyNumericFolders,
    randomize,
    randomSeed: seed,
    includeFolders: (() => {
      const one = getArgValue('--folder');
      const many = getArgValue('--folders');
      if (one) return [String(one).trim()];
      if (many) {
        return String(many)
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);
      }
      return null;
    })(),
    outputContractsFile: contractsFile,
    outputNonContractsFile: nonContractsFile
  });

  const contracts = finalRun.contracts;
  const nonContracts = finalRun.nonContracts;

  log(`Resultados finais salvos.`);
  log(`Contratos: ${contracts.length}`);
  log(`Outros: ${nonContracts.length}`);

  // Estatísticas de inserção no Supabase
  if (supabase) {
    const insertedCount = contracts.filter((c) => c?.meta?.supabase_inserted === true).length;
    const failedCount = contracts.filter((c) => c?.meta?.supabase_inserted === false).length;
    log(`Supabase - Inseridos: ${insertedCount} | Falhas/Duplicados: ${failedCount}`);
  }
}

main().catch((e) => {
  log(`Fatal: ${e?.message ?? e}`);
  process.exitCode = 1;
});
