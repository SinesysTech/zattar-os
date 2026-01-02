import fs from 'node:fs/promises';

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

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function getClientName(row) {
  return (
    row?.nome_completo ??
    row?.client_name ??
    row?.nome ??
    row?.meta?.client_name ??
    row?.meta?.nome_completo ??
    null
  );
}

function containsWordTeste(name) {
  const text = normalizeText(name);
  if (!text) return false;
  return /(^|[^a-z0-9])teste([^a-z0-9]|$)/i.test(text);
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, { encoding: 'utf-8' });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Arquivo JSON precisa ser um array');
  return parsed;
}

async function writeJsonArrayAtomic(filePath, arr) {
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

async function main() {
  const input = getArgValue('--input') ?? 'final_results.json';
  const apply = hasFlag('--apply');

  log(`Input: ${input}`);
  log(`Modo: ${apply ? 'APPLY (sobrescreve arquivo)' : 'DRY-RUN (não altera arquivo)'}`);

  const rows = await readJsonArray(input);
  let removed = 0;

  const removedPreview = [];
  const kept = [];

  for (const row of rows) {
    const name = getClientName(row);
    if (containsWordTeste(name)) {
      removed += 1;
      if (removedPreview.length < 30) {
        removedPreview.push({
          folder_id: row?.meta?.folder_id ?? row?.folder_id ?? null,
          nome: name ?? null
        });
      }
      continue;
    }

    kept.push(row);
  }

  log(`Total: ${rows.length}`);
  log(`Removidos (nome contém 'teste'): ${removed}`);
  log(`Mantidos: ${kept.length}`);

  if (removedPreview.length) {
    log('Prévia removidos (até 30):');
    for (const r of removedPreview) {
      log(`- folder_id=${r.folder_id ?? ''} | nome=${r.nome ?? ''}`);
    }
  }

  if (!apply) return;

  await writeJsonArrayAtomic(input, kept);
  log('Arquivo atualizado com sucesso (backup em .bak, tmp removido por rename).');
}

main().catch((e) => {
  log(`Fatal: ${e?.message ?? e}`);
  process.exitCode = 1;
});
