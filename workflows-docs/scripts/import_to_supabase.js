import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente (prioriza .env.local como no Next.js)
dotenv.config({ path: '.env.local' });
dotenv.config();

function getArgValue(flag) {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf(flag);
  if (idx >= 0 && argv[idx + 1]) return argv[idx + 1];
  return null;
}

function safeFilePart(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function log(msg) {
  console.log(`${new Date().toISOString()} - ${msg}`);
}

function normalizeCpf(value) {
  const raw = String(value ?? '');
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
  return new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0, 0)).toISOString();
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

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, { encoding: 'utf-8' });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Arquivo JSON precisa ser um array');
  return parsed;
}

async function upsertCliente(supabase, row) {
  const cpf = cpfDigits(row.cpf);
  const nome = String(row.nome_completo ?? '').trim();
  if (!cpf || !nome) return null;

  const genero = inferGeneroFromNome(nome);
  const estadoCivil = normalizeEstadoCivil(row.estado_civil);
  const phone = parseBrazilPhone(row.telefone);

  const payload = {
    tipo_pessoa: 'pf',
    nome,
    cpf,
    rg: row.rg ?? null,
    nacionalidade: row.nacionalidade ?? null,
    estado_civil: estadoCivil,
    genero,
    tipo_documento: 'CPF',
    emails: row.email ? [String(row.email).trim()] : null,
    ddd_celular: phone?.ddd ?? null,
    numero_celular: phone?.number ?? null,
    observacoes: row.endereco ? `endereco_extraido: ${row.endereco}` : null,
    dados_anteriores: {
      import: {
        source: 'workflow-docs',
        folder_id: row?.meta?.folder_id ?? null,
        document_file: row?.meta?.document_file ?? null,
        processed_at: row?.meta?.processed_at ?? null
      }
    }
  };

  const { data, error } = await supabase
    .from('clientes')
    .upsert(payload, { onConflict: 'cpf' })
    .select('id, cpf')
    .limit(1);

  if (error) throw error;
  const rec = Array.isArray(data) ? data[0] : data;
  return rec?.id ?? null;
}

async function resolveParteContrariaId(supabase, objetoNome) {
  const q = String(objetoNome ?? '').trim();
  if (!q) return null;

  const { data: found, error: findErr } = await supabase
    .from('partes_contrarias')
    .select('id, nome')
    .ilike('nome', `%${q}%`)
    .order('nome', { ascending: true })
    .limit(1);

  if (findErr) throw findErr;
  if (found?.length) return found[0].id;

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
  return created?.[0]?.id ?? null;
}

