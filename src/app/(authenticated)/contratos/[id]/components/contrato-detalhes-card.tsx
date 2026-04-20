'use client';

import { FileText } from 'lucide-react';

import { DetailSection, DetailSectionCard } from '@/components/shared/detail-section';
import type {
  TipoCobranca,
  PapelContratual,
  SegmentoDetalhado,
  ClienteDetalhado,
} from '@/app/(authenticated)/contratos';
import {
  TIPO_COBRANCA_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from '@/app/(authenticated)/contratos';

interface ContratoDetalhesCardProps {
  tipoCobranca: TipoCobranca;
  papelClienteNoContrato: PapelContratual;
  segmento: SegmentoDetalhado | null;
  cliente: ClienteDetalhado | null;
  cadastradoEm?: string | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '—';
  }
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className="text-[13px] text-foreground font-medium tabular-nums">
        {value || '—'}
      </span>
    </div>
  );
}

export function ContratoDetalhesCard({
  tipoCobranca,
  papelClienteNoContrato,
  segmento,
  cliente,
  cadastradoEm,
}: ContratoDetalhesCardProps) {
  const tipoCobrancaLabel = TIPO_COBRANCA_LABELS[tipoCobranca] ?? tipoCobranca;
  const papelLabel = PAPEL_CONTRATUAL_LABELS[papelClienteNoContrato] ?? papelClienteNoContrato;

  return (
    <DetailSection icon={FileText} label="Dados do contrato">
      <DetailSectionCard>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Field label="Cobrança" value={tipoCobrancaLabel} />
          <Field label="Papel do cliente" value={papelLabel} />
          <Field label="Segmento" value={segmento?.nome ?? null} />
          <Field
            label={cliente?.tipoPessoa === 'pj' ? 'CNPJ' : 'CPF'}
            value={cliente?.cpfCnpj ?? null}
          />
          <Field label="Cadastrado em" value={formatDate(cadastradoEm)} />
        </div>
      </DetailSectionCard>
    </DetailSection>
  );
}
