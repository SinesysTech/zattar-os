'use client';

/**
 * ContratoDetalhesHeader — Hero do detalhe de contrato.
 * ============================================================================
 * Padrão extraído do `audiencia-detail-dialog`: GlassPanel único com
 * título compacto "Cliente × Parte Contrária", meta-line separada por dots,
 * bloco primary/5 destacado com campos principais (tipo, responsável,
 * processos) e ações rápidas, e TabsList embutido no rodapé do hero.
 *
 * Tokens: zero CSS inline — tudo via classes Tailwind resolvendo tokens CSS.
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  FileText,
  FileSignature,
  Send,
  Trash2,
  User,
  Scale,
  MoreHorizontal,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { Contrato, ResponsavelDetalhado } from '@/app/(authenticated)/contratos';
import {
  STATUS_CONTRATO_LABELS,
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  PAPEL_CONTRATUAL_LABELS,
  ContratoDeleteDialog,
} from '@/app/(authenticated)/contratos';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

function diffDaysFromNow(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const past = new Date(iso).getTime();
  if (Number.isNaN(past)) return null;
  return Math.max(0, Math.floor((Date.now() - past) / (1000 * 60 * 60 * 24)));
}

function getParteContrariaInfo(contrato: Contrato): { nome: string; total: number } | null {
  const partesContrarias = contrato.partes.filter((p) => p.tipoEntidade === 'parte_contraria');
  if (partesContrarias.length === 0) return null;
  const primeira = partesContrarias[0]?.nomeSnapshot || 'Parte Contrária';
  return { nome: primeira, total: partesContrarias.length };
}

// ─── MetaDot ─────────────────────────────────────────────────────────────────

function MetaDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-0.75 rounded-full bg-muted-foreground/60"
    />
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ContratoDetalhesHeaderProps {
  contrato: Contrato;
  clienteNome: string;
  responsavel?: ResponsavelDetalhado | null;
  segmentoNome?: string | null;
  totalProcessos: number;
  onEdit?: () => void;
  onGerarPeca?: () => void;
  onEnviarAssinatura?: () => void;
  /** Slot para o TabsList (renderizado no rodapé do hero). */
  tabs?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContratoDetalhesHeader({
  contrato,
  clienteNome,
  responsavel,
  segmentoNome,
  totalProcessos,
  onEdit,
  onGerarPeca,
  onEnviarAssinatura,
  tabs,
}: ContratoDetalhesHeaderProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const parteContraria = getParteContrariaInfo(contrato);
  const tipoLabel = TIPO_CONTRATO_LABELS[contrato.tipoContrato] ?? contrato.tipoContrato;
  const cobrancaLabel = TIPO_COBRANCA_LABELS[contrato.tipoCobranca] ?? contrato.tipoCobranca;
  const papelLabel = PAPEL_CONTRATUAL_LABELS[contrato.papelClienteNoContrato] ?? contrato.papelClienteNoContrato;
  const diasNoEstagio = diffDaysFromNow(contrato.cadastradoEm) ?? 0;

  return (
    <>
      {/* Back button — discreto, fora do hero */}
      <button
        type="button"
        onClick={() => router.push('/app/contratos')}
        className="inline-flex items-center gap-1.5 self-start px-2 py-1 -ml-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para contratos
      </button>

      <GlassPanel depth={1} className="flex flex-col p-0 overflow-hidden">
        {/* ── Header: título + status + more ─────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4 mb-1.5">
            <h2 className="flex-1 min-w-0 text-[16px] font-semibold leading-[1.3] -tracking-[0.01em] text-foreground flex items-center gap-1.5 flex-wrap">
              <span className="min-w-0 truncate">{clienteNome}</span>
              {parteContraria && (
                <>
                  <span className="mx-1 text-muted-foreground/70 font-medium">×</span>
                  <span className="min-w-0 truncate">{parteContraria.nome}</span>
                </>
              )}
            </h2>

            <SemanticBadge
              category="status_contrato"
              value={contrato.status}
              className="shrink-0 text-[10.5px]"
            >
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </SemanticBadge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais opções"
                  className="shrink-0 inline-flex items-center justify-center size-7 rounded-lg text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/app/clientes/${contrato.clienteId}`}>Ver cliente</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Excluir contrato
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-muted-foreground">
            <span>Contrato #{contrato.id}</span>
            <MetaDot />
            <span>{tipoLabel}</span>
            {segmentoNome && (
              <>
                <MetaDot />
                <span>{segmentoNome}</span>
              </>
            )}
            {parteContraria && parteContraria.total > 1 && (
              <>
                <MetaDot />
                <span>
                  e mais {parteContraria.total - 1} ré{parteContraria.total > 2 ? 's' : ''}
                </span>
              </>
            )}
            <MetaDot />
            <span>
              Cadastrado em {formatDate(contrato.cadastradoEm)} · {diasNoEstagio}d no estágio
            </span>
          </div>
        </div>

        {/* ── Bloco destacado (primary/5) ────────────────────────── */}
        <div className="mx-6 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
          <div className="mb-3.5">
            <div className="text-[14.5px] font-semibold text-foreground leading-tight">
              {cobrancaLabel} · {papelLabel}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-0.5">
              Tipo: {tipoLabel}
              {segmentoNome ? ` · Segmento ${segmentoNome}` : ''}
            </div>
          </div>

          {/* Campos principais (pills) */}
          <div className="flex flex-wrap gap-x-7 gap-y-3 pb-3.5 mb-3.5 border-b border-border/40">
            <HeroField
              label="Tipo de contrato"
              icon={FileText}
              value={tipoLabel}
            />
            <HeroField
              label="Responsável"
              icon={User}
              value={responsavel?.nome ?? 'Sem responsável'}
              muted={!responsavel?.nome}
            />
            <HeroField
              label="Processos"
              icon={Scale}
              value={`${totalProcessos} vinculado${totalProcessos !== 1 ? 's' : ''}`}
            />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5">
            {onEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={onEdit}
                className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium gap-1.5"
              >
                <Edit className="size-3" />
                Editar contrato
              </Button>
            )}
            {onGerarPeca && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGerarPeca}
                className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium gap-1.5"
              >
                <FileSignature className="size-3" />
                Gerar peça
              </Button>
            )}
            {onEnviarAssinatura && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEnviarAssinatura}
                className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium gap-1.5"
              >
                <Send className="size-3" />
                Enviar para assinar
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabs inline no rodapé do hero ──────────────────────── */}
        {tabs ? (
          <div className="mt-4 px-6 py-3 border-t border-border/40">
            {tabs}
          </div>
        ) : (
          <div className="h-5" aria-hidden="true" />
        )}
      </GlassPanel>

      <ContratoDeleteDialog
        contratoId={contrato.id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push('/app/contratos')}
      />
    </>
  );
}

// ─── HeroField (pill no bloco primary) ───────────────────────────────────────

interface HeroFieldProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  muted?: boolean;
}

function HeroField({ label, icon: Icon, value, muted }: HeroFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[9.5px] font-semibold text-muted-foreground/75 uppercase tracking-[0.08em]">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full bg-card border border-border/60 text-[12.5px] font-medium text-foreground max-w-full">
        <Icon className={cn('size-3.5 shrink-0', muted ? 'text-muted-foreground' : 'text-primary')} />
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}
