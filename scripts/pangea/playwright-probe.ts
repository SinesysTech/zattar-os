import { request } from '@playwright/test';

/**
 * Script de diagnóstico para comparar payloads aceitos pelo Pangea
 * e validar combinações de filtros sem depender do frontend.
 *
 * Uso:
 *   npx tsx scripts/pangea/playwright-probe.ts
 */

const PANGEA_URL = 'https://pangeabnp.pdpj.jus.br/api/v1/precedentes';

const TIPOS = ['SUM','SV','RG','IAC','SIRDR','RR','CT','IRDR','IRR','PUIL','NT','OJ'] as const;

const ORGAOS = [
  'STF','STJ','TST','STM','TNU','TRF01','TRF02','TRF03','TRF04','TRF05','TRF06',
  'TJAC','TJAL','TJAP','TJAM','TJBA','TJCE','TJDF','TJES','TJGO','TJMA','TJMT','TJMG','TJPA','TJPB','TJPR','TJPE','TJPI','TJRJ','TJRN','TJRS','TJRO','TJRR','TJSC','TJSP','TJSE','TJTO',
  'TRT01','TRT02','TRT03','TRT04','TRT05','TRT06','TRT07','TRT08','TRT09','TRT10','TRT11','TRT12','TRT13','TRT14','TRT15','TRT16','TRT17','TRT18','TRT19','TRT20','TRT21','TRT22','TRT23','TRT24'
] as const;

type Filtro = Record<string, unknown>;

async function probe(name: string, filtro: Filtro) {
  const ctx = await request.newContext({
    extraHTTPHeaders: { accept: 'application/json' },
  });

  const body = { filtro };
  const res = await ctx.post(PANGEA_URL, { data: body });
  const status = res.status();
  const text = await res.text();

  let json: any = null;
  try { json = JSON.parse(text); } catch {}

  console.log(`\n--- ${name} ---`);
  console.log('status:', status);
  console.log('payload:', JSON.stringify(body).slice(0, 400) + (JSON.stringify(body).length > 400 ? '…' : ''));

  if (status >= 400) {
    console.log('erro:', text.slice(0, 500));
  } else {
    console.log('total:', json?.total, 'len:', Array.isArray(json?.resultados) ? json.resultados.length : null);
  }

  await ctx.dispose();
}

async function main() {
  await probe('busca_geral_completo', {
    buscaGeral: 'vínculo de emprego',
    todasPalavras: '',
    quaisquerPalavras: '',
    semPalavras: '',
    trechoExato: '',
    atualizacaoDesde: '',
    atualizacaoAte: '',
    cancelados: false,
    ordenacao: 'Text',
    nr: '',
    pagina: 1,
    tamanhoPagina: 10000,
    orgaos: ORGAOS,
    tipos: TIPOS,
  });

  await probe('trecho_exato', {
    buscaGeral: '',
    todasPalavras: '',
    quaisquerPalavras: '',
    semPalavras: '',
    trechoExato: 'multa do art. 477',
    atualizacaoDesde: '',
    atualizacaoAte: '',
    cancelados: false,
    ordenacao: 'Text',
    nr: '',
    pagina: 1,
    tamanhoPagina: 10000,
    orgaos: ORGAOS,
    tipos: TIPOS,
  });

  await probe('filtro_data_atualizacao', {
    buscaGeral: 'vínculo de emprego',
    todasPalavras: '',
    quaisquerPalavras: '',
    semPalavras: '',
    trechoExato: '',
    atualizacaoDesde: '01/01/2024',
    atualizacaoAte: '31/12/2024',
    cancelados: false,
    ordenacao: 'ChronologicalDesc',
    nr: '',
    pagina: 1,
    tamanhoPagina: 10000,
    orgaos: ORGAOS,
    tipos: TIPOS,
  });

  await probe('apenas_stf', {
    buscaGeral: 'vínculo de emprego',
    todasPalavras: '',
    quaisquerPalavras: '',
    semPalavras: '',
    trechoExato: '',
    atualizacaoDesde: '',
    atualizacaoAte: '',
    cancelados: false,
    ordenacao: 'Text',
    nr: '',
    pagina: 1,
    tamanhoPagina: 10000,
    orgaos: ['STF'],
    tipos: TIPOS,
  });
}

main().catch((e) => {
  console.error('Falha no probe:', e);
  process.exit(1);
});


