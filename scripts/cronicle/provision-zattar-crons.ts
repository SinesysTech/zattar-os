/*
  Provision Cronicle events (jobs) for Zattar Advogados app.

  Required env vars:
    - CRONICLE_URL: e.g. https://cronicle.service.sinesys.app
    - CRONICLE_API_KEY: API key created in Cronicle UI
    - APP_INTERNAL_BASE_URL: e.g. http://srv-captain--zattar-app:3000
    - APP_CRON_SECRET: value of CRON_SECRET configured on the app

  Optional env vars:
    - CRONICLE_CATEGORY: default "general"
    - CRONICLE_PLUGIN: default "shellplug"
    - CRONICLE_TARGET: default "all"
    - CRONICLE_TIMEZONE: default "America/Sao_Paulo"

  Usage:
    npx tsx scripts/cronicle/provision-zattar-crons.ts
    npx tsx scripts/cronicle/provision-zattar-crons.ts --dry-run
*/

import axios from "axios";

type CronicleTiming = {
  years?: number[];
  months?: number[];
  days?: number[];
  weekdays?: number[];
  hours?: number[];
  minutes?: number[];
};

type CronicleEvent = {
  id?: string;
  title: string;
  enabled: 0 | 1;
  category: string;
  plugin: string;
  target: string;
  timing: CronicleTiming;
  timezone: string;
  timeout?: number;
  retries?: number;
  retry_delay?: number;
  max_children?: number;
  catch_up?: boolean;
  detached?: boolean;
  multiplex?: 0 | 1;
  notes?: string;
  params?: Record<string, unknown>;
};

type CronicleResponse<T> = {
  code: 0 | string | number;
  description?: string;
} & T;

function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return (value && value.trim()) || fallback;
}

function minutesEvery(step: number): number[] {
  if (!Number.isInteger(step) || step <= 0 || step > 59) {
    throw new Error(`Invalid minute step: ${step}`);
  }
  const out: number[] = [];
  for (let m = 0; m < 60; m += step) out.push(m);
  return out;
}

function shellCurlScript(params: {
  baseUrl: string;
  path: string;
  cronSecret: string;
  maxTimeSeconds: number;
}): string {
  const url = `${params.baseUrl.replace(/\/$/, "")}${params.path}`;
  const maxTimeSeconds = Math.max(1, Math.floor(params.maxTimeSeconds));

  // Keep it POSIX sh compatible (Cronicle shellplug runs on the worker).
  // Avoid echoing the secret.
  return [
    "#!/bin/sh",
    "set -eu",
    "",
    `curl -fsS -X POST \\\n+  \"${url}\" \\\n+  -H \"X-Cron-Secret: ${params.cronSecret}\" \\\n+  -H \"Content-Type: application/json\" \\\n+  --connect-timeout 10 \\\n+  --max-time ${maxTimeSeconds}`,
    "",
  ].join("\n");
}

function assertSuccess<T extends object>(res: CronicleResponse<T>, action: string): T {
  if (res.code !== 0) {
    const description = res.description || "Unknown Cronicle API error";
    throw new Error(`${action} failed: code=${String(res.code)} description=${description}`);
  }
  return res as unknown as T;
}

