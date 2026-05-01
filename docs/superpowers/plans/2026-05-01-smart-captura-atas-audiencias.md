# Smart Captura de Atas de Audiências — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a captura horária cega de audiências realizadas por um sistema inteligente que consulta o banco primeiro e só abre o PJe quando há audiências sem ata agendadas antes do horário atual, respeitando uma janela de execução comercial (09h–18h Brasília).

**Architecture:** Um novo `tipo_captura: 'audiencias_ata'` com pré-verificação no banco local antes de qualquer login no PJe. O conceito de `janela_execucao` (início/fim em HH:mm Brasília) é adicionado ao `parametros_extras` dos agendamentos e respeitado pelo cálculo de `proxima_execucao` — após as 18h, o next hop vai direto às 09h do dia seguinte. A extração de ata já implementada em `audiencias.service.ts` é transformada em helper reutilizável.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + JS client), Playwright (PJe scraping), Backblaze B2 (storage PDF), TypeScript estrito.

---

## Mapa de Arquivos

| Ação | Arquivo |
|------|---------|
| Modify | `src/app/(authenticated)/captura/domain.ts:159-172` |
| Modify | `src/app/(authenticated)/captura/types/agendamentos-types.ts` |
| Modify | `src/app/(authenticated)/captura/services/agendamentos/calcular-proxima-execucao.service.ts` |
| Modify | `src/app/(authenticated)/captura/services/scheduler/executar-agendamento.service.ts` |
| Modify | `src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts` |
| Modify | `src/app/(authenticated)/captura/services/trt/audiencias.service.ts` (extração do helper) |
| Create | `src/app/(authenticated)/captura/services/trt/capturar-ata-audiencia.service.ts` |
| Create | `src/app/(authenticated)/captura/services/trt/buscar-audiencias-sem-ata.service.ts` |
| Create | `src/app/(authenticated)/captura/services/trt/capturar-atas-audiencias.service.ts` |
| DB Migration | `add_audiencias_ata_tipo_captura` |

---

## Task 1: Migration — Adicionar `audiencias_ata` ao enum do banco

**Files:**
- DB migration via Supabase MCP

- [ ] **Step 1: Aplicar migration**

```sql
ALTER TYPE tipo_captura ADD VALUE IF NOT EXISTS 'audiencias_ata';
```

Via Supabase MCP com `name: "add_audiencias_ata_tipo_captura"`.

- [ ] **Step 2: Verificar**

```sql
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'tipo_captura'
ORDER BY enumsortorder;
```

Deve incluir `audiencias_ata` na lista.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add audiencias_ata to tipo_captura enum"
```

---

## Task 2: TypeScript — Adicionar `audiencias_ata` ao `TipoCaptura`

**Files:**
- Modify: `src/app/(authenticated)/captura/domain.ts:159-172`

- [ ] **Step 1: Atualizar o union type**

Em `domain.ts`, localizar a definição:

```typescript
export type TipoCaptura =
  | "acervo_geral"
  | "arquivados"
  | "audiencias"
  | "pendentes"
  | "partes"
  | "combinada"
  | "audiencias_designadas"
  | "audiencias_realizadas"
  | "audiencias_canceladas"
  | "expedientes_no_prazo"
  | "expedientes_sem_prazo"
  | "pericias"
  | "timeline";
```

Adicionar `"audiencias_ata"` após `"audiencias_canceladas"`:

```typescript
export type TipoCaptura =
  | "acervo_geral"
  | "arquivados"
  | "audiencias"
  | "pendentes"
  | "partes"
  | "combinada"
  | "audiencias_designadas"
  | "audiencias_realizadas"
  | "audiencias_canceladas"
  | "audiencias_ata"       // captura inteligente: só processa audiências sem ata no banco local
  | "expedientes_no_prazo"
  | "expedientes_sem_prazo"
  | "pericias"
  | "timeline";
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "domain.ts"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/domain.ts
git commit -m "feat: add audiencias_ata to TipoCaptura"
```

---

## Task 3: Types — `janela_execucao` e `audiencias_ata` em agendamentos-types.ts

**Files:**
- Modify: `src/app/(authenticated)/captura/types/agendamentos-types.ts`

O campo `janela_execucao` define o intervalo de horário comercial para agendamentos horários. Fora da janela, `proxima_execucao` pula para o início da janela no próximo dia.

- [ ] **Step 1: Adicionar `janela_execucao` ao `parametros_extras` nas três interfaces**

Em `Agendamento.parametros_extras`:

```typescript
  parametros_extras: {
    // Audiências: período fixo (YYYY-MM-DD) ou relativo ao dia de execução
    dataInicio?: string;
    dataFim?: string;
    dataRelativa?: 'hoje';
    codigoSituacao?: 'M' | 'C' | 'F';
    // Pendentes
    filtroPrazo?: 'no_prazo' | 'sem_prazo';
    filtrosPrazo?: Array<'no_prazo' | 'sem_prazo'>;
    // Janela de execução para periodicidade horária (HH:mm Brasília)
    // Fora dessa janela, proxima_execucao pula para inicio do dia seguinte
    janela_execucao?: {
      inicio: string; // ex: '09:00'
      fim: string;    // ex: '18:00'
    };
  } | null;
