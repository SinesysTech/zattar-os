'use client';

/**
 * ContratoDetalhesHeader — Hero do detalhe de contrato.
 * ============================================================================
 * Aderente ao Glass Briefing: GlassPanel depth 2 único (sem bloco aninhado),
 * tipografia via Heading/Text, stat row horizontal minimalista e uma única
 * ação primária visível (Editar), com demais ações concentradas no menu ⋮.
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  FileSignature,
  Send,
  Trash2,
  User as UserIcon,
  Scale,
  MoreHorizontal,
  FileText,
  Tag,
  ShieldCheck,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
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
      className="inline-block size-1 rounded-full bg-muted-foreground/40"
    />
  );
}

// ─── HeroStatField ───────────────────────────────────────────────────────────

interface HeroStatFieldProps {
  label: string;
  icon: LucideIcon;
  value: string;
  muted?: boolean;
}

function HeroStatField({ label, icon: Icon, value, muted }: HeroStatFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <Text variant="meta-label" className="text-muted-foreground/70">
        {label}
      </Text>
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={cn(
            'size-3.5 shrink-0',
            muted ? 'text-muted-foreground/50' : 'text-primary/70',
          )}
          aria-hidden="true"
        />
        <Text
          variant="label"
          className={cn(
            'truncate',
            muted && 'text-muted-foreground font-normal',
          )}
        >
          {value}
        </Text>
      </div>
    </div>
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
      {/* Back link — discreto, fora do hero */}
      <button
        type="button"
        onClick={() => router.push('/app/contratos')}
        className="inline-flex items-center gap-1.5 self-start -ml-1 px-2 py-1 rounded-lg text-caption font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para contratos
      </button>

      <GlassPanel depth={2} className="p-6 gap-5">
        {/* ── Linha 1: identidade + ações ────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Heading
                level="section"
                className="min-w-0 truncate flex items-center gap-2 flex-wrap"
              >
                <span className="min-w-0 truncate">{clienteNome}</span>
                {parteContraria && (
                  <>
                    <span aria-hidden="true" className="text-muted-foreground/50 font-normal">
                      ×
                    </span>
                    <span className="min-w-0 truncate">{parteContraria.nome}</span>
                  </>
                )}
              </Heading>
              <SemanticBadge
                category="status_contrato"
                value={contrato.status}
                className="shrink-0"
              >
                {STATUS_CONTRATO_LABELS[contrato.status]}
              </SemanticBadge>
            </div>

            {/* Meta line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Text variant="caption">Contrato #{contrato.id}</Text>
              <MetaDot />
              <Text variant="caption">{tipoLabel}</Text>
              {segmentoNome && (
                <>
                  <MetaDot />
                  <Text variant="caption">{segmentoNome}</Text>
                </>
              )}
              {parteContraria && parteContraria.total > 1 && (
                <>
                  <MetaDot />
                  <Text variant="caption">
                    +{parteContraria.total - 1} ré{parteContraria.total > 2 ? 's' : ''}
                  </Text>
                </>
              )}
              <MetaDot />
              <Text variant="caption">
                Cadastrado em {formatDate(contrato.cadastradoEm)}
              </Text>
              <MetaDot />
              <Text variant="caption" className="tabular-nums">
                {diasNoEstagio}d no estágio
              </Text>
            </div>
          </div>

          {/* Ações no canto direito */}
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <Button
                size="sm"
                className="rounded-xl"
                onClick={onEdit}
              >
                <Edit className="size-3.5" />
                Editar
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl size-8"
                  aria-label="Mais opções"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                {onGerarPeca && (
                  <DropdownMenuItem onSelect={onGerarPeca}>
                    <FileSignature className="size-3.5 mr-2" />
                    Gerar peça
                  </DropdownMenuItem>
                )}
                {onEnviarAssinatura && (
                  <DropdownMenuItem onSelect={onEnviarAssinatura}>
                    <Send className="size-3.5 mr-2" />
                    Enviar para assinar
                  </DropdownMenuItem>
                )}
                {(onGerarPeca || onEnviarAssinatura) && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild>
                  <Link href={`/app/clientes/${contrato.clienteId}`}>
                    <UserIcon className="size-3.5 mr-2" />
                    Ver cliente
                  </Link>
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
        </div>

        {/* ── Divisor sutil ──────────────────────────────────────── */}
        <div className="h-px bg-border/30" aria-hidden="true" />

        {/* ── Stat row: 6 campos horizontais ────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
          <HeroStatField
            label="Tipo"
            icon={FileText}
            value={tipoLabel}
          />
          <HeroStatField
            label="Papel"
            icon={ShieldCheck}
            value={papelLabel}
          />
          <HeroStatField
            label="Cobrança"
            icon={Briefcase}
            value={cobrancaLabel}
          />
          <HeroStatField
            label="Segmento"
            icon={Tag}
            value={segmentoNome ?? '—'}
            muted={!segmentoNome}
          />
          <HeroStatField
            label="Responsável"
            icon={UserIcon}
            value={responsavel?.nome ?? 'Sem responsável'}
            muted={!responsavel?.nome}
          />
          <HeroStatField
            label="Processos"
            icon={Scale}
            value={`${totalProcessos} vinculado${totalProcessos !== 1 ? 's' : ''}`}
            muted={totalProcessos === 0}
          />
        </div>
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
