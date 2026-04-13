'use client';

import { FileText } from 'lucide-react';

import { WidgetContainer } from '@/components/shared/glass-panel';
import type {
  TipoCobranca,
  PapelContratual,
} from '@/app/(authenticated)/contratos';
import {
  TIPO_COBRANCA_LABELS,
  PAPEL_CONTRATUAL_LABELS,
} from '@/app/(authenticated)/contratos';
import type { SegmentoDetalhado, ClienteDetalhado } from '@/app/(authenticated)/contratos';

interface ContratoDetalhesCardProps {
  tipoCobranca: TipoCobranca;
  papelClienteNoContrato: PapelContratual;
  segmento: SegmentoDetalhado | null;
  cliente: ClienteDetalhado | null;
}

function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm">{value || '-'}</p>
    </div>
  );
}

export function ContratoDetalhesCard({
  tipoCobranca,
  papelClienteNoContrato,
  segmento,
  cliente,
}: ContratoDetalhesCardProps) {
  const tipoCobrancaLabel = TIPO_COBRANCA_LABELS[tipoCobranca] || tipoCobranca;
  const papelLabel = PAPEL_CONTRATUAL_LABELS[papelClienteNoContrato] || papelClienteNoContrato;

  return (
    <WidgetContainer title="Detalhes do Contrato" icon={FileText}>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <DataField label="Tipo de Cobrança" value={tipoCobrancaLabel} />
        <DataField label="Papel do Cliente" value={papelLabel} />
        <DataField label="Segmento" value={segmento?.nome} />
        <DataField
          label={cliente?.tipoPessoa === 'pj' ? 'CNPJ' : 'CPF'}
          value={cliente?.cpfCnpj}
        />
      </div>
    </WidgetContainer>
  );
}