```

Aplicar o mesmo bloco `janela_execucao` em `CriarAgendamentoParams.parametros_extras` e `AtualizarAgendamentoParams.parametros_extras`.

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "agendamentos-types"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/types/agendamentos-types.ts
git commit -m "feat: add janela_execucao to parametros_extras type"
```

---

## Task 4: Windowed Scheduling — `calcular-proxima-execucao.service.ts`

**Files:**
- Modify: `src/app/(authenticated)/captura/services/agendamentos/calcular-proxima-execucao.service.ts`

A função `calcularProximaExecucao` recebe um `janela?` opcional. Para `a_cada_N_horas`:
- Se `now + N hours` cair dentro da janela → retorna normalmente
- Se cair **depois do fim** → avança para o `inicio` do dia seguinte (em Brasília)
- Se cair **antes do inicio** → avança para o `inicio` do mesmo dia (caso edge de criação manual)

- [ ] **Step 1: Adicionar helper de parsing de janela e função principal**

Substituir o conteúdo do arquivo pelo seguinte (mantendo `emFusoBrasilia` e `comHorarioBrasilia` existentes):

```typescript
// Serviço para calcular próxima execução de agendamentos
// Horários são interpretados como America/Sao_Paulo (UTC-3, sem horário de verão desde 2019)

import type { Periodicidade } from '../../types/agendamentos-types';

const BRASILIA_OFFSET_HOURS = 3;

function emFusoBrasilia(data: Date): Date {
  return new Date(data.getTime() - BRASILIA_OFFSET_HOURS * 60 * 60 * 1000);
}

function comHorarioBrasilia(base: Date, horas: number, minutos: number): Date {
  const result = new Date(base);
  result.setUTCHours(horas + BRASILIA_OFFSET_HOURS, minutos, 0, 0);
  return result;
}

/**
 * Converte "HH:mm" para { horas, minutos }. Lança se formato inválido.
 */
function parseHorario(horario: string): { horas: number; minutos: number } {
  const m = horario.match(/^(\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Formato de horário inválido: ${horario}. Use HH:mm`);
  const horas = parseInt(m[1], 10);
  const minutos = parseInt(m[2], 10);
  if (horas > 23 || minutos > 59) throw new Error(`Horário inválido: ${horario}`);
  return { horas, minutos };
}

/**
 * Calcula a próxima execução baseado em periodicidade, dias_intervalo e horário.
 *
 * @param janela - Janela de execução para a_cada_N_horas ({ inicio: 'HH:mm', fim: 'HH:mm' }, Brasília)
 */
export function calcularProximaExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string,
  referencia: Date = new Date(),
  janela?: { inicio: string; fim: string }
): string {
  if (periodicidade === 'a_cada_N_horas') {
    const horas = dias_intervalo && dias_intervalo > 0 ? dias_intervalo : 1;
    const candidata = new Date(referencia.getTime() + horas * 60 * 60 * 1000);
    candidata.setSeconds(0, 0);

    if (!janela) return candidata.toISOString();

    // Verificar se candidata está dentro da janela (em Brasília)
    const candidataBrasilia = emFusoBrasilia(candidata);
    const { horas: hInicio, minutos: mInicio } = parseHorario(janela.inicio);
    const { horas: hFim, minutos: mFim } = parseHorario(janela.fim);

    const minutosCandidata =
      candidataBrasilia.getUTCHours() * 60 + candidataBrasilia.getUTCMinutes();
    const minutosFim = hFim * 60 + mFim;
    const minutosInicio = hInicio * 60 + mInicio;

    if (minutosCandidata <= minutosFim) {
      // Dentro da janela ou antes do fim: usa candidata
      return candidata.toISOString();
    }

    // Após o fim da janela: pula para inicio do dia seguinte (em Brasília)
    const diaSegBrasilia = new Date(candidataBrasilia);
    diaSegBrasilia.setUTCDate(diaSegBrasilia.getUTCDate() + 1);
    return comHorarioBrasilia(diaSegBrasilia, hInicio, mInicio).toISOString();
  }

  const { horas, minutos } = parseHorario(horario);
  const refBrasilia = emFusoBrasilia(referencia);

  if (periodicidade === 'diario') {
    const proxima = new Date(refBrasilia);
    proxima.setUTCDate(proxima.getUTCDate() + 1);
    return comHorarioBrasilia(proxima, horas, minutos).toISOString();
  }

  if (periodicidade === 'a_cada_N_dias') {
    if (!dias_intervalo || dias_intervalo <= 0) {
      throw new Error('dias_intervalo é obrigatório e deve ser > 0 quando periodicidade = a_cada_N_dias');
    }
    const proxima = new Date(refBrasilia);
    proxima.setUTCDate(proxima.getUTCDate() + dias_intervalo);
    return comHorarioBrasilia(proxima, horas, minutos).toISOString();
  }

  throw new Error(`Periodicidade inválida: ${periodicidade}`);
}

