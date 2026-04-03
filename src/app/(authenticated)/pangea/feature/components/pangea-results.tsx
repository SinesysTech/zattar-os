'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge } from '@/components/ui/app-badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import { Typography } from '@/components/ui/typography';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { PangeaBuscaResponse, PangeaResultado } from '../domain';

function toBadgeTribunalCode(orgao: string): string {
  // TRT01 -> TRT1 para reaproveitar variantes existentes
  const normalized = orgao.toUpperCase();
  const trt = normalized.match(/^TRT0(\d)$/);
  if (trt) return `TRT${trt[1]}`;
  const trf = normalized.match(/^TRF0(\d)$/);
  if (trf) return `TRF${trf[1]}`;
  return normalized;
}

function toNormalizedTribunalCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function renderSafeMarkedText(text: string): React.ReactNode {
  // Permite SOMENTE <mark> e <br>. Todo o resto vira texto.
  // Implementação simples baseada em tokens.
  const tokens = text.split(/(<\/?mark>|<br\s*\/?>)/gi);
  const nodes: React.ReactNode[] = [];
  let inMark = false;
  let key = 0;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === '<mark>') {
      inMark = true;
      continue;
    }
    if (lower === '</mark>') {
      inMark = false;
      continue;
    }
    if (lower.startsWith('<br')) {
      nodes.push(<br key={`br-${key++}`} />);
      continue;
    }

    if (!token) continue;
    if (inMark) {
      nodes.push(
        <mark key={`m-${key++}`} className="rounded bg-muted px-1 py-0.5">
          {token}
        </mark>
      );
    } else {
      nodes.push(<React.Fragment key={`t-${key++}`}>{token}</React.Fragment>);
    }
  }

  return nodes;
}

function getResumoTexto(r: PangeaResultado): { titulo: React.ReactNode; subtitulo?: React.ReactNode } {
  const tituloRaw = r.highlight?.questao ?? r.questao ?? '';
  const teseRaw = r.highlight?.tese ?? r.tese ?? '';

  return {
    titulo: tituloRaw ? renderSafeMarkedText(tituloRaw) : '(sem questão)',
    subtitulo: teseRaw ? renderSafeMarkedText(teseRaw) : undefined,
  };
}

export function PangeaResults({ data }: { data: PangeaBuscaResponse }) {
  const total = data.total ?? 0;

  const aggsByOrgao = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of data.aggsOrgaos ?? []) {
      map.set(toNormalizedTribunalCode(a.tipo), a.total);
    }
    return map;
  }, [data.aggsOrgaos]);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, PangeaResultado[]>();
    for (const r of data.resultados ?? []) {
      const key = toNormalizedTribunalCode(r.orgao);
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }

    const entries = Array.from(groups.entries()).map(([orgao, resultados]) => ({
      orgao,
      resultados,
      total: aggsByOrgao.get(orgao) ?? resultados.length,
    }));

    // Ordenar por total desc e depois por sigla
    entries.sort((a, b) => b.total - a.total || a.orgao.localeCompare(b.orgao));
    return entries;
  }, [data.resultados, aggsByOrgao]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Typography.Muted>Total</Typography.Muted>
            <Typography.H3>{total}</Typography.H3>
          </div>
          <div>
            <Typography.Muted>Por tribunal</Typography.Muted>
            <div className="mt-2 flex flex-wrap gap-2">
              {grouped.slice(0, 16).map((g) => {
                const badgeCode = toBadgeTribunalCode(g.orgao);
                return (
                  <AppBadge key={`org-${g.orgao}`} variant="neutral" className="flex items-center gap-2">
                    <TribunalBadge codigo={badgeCode} />
                    <span>{g.total}</span>
                  </AppBadge>
                );
              })}
              {grouped.length > 16 && (
                <AppBadge variant="outline">+{grouped.length - 16}</AppBadge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados por tribunal</CardTitle>
        </CardHeader>
        <CardContent>
          {grouped.length === 0 ? (
            <Typography.Muted>Nenhum precedente encontrado.</Typography.Muted>
          ) : (
            <Accordion type="multiple" className="w-full">
              {grouped.map((g) => {
                const badgeCode = toBadgeTribunalCode(g.orgao);
                return (
                  <AccordionItem key={g.orgao} value={g.orgao}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 w-full">
                        <TribunalBadge codigo={badgeCode} />
                        <Typography.Muted className="text-sm">{g.orgao}</Typography.Muted>
                        <AppBadge variant="neutral" className="ml-auto">
                          {g.total}
                        </AppBadge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {g.resultados.map((r) => {
                          const { titulo, subtitulo } = getResumoTexto(r);

                          return (
                            <Card key={r.id}>
                              <CardHeader className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <AppBadge variant="info">{r.tipo}</AppBadge>
                                  {typeof r.nr === 'number' && <AppBadge variant="secondary">nr {r.nr}</AppBadge>}
                                  {r.situacao && <AppBadge variant="neutral">{r.situacao}</AppBadge>}
                                  {r.ultimaAtualizacao && (
                                    <AppBadge variant="outline">Atualizado: {r.ultimaAtualizacao}</AppBadge>
                                  )}
                                  {r.possuiDecisoes && <AppBadge variant="success">Com decisões</AppBadge>}
                                  {r.alertaSituacao && <AppBadge variant="warning">{r.alertaSituacao}</AppBadge>}
                                </div>
                                <div className="space-y-2">
                                  <Typography.H3 className="text-base leading-6">{titulo}</Typography.H3>
                                  {subtitulo && (
                                    <Typography.Muted className="leading-6">{subtitulo}</Typography.Muted>
                                  )}
                                </div>
                              </CardHeader>

                              {r.processosParadigma?.length ? (
                                <CardContent className="pt-0">
                                  <Typography.Muted className="mb-2">Processos paradigma</Typography.Muted>
                                  <div className="flex flex-col gap-1">
                                    {r.processosParadigma.map((p) => (
                                      p.link ? (
                                        <Link
                                          key={p.numero}
                                          href={p.link}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-sm underline underline-offset-4"
                                        >
                                          {p.numero}
                                        </Link>
                                      ) : (
                                        <span key={p.numero} className="text-sm text-muted-foreground">
                                          {p.numero}
                                        </span>
                                      )
                                    ))}
                                  </div>
                                </CardContent>
                              ) : null}
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


