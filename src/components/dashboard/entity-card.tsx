/**
 * EntityCard — Cartão visual de entidade jurídica (parte, cliente, representante, etc.)
 * ============================================================================
 * Exibe avatar, nome, tipo, contato, métricas de processos e tags.
 * Segue a estética "Glass Briefing" — vidro, compacto, identidade visual por tipo.
 *
 * USO:
 *   <EntityCard data={entityData} onClick={(d) => setSelected(d)} />
 * ============================================================================
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Scale, Clock, Copy, Check, FileText } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EntityCardConfig {
  label: string;
  icon: LucideIcon;
  color: string;  // e.g. 'text-primary/70'
  bg: string;     // e.g. 'bg-primary/8'
}

export interface ProcessoResumo {
  id: number | string;
  numero: string;
  status?: string | null;
}

export interface EntityCardData {
  id: number | string;
  nome: string;
  nomeSocial?: string;
  tipo: 'pf' | 'pj';
  config: EntityCardConfig;
  documentoMasked: string;
  documentoRaw?: string;
  email?: string;
  telefone?: string;
  localizacao: string;  // "São Paulo, SP"
  enderecoCompleto?: string;
  ativo: boolean;
  metricas: { label: string; ativos: number; total: number };
  processos?: ProcessoResumo[];
  ultimaAtualizacao: string;  // ISO date
  tags?: string[];
}

interface EntityCardProps {
  data: EntityCardData;
  onClick?: (data: EntityCardData) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function timeAgo(iso: string): string {
  if (!iso) return '--';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '--';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d atrás`;
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

// ─── Inline Copy Button ─────────────────────────────────────────────────────

function InlineCopy({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copiado!' : label}
      className="inline-flex items-center justify-center size-4 rounded hover:bg-muted/50 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
    >
      {copied ? (
        <Check className="size-2.5 text-success" />
      ) : (
        <Copy className="size-2.5 text-muted-foreground/50" />
      )}
    </button>
  );
}

/** Linha de informação com ícone, texto e botão copiar */
function InfoLine({
  icon: Icon,
  text,
  copyLabel,
  copyText,
  truncate = true,
}: {
  icon: LucideIcon;
  text: string;
  copyLabel: string;
  copyText?: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="size-3 text-muted-foreground/40 shrink-0" />
      <span className={`text-[11px] text-muted-foreground/70 flex-1 min-w-0 ${truncate ? 'truncate' : 'wrap-break-word'}`}>
        {text}
      </span>
      <InlineCopy text={copyText ?? text} label={copyLabel} />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EntityCard({ data, onClick }: EntityCardProps) {
  const { config } = data;

  return (
    <GlassPanel className="p-4 cursor-pointer group hover:border-border/40 transition-colors">
      <div onClick={() => onClick?.(data)}>
        {/* Header: Avatar + Nome + Badge */}
        <div className="flex items-start gap-3">
          <div className={`size-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
            {data.tipo === 'pj' ? (
              <Building2 className={`size-4 ${config.color}`} />
            ) : (
              <span className={`text-xs font-bold ${config.color}`}>{getInitials(data.nome)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold truncate flex-1">{data.nome}</h3>
              <InlineCopy text={data.nome} label="Copiar nome" />
              {!data.ativo && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50 shrink-0">
                  Inativo
                </span>
              )}
            </div>
            {data.nomeSocial && (
              <p className="text-[10px] text-muted-foreground/55 truncate mt-0.5">{data.nomeSocial}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>
        </div>

        {/* Dados de contato */}
        <div className="mt-3 space-y-1">
          <InfoLine
            icon={FileText}
            text={data.documentoMasked}
            copyLabel={data.tipo === 'pf' ? 'Copiar CPF' : 'Copiar CNPJ'}
            copyText={data.documentoRaw ?? data.documentoMasked}
          />
          {data.telefone && (
            <InfoLine icon={Phone} text={data.telefone} copyLabel="Copiar telefone" />
          )}
          {data.email && (
            <InfoLine icon={Mail} text={data.email} copyLabel="Copiar e-mail" />
          )}
          {data.enderecoCompleto && data.enderecoCompleto !== '-' ? (
            <InfoLine
              icon={MapPin}
              text={data.enderecoCompleto}
              copyLabel="Copiar endereço"
              truncate={false}
            />
          ) : (
            <InfoLine icon={MapPin} text={data.localizacao} copyLabel="Copiar localidade" />
          )}
        </div>

        {/* Processos */}
        <div className="mt-3 pt-3 border-t border-border/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Scale className="size-3 text-muted-foreground/40" />
            <span className="text-[10px] font-medium text-muted-foreground/60">
              {data.metricas.total} {data.metricas.total === 1 ? 'processo' : 'processos'}
              {data.metricas.ativos > 0 && ` · ${data.metricas.ativos} ativos`}
            </span>
          </div>
          {data.processos && data.processos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {data.processos.slice(0, 3).map((proc) => (
                <Link
                  key={proc.id}
                  href={`/app/processos/${proc.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border border-border/20 bg-muted/20 hover:bg-muted/40 tabular-nums transition-colors"
                >
                  {proc.numero}
                </Link>
              ))}
              {data.processos.length > 3 && (
                <span className="text-[9px] px-1.5 py-0.5 text-muted-foreground/50">
                  +{data.processos.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rodapé: Tempo + Tags */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/10">
          <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
            <Clock className="size-2.5" />
            {timeAgo(data.ultimaAtualizacao)}
          </span>
          {data.tags && data.tags.length > 0 && (
            <div className="flex gap-1">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-primary/5 text-primary/50"
                >
                  {tag}
                </span>
            ))}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