async function contratoExists(supabase, { clienteId, documentFile }) {
  let query = supabase.from('contratos').select('id').eq('cliente_id', clienteId).limit(1);

  // No schema atual, a parte contrária fica em contrato_partes (não em contratos).
  // Para evitar duplicidade, usamos um fingerprint simples por "documentFile" na observação.
  if (documentFile) {
    query = query.ilike('observacoes', `%${documentFile}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Boolean(data?.length);
}

async function insertContratoPartes(supabase, contratoId, parteContrariaId) {
  if (!contratoId || !parteContrariaId) return;
  const payload = {
    contrato_id: contratoId,
    tipo_entidade: 'parte_contraria',
    entidade_id: parteContrariaId,
    papel_contratual: 're',
    ordem: 1
  };
  const { error } = await supabase.from('contrato_partes').insert(payload);
  if (error) throw error;
}

async function insertContratoStatusHistorico(supabase, contratoId, toStatus, changedAtIso, metadata) {
  if (!contratoId || !toStatus) return;
  const payload = {
    contrato_id: contratoId,
    from_status: null,
    to_status: toStatus,
    ...(changedAtIso ? { changed_at: changedAtIso } : {}),
    reason: 'Contrato assinado importado via workflow-docs',
    metadata: metadata ?? { source: 'workflow-docs' }
  };
  const { error } = await supabase.from('contrato_status_historico').insert(payload);
  if (error) throw error;
}

async function insertContrato(supabase, row, { clienteId, parteContrariaId }) {
  const dataAssinaturaIso = parseDateBrToTimestamptz(row.data_assinatura);
  const documentFile = row?.meta?.document_file ?? row?.meta?.original_file ?? null;

  const exists = await contratoExists(supabase, {
    clienteId,
    documentFile
  });

  if (exists) return { inserted: false };

  const payload = {
    tipo_contrato: 'ajuizamento',
    tipo_cobranca: 'pro_exito',
    cliente_id: clienteId,
    papel_cliente_no_contrato: 'autora',
    status: 'contratado',
    segmento_id: 1,
    ...(dataAssinaturaIso ? { cadastrado_em: dataAssinaturaIso } : {}),
    observacoes: `import: folder_id=${row?.meta?.folder_id ?? ''}; document_file=${documentFile ?? ''}; data_assinatura_extraida=${row?.data_assinatura ?? 'N/A'}`,
    dados_anteriores: {
      import: {
        source: 'workflow-docs',
        folder_id: row?.meta?.folder_id ?? null,
        document_file: documentFile,
        processed_at: row?.meta?.processed_at ?? null,
        extracted_data: row
      }
    }
  };

  const { data, error } = await supabase.from('contratos').insert(payload).select('id').limit(1);
  if (error) throw error;

  const contratoId = data?.[0]?.id;
  if (contratoId && parteContrariaId) {
    await insertContratoPartes(supabase, contratoId, parteContrariaId);
  }

  if (contratoId) {
    await insertContratoStatusHistorico(supabase, contratoId, 'contratado', dataAssinaturaIso, {
      source: 'workflow-docs',
      folder_id: row?.meta?.folder_id ?? null,
      document_file: documentFile,
      data_assinatura_extraida: row?.data_assinatura ?? null,
      cadastrado_em: dataAssinaturaIso
    });
  }

  return { inserted: true };
}

async function main() {
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

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY) no .env'
    );
  }

  if (!usingSecretKey) {
    throw new Error('Para importar, use uma key SECRET/SERVICE (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY).');
  }

  const bucketName = getArgValue('--bucket') ?? process.env.MINIO_BUCKET_NAME ?? 'zapsign';
  const bucketFilePart = safeFilePart(bucketName);

  const input =
    getArgValue('--input') ??
    `final_results_${bucketFilePart}.json`;

  log(`Supabase URL: ${supabaseUrl}`);
  log(`Supabase key: ${usingSecretKey ? 'SECRET/SERVICE' : 'PUBLISHABLE/ANON'}`);
  log(`Input JSON: ${input}`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const rows = await readJsonArray(input);
  log(`Registros no JSON: ${rows.length}`);

  let okClientes = 0;
  let okContratos = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const status = row?.meta?.status;
    if (status !== 'SUCCESS') {
      skipped += 1;
      continue;
    }

    try {
      // Output do process_with_ai.js: row.qualificacao_contratante + row.objeto_contrato + row.data_assinatura
      const clienteId = await upsertCliente(supabase, row?.qualificacao_contratante ? { ...row, ...row.qualificacao_contratante } : row);
      if (!clienteId) {
        skipped += 1;
        continue;
      }
      okClientes += 1;

      const parteContrariaId = await resolveParteContrariaId(supabase, row?.objeto_contrato?.nome ?? row?.objeto_contrato_nome);
      const { inserted } = await insertContrato(supabase, row, { clienteId, parteContrariaId });
      if (inserted) okContratos += 1;

      if ((i + 1) % 50 === 0) {
        log(`Progresso ${i + 1}/${rows.length} | clientes upsert: ${okClientes} | contratos inseridos: ${okContratos} | skipped: ${skipped} | errors: ${errors}`);
      }
    } catch (e) {
      errors += 1;
      log(`Erro no registro ${i + 1}/${rows.length} (folder_id=${row?.meta?.folder_id ?? ''}): ${e?.message ?? e}`);
    }
  }

  log(`Finalizado | clientes upsert: ${okClientes} | contratos inseridos: ${okContratos} | skipped: ${skipped} | errors: ${errors}`);
}

main().catch((e) => {
  log(`Fatal: ${e?.message ?? e}`);
  process.exitCode = 1;
});