async function croniclePost<T extends object>(
  function buildDesiredEvents(input: {
    appBaseUrl: string;
    cronSecret: string;
    category: string;
    plugin: string;
    target: string;
    timezone: string;
  }): CronicleEvent[] {
    const mk = (p: {
      title: string;
      path: string;
      timing: CronicleTiming;
      timeoutSeconds: number;
      notes: string;
    }): CronicleEvent => ({
      title: p.title,
      enabled: 1,
      category: input.category,
      plugin: input.plugin,
      target: input.target,
      timezone: input.timezone,
      timing: p.timing,
      timeout: p.timeoutSeconds,
      max_children: 1,
      catch_up: false,
      detached: false,
      multiplex: 0,
      retries: 0,
      retry_delay: 0,
      notes: p.notes,
      params: {
        script: shellCurlScript({
          baseUrl: input.appBaseUrl,
          path: p.path,
          cronSecret: input.cronSecret,
          maxTimeSeconds: p.timeoutSeconds,
        }),
      },
    });

    // Schedules based on docs/cronicle-caprover.md suggestions.
    return [
      mk({
        title: "Zattar: executar-agendamentos",
        path: "/api/cron/executar-agendamentos",
        timing: { minutes: minutesEvery(5) },
        timeoutSeconds: 360,
        notes:
          "Calls /api/cron/executar-agendamentos (captura scheduler). Managed by provision-zattar-crons.ts.",
      }),
      mk({
        title: "Zattar: verificar-prazos",
        path: "/api/cron/verificar-prazos",
        timing: { minutes: minutesEvery(30) },
        timeoutSeconds: 120,
        notes:
          "Calls /api/cron/verificar-prazos (notificações de prazos). Managed by provision-zattar-crons.ts.",
      }),
      mk({
        title: "Zattar: indexar-documentos",
        path: "/api/cron/indexar-documentos",
        timing: { minutes: minutesEvery(2) },
        timeoutSeconds: 360,
        notes:
          "Calls /api/cron/indexar-documentos (RAG indexing). Managed by provision-zattar-crons.ts.",
      }),
      mk({
        title: "Zattar: refresh-chat-view",
        path: "/api/cron/refresh-chat-view",
        timing: { minutes: minutesEvery(5) },
        timeoutSeconds: 120,
        notes:
          "Calls /api/cron/refresh-chat-view (materialized view refresh). Managed by provision-zattar-crons.ts.",
      }),
      mk({
        title: "Zattar: vacuum-maintenance",
        path: "/api/cron/vacuum-maintenance",
        timing: { hours: [3], minutes: [0] },
        timeoutSeconds: 120,
        notes:
          "Calls /api/cron/vacuum-maintenance (bloat diagnostics). Managed by provision-zattar-crons.ts.",
      }),
      mk({
        title: "Zattar: alertas-disk-io",
        path: "/api/cron/alertas-disk-io",
        timing: { minutes: minutesEvery(10) },
        timeoutSeconds: 120,
        notes:
          "Calls /api/cron/alertas-disk-io (disk IO budget alerts). Managed by provision-zattar-crons.ts.",
      }),
    ];
  }
    mk({
      title: "Zattar: executar-agendamentos",
      path: "/api/cron/executar-agendamentos",
      timing: { minutes: minutesEvery(5) },
      timeoutSeconds: 360,
      notes: "Calls /api/cron/executar-agendamentos (captura scheduler). Managed by provision-zattar-crons.ts.",
    }),
    mk({
      title: "Zattar: verificar-prazos",
      path: "/api/cron/verificar-prazos",
      timing: { minutes: minutesEvery(30) },
      timeoutSeconds: 120,
      notes: "Calls /api/cron/verificar-prazos (notificações de prazos). Managed by provision-zattar-crons.ts.",
    }),
    mk({
      title: "Zattar: indexar-documentos",
      path: "/api/cron/indexar-documentos",
      timing: { minutes: minutesEvery(2) },
      timeoutSeconds: 360,
      notes: "Calls /api/cron/indexar-documentos (RAG indexing). Managed by provision-zattar-crons.ts.",
    }),
    mk({
      title: "Zattar: refresh-chat-view",
      path: "/api/cron/refresh-chat-view",
      timing: { minutes: minutesEvery(5) },
      timeoutSeconds: 120,
      notes: "Calls /api/cron/refresh-chat-view (materialized view refresh). Managed by provision-zattar-crons.ts.",
    }),
    mk({
      title: "Zattar: vacuum-maintenance",
      path: "/api/cron/vacuum-maintenance",
      timing: { hours: [3], minutes: [0] },
      timeoutSeconds: 120,
      notes: "Calls /api/cron/vacuum-maintenance (bloat diagnostics). Managed by provision-zattar-crons.ts.",
    }),
    mk({
      title: "Zattar: alertas-disk-io",
      path: "/api/cron/alertas-disk-io",
      timing: { minutes: minutesEvery(10) },
      timeoutSeconds: 120,
      notes: "Calls /api/cron/alertas-disk-io (disk IO budget alerts). Managed by provision-zattar-crons.ts.",
    }),
  ];
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  const cronicleUrl = mustGetEnv("CRONICLE_URL");
  const cronicleApiKey = mustGetEnv("CRONICLE_API_KEY");
  const appBaseUrl = mustGetEnv("APP_INTERNAL_BASE_URL");
  const appCronSecret = mustGetEnv("APP_CRON_SECRET");

  const category = envOrDefault("CRONICLE_CATEGORY", "general");
  const plugin = envOrDefault("CRONICLE_PLUGIN", "shellplug");
  const target = envOrDefault("CRONICLE_TARGET", "all");
  const timezone = envOrDefault("CRONICLE_TIMEZONE", "America/Sao_Paulo");

  const desired = buildDesiredEvents({
    appBaseUrl,
    cronSecret: appCronSecret,
    category,
    plugin,
    target,
    timezone,
  });

  console.log(`[Cronicle] Base URL: ${cronicleUrl}`);
  console.log(`[Cronicle] Dry run: ${dryRun ? "yes" : "no"}`);
  console.log(`[Cronicle] Desired events: ${desired.length}`);

  const existing = await getAllEvents(cronicleUrl, cronicleApiKey);
  const existingByTitle = new Map(existing.map((e) => [e.title, e]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const event of desired) {
    const existingEvent = existingByTitle.get(event.title);

    if (!existingEvent?.id) {
      if (dryRun) {
        console.log(`[Cronicle] Would create: ${event.title}`);
        created++;
        continue;
      }

      const res = await croniclePost<{ id: string }>(
        cronicleUrl,
        cronicleApiKey,
        "create_event",
        event as unknown as Record<string, unknown>
      );
      const payload = assertSuccess(res, `create_event (${event.title})`);
      console.log(`[Cronicle] Created: ${event.title} (id=${payload.id})`);
      created++;
      continue;
    }

    // Update existing.
    const toUpdate: CronicleEvent = {
      ...event,
      id: existingEvent.id,
    };

    // Best-effort: avoid update if nothing relevant changed.
    // We compare a small subset that matters.
    const changed =
      existingEvent.enabled !== event.enabled ||
      existingEvent.category !== event.category ||
      existingEvent.plugin !== event.plugin ||
      existingEvent.target !== event.target ||
      JSON.stringify(existingEvent.timing || {}) !== JSON.stringify(event.timing || {}) ||
      existingEvent.timezone !== event.timezone ||
      existingEvent.timeout !== event.timeout ||
      JSON.stringify(existingEvent.params || {}) !== JSON.stringify(event.params || {});

    if (!changed) {
      console.log(`[Cronicle] Unchanged: ${event.title} (id=${existingEvent.id})`);
      unchanged++;
      continue;
    }

    if (dryRun) {
      console.log(`[Cronicle] Would update: ${event.title} (id=${existingEvent.id})`);
      updated++;
      continue;
    }

    const res = await croniclePost<Record<string, never>>(
      cronicleUrl,
      cronicleApiKey,
      "update_event",
      toUpdate as unknown as Record<string, unknown>
    );
    assertSuccess(res, `update_event (${event.title})`);
    console.log(`[Cronicle] Updated: ${event.title} (id=${existingEvent.id})`);
    updated++;
  }

  console.log("\n[Cronicle] Done");
  console.log(`  Created:   ${created}`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
}

main().catch((err) => {
  console.error("[Cronicle] Provisioning failed:", err);
  process.exitCode = 1;
});
