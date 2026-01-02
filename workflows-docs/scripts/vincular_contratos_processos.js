/**
 * Vincular contratos -> processos (acervo) por cliente + parte contrária
 *
 * Estrutura (Supabase):
 * - public.contratos (cliente_id)
 * - public.contrato_partes (contrato_id, tipo_entidade, entidade_id)
 * - public.processo_partes (processo_id, tipo_entidade, entidade_id)
 * - public.acervo (processo)
 * - public.contrato_processos (contrato_id, processo_id)
 *
 * Regras:
 * - Idempotente (não duplica vínculos já existentes)
 * - Pode rodar em modo dry-run
 * - Não altera status de contrato/processo (apenas cria vínculo)
 *
 * Uso:
 * - Dry-run (recomendado):
 *   node workflows-docs/scripts/vincular_contratos_processos.js --dry-run --limit 50
 *
 * - Rodar de verdade:
 *   node workflows-docs/scripts/vincular_contratos_processos.js --limit 500
 *
 * Filtros opcionais:
 * - --contrato-ids 123,124,125
 * - --status contratado
 * - --include-linked (inclui contratos já vinculados; default: só sem vínculo)
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const nowIso = () => new Date().toISOString();

function log(...args) {
  // eslint-disable-next-line no-console
  console.log(`${nowIso()} -`, ...args);
}

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return null;
  return next;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseCsvNumbers(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)');

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchContratos(supabase, { limit, onlyUnlinked, statusFilter, onlyContratoIds }) {
  let query = supabase
    .from('contratos')
    .select('id, cliente_id, status, cadastrado_em')
    .order('id', { ascending: true });

  if (statusFilter) query = query.eq('status', statusFilter);
  if (Array.isArray(onlyContratoIds) && onlyContratoIds.length) query = query.in('id', onlyContratoIds);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  const contratos = data ?? [];

  if (!onlyUnlinked) return contratos;

  const contratoIds = contratos.map((c) => Number(c.id));
  if (contratoIds.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from('contrato_processos')
    .select('contrato_id')
    .in('contrato_id', contratoIds);
  if (linksError) throw linksError;

  const linkedSet = new Set((links ?? []).map((r) => Number(r.contrato_id)));
  return contratos.filter((c) => !linkedSet.has(Number(c.id)));
}

async function fetchParteContrariaByContratoId(supabase, contratoIds) {
  if (!contratoIds.length) return new Map();

  const { data, error } = await supabase
    .from('contrato_partes')
    .select('contrato_id, entidade_id, ordem')
    .in('contrato_id', contratoIds)
    .eq('tipo_entidade', 'parte_contraria')
    .order('ordem', { ascending: true });
  if (error) throw error;

  const map = new Map(); // contrato_id -> parte_contraria_id
  for (const row of data ?? []) {
    const contratoId = Number(row.contrato_id);
    if (map.has(contratoId)) continue;
    map.set(contratoId, Number(row.entidade_id));
  }
  return map;
}

function buildSearchTerms(nome) {
  const raw = String(nome ?? '').trim();
  if (!raw) return [];
  const upper = raw.toUpperCase();
  const stop = new Set([
    'LTDA',
    'Ltda',
    'ME',
    'EPP',
    'S/A',
    'SA',
    'S A',
    'DO',
    'DA',
    'DE',
    'DOS',
    'DAS',
    'E',
    'EM',
    'COM',
    'SERVICOS',
    'SERVIÇOS',
    'INTERMEDIACAO',
    'INTERMEDIAÇÃO',
    'NEGOCIOS',
    'NEGÓCIOS',
    'BRASIL',
    'ONLINE',
  ]);

  const tokens = upper
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stop.has(t));

  // Prioriza tokens mais “distintivos”
  const uniq = Array.from(new Set(tokens));
  uniq.sort((a, b) => b.length - a.length);
  return uniq.slice(0, 3);
}

async function fetchPartesContrariasNomesByIds(supabase, ids) {
  const uniqIds = Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0)));
  if (!uniqIds.length) return new Map();

  const { data, error } = await supabase
    .from('partes_contrarias')
    .select('id, nome, nome_social_fantasia')
    .in('id', uniqIds);
  if (error) throw error;

  const map = new Map();
  for (const row of data ?? []) {
    map.set(Number(row.id), {
      nome: row.nome ?? null,
      nome_social_fantasia: row.nome_social_fantasia ?? null,
    });
  }
  return map;
}

async function relationExists(supabase, contratoId, processoId) {
  const { data, error } = await supabase
    .from('contrato_processos')
    .select('id')
    .eq('contrato_id', contratoId)
    .eq('processo_id', processoId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function hasDistribuidoHistorico(supabase, contratoId) {
  const { data, error } = await supabase
    .from('contrato_status_historico')
    .select('id')
    .eq('contrato_id', contratoId)
    .eq('to_status', 'distribuido')
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function markContratoDistribuido(supabase, { contratoId, fromStatus, changedAtIso, processo }) {
  // 1) Atualiza status no contrato
  const { error: upErr } = await supabase
    .from('contratos')
    .update({ status: 'distribuido' })
    .eq('id', contratoId);
  if (upErr) throw upErr;

  // 2) Insere histórico (idempotente por checagem prévia)
  const { error: histErr } = await supabase.from('contrato_status_historico').insert({
    contrato_id: contratoId,
    from_status: fromStatus ?? null,
    to_status: 'distribuido',
    changed_at: changedAtIso,
    reason: 'Distribuído via vínculo automático com processo do acervo (1º grau)',
    metadata: {
      source: 'workflow-contrato-processos',
      processo_id: processo?.id ?? null,
      numero_processo: processo?.numero_processo ?? null,
      data_autuacao: changedAtIso,
    },
  });
  if (histErr) throw histErr;
}

async function findBestProcessForPair(supabase, { clienteId, parteContrariaId, parteContrariaNome }) {
  // 1) processos onde o cliente participa
  const { data: clientePartes, error: e1 } = await supabase
    .from('processo_partes')
    .select('processo_id')
    .eq('tipo_entidade', 'cliente')
    .eq('entidade_id', clienteId)
    .limit(5000);
  if (e1) throw e1;

  const candidateProcessIds = Array.from(
    new Set((clientePartes ?? []).map((r) => Number(r.processo_id)).filter(Boolean))
  );
  if (candidateProcessIds.length === 0) return null;

  // 2) interseção com processos onde a parte contrária participa
  const matching = new Set();
  for (const idsChunk of chunk(candidateProcessIds, 400)) {
    const { data: pcRows, error: e2 } = await supabase
      .from('processo_partes')
      .select('processo_id')
      .eq('tipo_entidade', 'parte_contraria')
      .eq('entidade_id', parteContrariaId)
      .in('processo_id', idsChunk)
      .limit(5000);
    if (e2) throw e2;
    for (const r of pcRows ?? []) matching.add(Number(r.processo_id));
  }

  let matchedIds = Array.from(matching).filter(Boolean);

  // Fallback: se não houver match via processo_partes, buscar pelo texto do réu/autora na tabela acervo
  // (alguns processos podem ter sido capturados no acervo sem vincular corretamente a parte_contraria em processo_partes)
  if (matchedIds.length === 0 && parteContrariaNome) {
    const terms = buildSearchTerms(parteContrariaNome);
    if (terms.length) {
      const found = new Set();
      for (const idsChunk of chunk(candidateProcessIds, 200)) {
        // Monta OR: nome_parte_re ilike %TERM% OR nome_parte_autora ilike %TERM%
        // PostgREST: .or("col.ilike.%X%,othercol.ilike.%X%")
        const orParts = [];
        for (const t of terms) {
          const term = encodeURIComponent(t).replace(/%/g, '');
          // Nota: o SDK do Supabase não exige encode manual, mas removemos '%' para evitar coringas inesperados
          orParts.push(`nome_parte_re.ilike.%${term}%`);
          orParts.push(`nome_parte_autora.ilike.%${term}%`);
        }
        const orExpr = orParts.join(',');

        const { data: acRows, error: eFallback } = await supabase
          .from('acervo')
          .select('id')
          .in('id', idsChunk)
          .or(orExpr)
          .limit(5000);
        if (eFallback) throw eFallback;
        for (const r of acRows ?? []) found.add(Number(r.id));
      }
      matchedIds = Array.from(found).filter(Boolean);
    }
  }

  if (matchedIds.length === 0) return null;

  // 3) escolhe o processo mais “recente”
  const { data: best, error: e3 } = await supabase
    .from('acervo')
    .select('id, numero_processo, data_autuacao, updated_at, created_at, codigo_status_processo')
    .in('id', matchedIds)
    .eq('grau', 'primeiro_grau')
    .order('data_autuacao', { ascending: false })
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);
  if (e3) throw e3;
  return (best ?? [])[0] ?? null;
}

async function main() {
  const dryRun = hasFlag('--dry-run');
  const limitRaw = getArgValue('--limit');
  const limit = limitRaw ? Number(limitRaw) : null;
  const onlyUnlinked = !hasFlag('--include-linked');
  const updateStatusDistribuido = !hasFlag('--no-update-status');
  const statusFilter = getArgValue('--status') ?? null;
  const onlyContratoIds = parseCsvNumbers(getArgValue('--contrato-ids'));

  const runId = getArgValue('--run-id') ?? `run-${Date.now()}`;
  const outDir = path.join('workflows-docs', 'output', 'contrato-processos', runId);
  const outFile = path.join(outDir, 'resultado.json');

  log('=== Vincular Contratos -> Processos (Acervo) ===');
  log(`dry-run: ${dryRun ? 'SIM' : 'NÃO'}`);
  log(`only-unlinked: ${onlyUnlinked ? 'SIM' : 'NÃO'}`);
  log(`update-status-distribuido: ${updateStatusDistribuido ? 'SIM' : 'NÃO'}`);
  log(`limit: ${limit ?? 'N/A'}`);
  if (statusFilter) log(`status filter: ${statusFilter}`);
  if (onlyContratoIds.length) log(`contrato-ids: ${onlyContratoIds.join(',')}`);

  const supabase = createSupabaseClient();

  const contratos = await fetchContratos(supabase, { limit, onlyUnlinked, statusFilter, onlyContratoIds });
  log(`Contratos alvo: ${contratos.length}`);

  const contratoIds = contratos.map((c) => Number(c.id));
  const parteContrariaMap = await fetchParteContrariaByContratoId(supabase, contratoIds);
  const parteContrariaIds = Array.from(new Set(Array.from(parteContrariaMap.values())));
  const partesContrariasNomesMap = await fetchPartesContrariasNomesByIds(supabase, parteContrariaIds);

  const stats = {
    total: contratos.length,
    linked: 0,
    already_linked: 0,
    status_updated: 0,
    status_skipped_already_distribuido: 0,
    status_skipped_no_data_autuacao: 0,
    no_parte_contraria: 0,
    no_match: 0,
    errors: 0,
  };

  const results = [];

  for (let i = 0; i < contratos.length; i += 1) {
    const c = contratos[i];
    const contratoId = Number(c.id);
    const clienteId = Number(c.cliente_id);
    const parteContrariaId = parteContrariaMap.get(contratoId) ?? null;
    const parteNome =
      parteContrariaId != null
        ? (partesContrariasNomesMap.get(parteContrariaId)?.nome ??
          partesContrariasNomesMap.get(parteContrariaId)?.nome_social_fantasia ??
          null)
        : null;

    if (!parteContrariaId) {
      stats.no_parte_contraria += 1;
      results.push({
        contrato_id: contratoId,
        cliente_id: clienteId,
        status: 'SKIP_NO_PARTE_CONTRARIA',
      });
      continue;
    }

    try {
      log(`(${i + 1}/${contratos.length}) contrato #${contratoId} -> cliente ${clienteId}, parte_contraria ${parteContrariaId}`);

      const bestProcess = await findBestProcessForPair(supabase, {
        clienteId,
        parteContrariaId,
        parteContrariaNome: parteNome,
      });

      if (!bestProcess?.id) {
        stats.no_match += 1;
        results.push({
          contrato_id: contratoId,
          cliente_id: clienteId,
          parte_contraria_id: parteContrariaId,
          status: 'NO_MATCH',
        });
        continue;
      }

      const processoId = Number(bestProcess.id);

      const exists = await relationExists(supabase, contratoId, processoId);
      if (exists) {
        stats.already_linked += 1;
        results.push({
          contrato_id: contratoId,
          cliente_id: clienteId,
          parte_contraria_id: parteContrariaId,
          processo_id: processoId,
          numero_processo: bestProcess.numero_processo ?? null,
          status: 'ALREADY_LINKED',
        });
        continue;
      }

      if (!dryRun) {
        const { error: insErr } = await supabase.from('contrato_processos').insert({
          contrato_id: contratoId,
          processo_id: processoId,
        });
        if (insErr) throw insErr;
      }

      stats.linked += 1;

      // Atualizar status do contrato para "distribuido" com changed_at = data_autuacao (1º grau)
      if (updateStatusDistribuido) {
        const dataAutuacao = bestProcess.data_autuacao ?? null;
        if (!dataAutuacao) {
          stats.status_skipped_no_data_autuacao += 1;
        } else if (String(c.status) === 'distribuido') {
          stats.status_skipped_already_distribuido += 1;
        } else {
          const alreadyHist = await hasDistribuidoHistorico(supabase, contratoId);
          if (!alreadyHist) {
            if (!dryRun) {
              await markContratoDistribuido(supabase, {
                contratoId,
                fromStatus: c.status ?? null,
                changedAtIso: dataAutuacao,
                processo: bestProcess,
              });
            }
            stats.status_updated += 1;
          } else {
            stats.status_skipped_already_distribuido += 1;
          }
        }
      }

      results.push({
        contrato_id: contratoId,
        cliente_id: clienteId,
        parte_contraria_id: parteContrariaId,
        processo_id: processoId,
        numero_processo: bestProcess.numero_processo ?? null,
        codigo_status_processo: bestProcess.codigo_status_processo ?? null,
        data_autuacao: bestProcess.data_autuacao ?? null,
        status: dryRun ? 'WOULD_LINK' : 'LINKED',
      });
    } catch (e) {
      stats.errors += 1;
      results.push({
        contrato_id: contratoId,
        cliente_id: clienteId,
        parte_contraria_id: parteContrariaId,
        status: 'ERROR',
        error: e?.message ?? String(e),
      });
    }

    if ((i + 1) % 25 === 0) {
      await writeJson(outFile, { stats, results });
      log(`Checkpoint salvo em ${outFile}`);
    }
  }

  await writeJson(outFile, { stats, results });
  log(`Finalizado. Resultado: ${outFile}`);
  log(`Stats: ${JSON.stringify(stats)}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