/**
 * Recalcula próxima execução após execução concluída.
 * Aceita janela opcional para respeitar horário comercial em schedules horários.
 */
export function recalcularProximaExecucaoAposExecucao(
  periodicidade: Periodicidade,
  dias_intervalo: number | null,
  horario: string,
  janela?: { inicio: string; fim: string }
): string {
  return calcularProximaExecucao(periodicidade, dias_intervalo, horario, new Date(), janela);
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "calcular-proxima"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/services/agendamentos/calcular-proxima-execucao.service.ts
git commit -m "feat: add janela_execucao windowing to proxima_execucao calculation"
```

---

## Task 5: Executor — Passar `janela_execucao` ao recalcular

**Files:**
- Modify: `src/app/(authenticated)/captura/services/scheduler/executar-agendamento.service.ts:527-543`

No bloco que recalcula `proxima_execucao` antes da execução (linhas ~527-543), extrair `janela_execucao` de `parametros_extras` e passá-la para `recalcularProximaExecucaoAposExecucao`.

- [ ] **Step 1: Atualizar o bloco de recálculo**

Localizar:

```typescript
  if (atualizarProximaExecucao) {
    try {
      const proximaExecucao = recalcularProximaExecucaoAposExecucao(
        agendamento.periodicidade,
        agendamento.dias_intervalo,
        agendamento.horario
      );
```

Substituir por:

```typescript
  if (atualizarProximaExecucao) {
    try {
      const janela = (agendamento.parametros_extras as { janela_execucao?: { inicio: string; fim: string } } | null)?.janela_execucao;
      const proximaExecucao = recalcularProximaExecucaoAposExecucao(
        agendamento.periodicidade,
        agendamento.dias_intervalo,
        agendamento.horario,
        janela
      );
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "executar-agendamento"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/services/scheduler/executar-agendamento.service.ts
git commit -m "feat: pass janela_execucao to proxima_execucao recalculation"
```

---

## Task 6: Persistence — `atualizarAtaAudiencia`

**Files:**
- Modify: `src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts`

Nova função de atualização pontual de ata — chamada pelo smart capture service após upload bem-sucedido.

- [ ] **Step 1: Adicionar função ao final do arquivo**

```typescript
/**
 * Atualiza os campos de ata de uma audiência após captura bem-sucedida.
 */
export async function atualizarAtaAudiencia(
  audienciaId: number,
  params: { ata_audiencia_id: number; url_ata_audiencia: string }
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('audiencias')
    .update({
      ata_audiencia_id: params.ata_audiencia_id,
      url_ata_audiencia: params.url_ata_audiencia,
      updated_at: new Date().toISOString(),
    })
    .eq('id', audienciaId);

  if (error) {
    throw new Error(`Erro ao atualizar ata da audiência ${audienciaId}: ${error.message}`);
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "audiencias-persistence"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/services/persistence/audiencias-persistence.service.ts
git commit -m "feat: add atualizarAtaAudiencia to persistence service"
```

---

## Task 7: DB Query Service — `buscar-audiencias-sem-ata.service.ts`

**Files:**
- Create: `src/app/(authenticated)/captura/services/trt/buscar-audiencias-sem-ata.service.ts`

Este serviço é a espinha dorsal do sistema inteligente: consulta o banco local sem abrir nenhum browser. Retorna audiências do dia atual (Brasília) cujo `data_inicio` já passou e ainda não têm ata.

- [ ] **Step 1: Criar o arquivo**

```typescript
// Consulta banco local por audiências do dia sem ata — não abre PJe.
// Usado como pré-verificação pelo scheduler de atas.

import { createServiceClient } from '@/lib/supabase/service-client';

export interface AudienciaSemAta {
  id: number;           // PK local da audiência
  id_pje: number;       // ID do processo no PJe (para lookup na timeline)
  processo_id: number;  // FK para acervo (ID local)
  numero_processo: string;
  trt: string;
  grau: string;
  advogado_id: number;
  data_inicio: string;  // ISO timestamp
}

export interface BuscarAudienciasSemAtaResult {
  total: number;
  // Agrupado por "trt:grau" para minimizar logins no PJe
  porTrtGrau: Record<string, AudienciaSemAta[]>;
}

/**
 * Busca audiências de HOJE (Brasília) que:
 * - Já começaram (data_inicio <= agora)
 * - Ainda não têm ata (url_ata_audiencia IS NULL)
 *
 * Retorna agrupadas por (trt, grau) para que o caller possa abrir
 * um único browser por tribunal+grau em vez de um por audiência.
 */
export async function buscarAudienciasSemAtaHoje(): Promise<BuscarAudienciasSemAtaResult> {
  const supabase = createServiceClient();
  const agora = new Date();

  // Início do dia em Brasília (UTC-3) em UTC
  // Ex: dia 2026-05-01 em Brasília começa às 2026-05-01T03:00:00Z
  const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
  const agora_brasilia = new Date(agora.getTime() - BRASILIA_OFFSET_MS);
  const inicioDiaBrasilia = new Date(agora_brasilia);
  inicioDiaBrasilia.setUTCHours(0, 0, 0, 0);
  const inicioDiaUTC = new Date(inicioDiaBrasilia.getTime() + BRASILIA_OFFSET_MS);

  const { data, error } = await supabase
    .from('audiencias')
    .select('id, id_pje, processo_id, numero_processo, trt, grau, advogado_id, data_inicio')
    .gte('data_inicio', inicioDiaUTC.toISOString())   // a partir do início do dia (Brasília)
    .lte('data_inicio', agora.toISOString())           // já começou
    .is('url_ata_audiencia', null)                     // sem ata
    .order('data_inicio', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar audiências sem ata: ${error.message}`);
  }

  const audiencias = (data || []) as AudienciaSemAta[];
  const porTrtGrau: Record<string, AudienciaSemAta[]> = {};

  for (const a of audiencias) {
    const chave = `${a.trt}:${a.grau}`;
    if (!porTrtGrau[chave]) porTrtGrau[chave] = [];
    porTrtGrau[chave].push(a);
  }

  return { total: audiencias.length, porTrtGrau };
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "buscar-audiencias-sem-ata"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/services/trt/buscar-audiencias-sem-ata.service.ts
git commit -m "feat: add buscarAudienciasSemAtaHoje DB query service"
```

---

## Task 8: Extraction — Helper `capturar-ata-audiencia.service.ts`

**Files:**
- Create: `src/app/(authenticated)/captura/services/trt/capturar-ata-audiencia.service.ts`
- Modify: `src/app/(authenticated)/captura/services/trt/audiencias.service.ts:591-663`

Extrair a lógica de captura de ata de uma audiência individual (busca na timeline + download + upload Backblaze) para um helper reutilizável. O `audiencias.service.ts` passa a chamar esse helper em vez de ter o código inline.

- [ ] **Step 1: Criar o helper**

```typescript
// Helper para capturar a ata de uma única audiência via timeline do PJe.
// Retorna { documentoId, url } ou null se a ata ainda não foi publicada.

import type { Page } from 'playwright-core';
import { obterTimeline } from '@/app/(authenticated)/captura/pje-trt/timeline/obter-timeline';
import { obterDocumento } from '@/app/(authenticated)/captura/pje-trt/timeline/obter-documento';
import { baixarDocumento } from '@/app/(authenticated)/captura/pje-trt/timeline/baixar-documento';
import { uploadToBackblaze } from '@/lib/storage/backblaze-b2.service';
import { gerarNomeDocumentoAudiencia, gerarCaminhoDocumento } from '@/lib/storage/file-naming.utils';

export interface AtaCapturaParams {
  audienciaId: number;       // PK local (usado para gerar nome do arquivo)
  idPje: number;             // ID do processo no PJe (para obterTimeline)
  numeroProcesso: string;    // para gerar caminho do arquivo
  timelinePreCarregada?: unknown[]; // passa timeline se já buscada, evita refetch
}

export interface AtaCapturaResult {
  documentoId: number;
  url: string;
}

/**
 * Tenta capturar a ata de uma audiência.
 * Busca "ata" na timeline do processo, baixa o PDF e sobe no Backblaze.
 * Retorna null se não encontrar ata na timeline (ainda não publicada).
 */
export async function tentarCapturarAta(
  page: Page,
  params: AtaCapturaParams
): Promise<AtaCapturaResult | null> {
  const { audienciaId, idPje, numeroProcesso, timelinePreCarregada } = params;

  const timeline =
    timelinePreCarregada ||
    (await obterTimeline(page, String(idPje), {
      somenteDocumentosAssinados: true,
      buscarDocumentos: true,
      buscarMovimentos: false,
    }));

  const candidato = (timeline as Array<{ id?: number; tipo?: string; titulo?: string; documento?: unknown }>).find(
    (d) =>
      d.documento &&
      ((d.tipo || '').toLowerCase().includes('ata') ||
        (d.titulo || '').toLowerCase().includes('ata'))
  );

  if (!candidato?.id) return null;

  const documentoId = candidato.id;

  const docDetalhes = await obterDocumento(page, String(idPje), String(documentoId), {
    incluirAssinatura: true,
    grau: 1,
  });

  const pdf = await baixarDocumento(page, String(idPje), String(documentoId), {
    incluirCapa: false,
    incluirAssinatura: true,
    grau: 1,
  });

  const nomeArquivo = gerarNomeDocumentoAudiencia(audienciaId);
  const key = gerarCaminhoDocumento(numeroProcesso, 'audiencias', nomeArquivo);

  const upload = await uploadToBackblaze({
    buffer: pdf,
    key,
    contentType: 'application/pdf',
  });

  return { documentoId: docDetalhes.id, url: upload.url };
}
```

- [ ] **Step 2: Atualizar `audiencias.service.ts` para usar o helper**

Substituir o bloco das linhas 591-663 (que contém a lógica inline de ata) por:

```typescript
    // 5.5 Processar atas para audiências realizadas
    const atasMap: Record<number, { documentoId: number; url: string }> = {};
    if (codigoSituacao === 'F') {
      console.log('   📄 Buscando atas de audiências realizadas...');
      for (const a of audiencias) {
        try {
          const dadosProcesso = dadosComplementares.porProcesso.get(a.idProcesso);
          const ata = await tentarCapturarAta(page, {
            audienciaId: a.id,
            idPje: a.idProcesso,
            numeroProcesso: a.nrProcesso || a.processo?.numero || '',
            timelinePreCarregada: dadosProcesso?.timeline,
          });
          if (ata) {
            atasMap[a.id] = ata;
          }
        } catch (e) {
          captureLogService.logErro(
            'audiencias',
            e instanceof Error ? e.message : String(e),
            { id_pje: a.id, numero_processo: a.nrProcesso || a.processo?.numero, tipo: 'ata' }
          );
        }
      }
    }
```

Adicionar import no topo de `audiencias.service.ts`:

```typescript
import { tentarCapturarAta } from './capturar-ata-audiencia.service';
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep -E "capturar-ata-audiencia|audiencias\.service"
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/services/trt/capturar-ata-audiencia.service.ts
git add src/app/(authenticated)/captura/services/trt/audiencias.service.ts
git commit -m "refactor: extract tentarCapturarAta into reusable helper"
```

---

## Task 9: Smart Capture Service — `capturar-atas-audiencias.service.ts`

**Files:**
- Create: `src/app/(authenticated)/captura/services/trt/capturar-atas-audiencias.service.ts`

O serviço principal do novo fluxo. Orquestra: pré-check DB → agrupamento por (trt, grau) → match de credencial → login PJe → captura → update DB.

- [ ] **Step 1: Criar o arquivo**

```typescript
// Serviço de captura inteligente de atas de audiências.
// Fluxo: pré-check no banco → só abre PJe se houver audiências sem ata → captura pontual.

import { buscarAudienciasSemAtaHoje } from './buscar-audiencias-sem-ata.service';
import { tentarCapturarAta } from './capturar-ata-audiencia.service';
import { atualizarAtaAudiencia } from '../persistence/audiencias-persistence.service';
import { getCredentialComplete } from '../../credentials/credential.service';
import { getTribunalConfig } from './config';
import { autenticarPJE, type AuthResult } from './trt-auth.service';

export interface CapturarAtasResult {
  precheck_total: number;          // audiências sem ata encontradas no banco
  capturadas: number;              // atas capturadas com sucesso neste ciclo
  ainda_sem_ata: number;           // PJe ainda não publicou a ata (tentativa na próxima hora)
  erros: number;
  detalhes: Array<{
    audiencia_id: number;
    status: 'capturada' | 'sem_ata_no_pje' | 'erro';
    url?: string;
    erro?: string;
  }>;
}

export async function capturarAtasAudiencias(params: {
  credencial_ids: number[];
  capturaLogId?: number;
}): Promise<CapturarAtasResult> {
  const result: CapturarAtasResult = {
    precheck_total: 0,
    capturadas: 0,
    ainda_sem_ata: 0,
    erros: 0,
    detalhes: [],
  };

  // ── FASE 1: Pré-check no banco — nenhum browser aberto aqui ──────────────
  console.log('[AtasAudiencias] Fase 1: Verificando audiências sem ata no banco...');
  const pendentes = await buscarAudienciasSemAtaHoje();
  result.precheck_total = pendentes.total;

  if (pendentes.total === 0) {
    console.log('[AtasAudiencias] Nenhuma audiência sem ata para o período. Pulando PJe.');
    return result;
  }

  console.log(`[AtasAudiencias] ${pendentes.total} audiência(s) sem ata encontrada(s). Iniciando captura.`);

  // ── FASE 2: Carregar credenciais ─────────────────────────────────────────
  const credenciais = await Promise.all(
    params.credencial_ids.map((id) => getCredentialComplete({ credentialId: id }))
  );

  // ── FASE 3: Por (trt, grau) → encontrar credencial → abrir PJe ───────────
  for (const [chave, audiencias] of Object.entries(pendentes.porTrtGrau)) {
    const [trt, grau] = chave.split(':');

    const credencial = credenciais.find(
      (c) => c && c.tribunal === trt && c.grau === grau
    );

    if (!credencial) {
      console.warn(`[AtasAudiencias] Nenhuma credencial encontrada para ${trt} ${grau}. Pulando ${audiencias.length} audiência(s).`);
      for (const a of audiencias) {
        result.erros++;
        result.detalhes.push({ audiencia_id: a.id, status: 'erro', erro: `Sem credencial para ${trt} ${grau}` });
      }
      continue;
    }

    let authResult: AuthResult | null = null;
    try {
      let tribunalConfig;
      try {
        tribunalConfig = await getTribunalConfig(credencial.tribunal, credencial.grau);
      } catch (e) {
        throw new Error(`Configuração do tribunal não encontrada: ${e instanceof Error ? e.message : e}`);
      }

      console.log(`[AtasAudiencias] Autenticando em ${trt} ${grau} para ${audiencias.length} audiência(s)...`);
      authResult = await autenticarPJE({
        credential: credencial.credenciais,
        config: tribunalConfig,
        headless: true,
      });

      const { page } = authResult;

      // ── FASE 4: Para cada audiência neste tribunal, tentar capturar ata ──
      for (const audiencia of audiencias) {
        try {
          const ata = await tentarCapturarAta(page, {
            audienciaId: audiencia.id,
            idPje: audiencia.id_pje,
            numeroProcesso: audiencia.numero_processo,
          });

          if (ata) {
            await atualizarAtaAudiencia(audiencia.id, {
              ata_audiencia_id: ata.documentoId,
              url_ata_audiencia: ata.url,
            });
            result.capturadas++;
            result.detalhes.push({ audiencia_id: audiencia.id, status: 'capturada', url: ata.url });
            console.log(`   ✅ Ata capturada: audiência ${audiencia.id} (${audiencia.numero_processo})`);
          } else {
            result.ainda_sem_ata++;
            result.detalhes.push({ audiencia_id: audiencia.id, status: 'sem_ata_no_pje' });
            console.log(`   ⏳ Sem ata ainda: audiência ${audiencia.id} (${audiencia.numero_processo})`);
          }
        } catch (e) {
          result.erros++;
          const erro = e instanceof Error ? e.message : String(e);
          result.detalhes.push({ audiencia_id: audiencia.id, status: 'erro', erro });
          console.error(`   ❌ Erro ao capturar ata da audiência ${audiencia.id}:`, erro);
        }
      }
    } finally {
      if (authResult?.browser) {
        await authResult.browser.close();
      }
    }
  }

  console.log(`[AtasAudiencias] Concluído: ${result.capturadas} capturadas, ${result.ainda_sem_ata} pendentes, ${result.erros} erros.`);
  return result;
}
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "capturar-atas-audiencias"
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/services/trt/capturar-atas-audiencias.service.ts
git commit -m "feat: add capturarAtasAudiencias smart capture service"
```

---

## Task 10: Executor — Case `audiencias_ata`

**Files:**
- Modify: `src/app/(authenticated)/captura/services/scheduler/executar-agendamento.service.ts`

Adicionar o novo case no `switch (agendamento.tipo_captura)`, após o case `audiencias`.

- [ ] **Step 1: Adicionar import**

No topo do arquivo, junto aos outros imports de serviços:

```typescript
import { capturarAtasAudiencias, type CapturarAtasResult } from '../trt/capturar-atas-audiencias.service';
```

- [ ] **Step 2: Adicionar o case no switch**

Localizar o `switch (agendamento.tipo_captura)` e adicionar antes do `default`:

```typescript
          case 'audiencias_ata': {
            resultado = await capturarAtasAudiencias({
              credencial_ids: agendamento.credencial_ids,
              capturaLogId: logId ?? undefined,
            });

            await registrarRawLog({
              tipo_captura: agendamento.tipo_captura,
              advogado_id: agendamento.advogado_id,
              credencial_id: credCompleta.credentialId,
              credencial_ids: agendamento.credencial_ids,
              trt: credCompleta.tribunal,
              grau: credCompleta.grau,
              status: (resultado as CapturarAtasResult).erros === 0 ? 'success' : 'error',
              requisicao: { agendamento_id: agendamento.id },
              resultado_processado: resultado as CapturarAtasResult,
            });
            break;
          }
```

**Atenção:** `capturarAtasAudiencias` já itera internamente por (trt, grau) e abre browsers conforme necessário. O loop externo de credenciais em `executarCaptura` ainda vai rodar para cada credencial, mas como `capturarAtasAudiencias` usa todas as `credencial_ids` do agendamento internamente, o raw log será registrado uma vez por credencial do agendamento (comportamento consistente com outros tipos). Para evitar execuções duplicadas, adicionar um guard no início do case:

```typescript
          case 'audiencias_ata': {
            // O serviço usa todas credencial_ids internamente — executa apenas na primeira credencial
            // para evitar múltiplas execuções do mesmo ciclo
            if (credCompleta.credentialId !== agendamento.credencial_ids[0]) {
              break;
            }
            resultado = await capturarAtasAudiencias({
              credencial_ids: agendamento.credencial_ids,
              capturaLogId: logId ?? undefined,
            });
            // ... registrarRawLog ...
            break;
          }
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit 2>&1 | grep "executar-agendamento"
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/services/scheduler/executar-agendamento.service.ts
git commit -m "feat: add audiencias_ata case to scheduler executor"
```

---

## Task 11: DB — Criar agendamentos finais

**Files:**
- DB via Supabase MCP

Estado desejado dos agendamentos de audiências:

| ID | Tipo | Situação | Periodicidade | Horário | Janela |
|----|------|----------|---------------|---------|--------|
| 10 | `audiencias` | M (marcadas) | diario | 18:00 | — |
| novo | `audiencias` | C (canceladas) | diario | 18:00 | — |
| novo | `audiencias_ata` | — | a_cada_N_horas (1) | — | 09:00–18:00 |

- [ ] **Step 1: Remover agendamento ID 10 (horário incorreto) e criar os corretos**

```sql
-- Remover agendamento horário incorreto (audiencias F sem janela)
DELETE FROM agendamentos WHERE id = 10;

-- Audiências marcadas — diário às 18h (captura agenda futura + atualiza dados)
INSERT INTO agendamentos (
  tipo_captura, advogado_id, credencial_ids, periodicidade, dias_intervalo,
  horario, ativo, parametros_extras, proxima_execucao
) VALUES (
  'audiencias', 1,
  ARRAY(SELECT generate_series(1,49))::bigint[],
  'diario', NULL, '18:00:00', true,
  '{"codigoSituacao": "M", "dataRelativa": "hoje"}'::jsonb,
  -- próxima às 21:00 UTC (= 18:00 Brasília)
  CASE WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') < 21
    THEN date_trunc('day', NOW()) + INTERVAL '21 hours'
    ELSE date_trunc('day', NOW()) + INTERVAL '1 day 21 hours'
  END
);

-- Audiências canceladas — diário às 18h
INSERT INTO agendamentos (
  tipo_captura, advogado_id, credencial_ids, periodicidade, dias_intervalo,
  horario, ativo, parametros_extras, proxima_execucao
) VALUES (
  'audiencias', 1,
  ARRAY(SELECT generate_series(1,49))::bigint[],
  'diario', NULL, '18:00:00', true,
  '{"codigoSituacao": "C", "dataRelativa": "hoje"}'::jsonb,
  CASE WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') < 21
    THEN date_trunc('day', NOW()) + INTERVAL '21 hours'
    ELSE date_trunc('day', NOW()) + INTERVAL '1 day 21 hours'
  END
);

-- Smart ata capture — a cada hora, janela 09:00–18:00 Brasília
-- horario '09:00:00' = hora de início (usada como referência de display)
-- proxima_execucao = próxima ocorrência de 09:00 Brasília (= 12:00 UTC)
INSERT INTO agendamentos (
  tipo_captura, advogado_id, credencial_ids, periodicidade, dias_intervalo,
  horario, ativo, parametros_extras, proxima_execucao
) VALUES (
  'audiencias_ata', 1,
  ARRAY(SELECT generate_series(1,49))::bigint[],
  'a_cada_N_horas', 1, '09:00:00', true,
  '{"janela_execucao": {"inicio": "09:00", "fim": "18:00"}}'::jsonb,
  CASE
    -- Se ainda não passou das 12:00 UTC (= 09:00 Brasília) hoje: agenda para hoje às 12:00
    WHEN NOW() < date_trunc('day', NOW()) + INTERVAL '12 hours'
      THEN date_trunc('day', NOW()) + INTERVAL '12 hours'
    -- Se ainda dentro da janela (antes das 21:00 UTC = 18:00 Brasília): próxima hora inteira
    WHEN NOW() < date_trunc('day', NOW()) + INTERVAL '21 hours'
      THEN date_trunc('hour', NOW()) + INTERVAL '1 hour'
    -- Depois das 18:00 Brasília: próxima às 09:00 Brasília amanhã (= 12:00 UTC)
    ELSE date_trunc('day', NOW()) + INTERVAL '1 day 12 hours'
  END
)
RETURNING id, tipo_captura, periodicidade, horario, parametros_extras, proxima_execucao;
```

- [ ] **Step 2: Verificar estado final dos agendamentos**

```sql
SELECT id, tipo_captura, periodicidade, horario, ativo, parametros_extras, proxima_execucao
FROM agendamentos
ORDER BY id;
```

Esperado: agendamento 6 (pendentes 07:00), dois novos de audiencias (M e C, diário 18:00), um novo audiencias_ata (a_cada_N_horas, janela 09-18).

---

## Task 12: UI Fix — Agendamentos deletados ainda aparecem na lista

**Files:**
- A identificar: componente ou query de listagem de agendamentos na UI

- [ ] **Step 1: Localizar o componente de lista**

```bash
find src/app/\(authenticated\)/captura/agendamentos -name "*.tsx" | head -10
```

- [ ] **Step 2: Verificar se há estado local ou cache**

Abrir o arquivo `page-client.tsx` (ou equivalente) e verificar:
- Se usa `useState` com dados iniciais que não re-fetcha após deleção
- Se usa SWR/React Query com revalidação configurada
- Se usa `router.refresh()` após deleção

- [ ] **Step 3: Garantir que deleção via API invalida a lista**

Na rota `DELETE /api/captura/agendamentos/[id]/route.ts`, verificar se retorna 200 com corpo ou 204. No componente de lista, após resposta de deleção bem-sucedida, o estado local deve ser atualizado imediatamente (filtrar o item deletado do array) antes de qualquer refetch — padrão "optimistic update".

Padrão correto no componente:

```typescript
const handleDelete = async (id: number) => {
  const res = await fetch(`/api/captura/agendamentos/${id}`, { method: 'DELETE' });
  if (res.ok) {
    // Atualização otimista: remove imediatamente do estado local
    setAgendamentos(prev => prev.filter(a => a.id !== id));
  }
};
```

- [ ] **Step 4: Testar no browser**

Navegar para `/captura/agendamentos`, deletar um agendamento, verificar que desaparece imediatamente da lista sem necessitar reload.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/captura/agendamentos/
git commit -m "fix: agendamentos deletados removem imediatamente da lista"
```

---

## Self-Review

**Spec coverage:**
- ✅ Pré-check DB (Task 7) — busca audiências sem ata antes de abrir PJe
- ✅ Apenas audiências com `data_inicio <= agora` (Task 7, filtro `lte`)
- ✅ Retry implícito — audiências que ficam `ainda_sem_ata` continuam retornando na próxima hora
- ✅ Janela 09h–18h Brasília (Task 4) — após 18h, next hop vai às 09h do dia seguinte
- ✅ Sem browser se nada pendente (Task 9, early return quando `total === 0`)
- ✅ Ata salva no banco via `atualizarAtaAudiencia` (Task 6)
- ✅ Agendamentos M e C criados às 18h (Task 11)
- ✅ UI fix (Task 12)

**Type consistency:**
- `AudienciaSemAta.id_pje` (Task 7) → `tentarCapturarAta({ idPje })` (Task 8) ✅
- `AtaCapturaResult.documentoId` → `atualizarAtaAudiencia({ ata_audiencia_id })` (Task 9) ✅
- `CapturarAtasResult` importado no executor (Task 10) ✅
- `janela_execucao` em `parametros_extras` (Task 3) → lido no executor (Task 5) ✅
