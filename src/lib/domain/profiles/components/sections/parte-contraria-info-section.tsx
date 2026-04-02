'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SemanticBadge, StatusSemanticBadge } from "@/components/ui/semantic-badge";
import { User, Building2 } from "lucide-react";

interface ParteContrariaInfoSectionProps {
  data: Record<string, unknown>;
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === '-') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <p className="text-sm font-medium text-foreground">{String(value)}</p>
    </div>
  );
}

function StatusField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || value === '-') return null;

  // Map situacao receita values to status values for semantic badge
  const mapToStatus = (situacao: string): string => {
    const lower = situacao.toLowerCase();
    if (lower.includes('regular')) return 'ATIVO';
    if (lower.includes('irregular') || lower.includes('cancelad') || lower.includes('suspen')) return 'CANCELADO';
    if (lower.includes('pendente')) return 'PENDENTE';
    return 'ATIVO'; // default
  };

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <StatusSemanticBadge value={mapToStatus(value)}>
        {value}
      </StatusSemanticBadge>
    </div>
  );
}

function BooleanField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value || value === '-') return null;

  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <SemanticBadge
        category="status"
        value={value === 'Sim' ? 'ATIVO' : 'ARQUIVADO'}
      >
        {value}
      </SemanticBadge>
    </div>
  );
}

export function ParteContrariaInfoSection({ data }: ParteContrariaInfoSectionProps) {
  const isPF = data.tipo_pessoa === 'pf';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isPF ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
          {isPF ? 'Dados Pessoais' : 'Dados Empresariais'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isPF ? (
            <>
              <InfoField
                label="Data de Nascimento"
                value={data.data_nascimento_formatada as string}
              />
              <InfoField
                label="Idade"
                value={data.idade_formatada as string}
              />
              <InfoField
                label="Sexo"
                value={data.sexo as string}
              />
              <InfoField
                label="Genero"
                value={data.genero as string}
              />
              <InfoField
                label="Estado Civil"
                value={data.estado_civil as string}
              />
              <InfoField
                label="Nacionalidade"
                value={data.nacionalidade as string}
              />
              <InfoField
                label="Nome da Mae"
                value={data.nome_genitora as string}
              />
              <InfoField
                label="Naturalidade"
                value={data.naturalidade_completa as string}
              />
              <InfoField
                label="Pais de Nascimento"
                value={data.pais_nascimento_descricao as string}
              />
              <InfoField
                label="Escolaridade"
                value={data.escolaridade_codigo as number}
              />
              <StatusField
                label="Situacao CPF"
                value={data.situacao_cpf_receita_descricao as string}
              />
              <BooleanField
                label="Pode receber SMS"
                value={data.pode_usar_celular_mensagem_label as string}
              />
            </>
          ) : (
            <>
              <InfoField
                label="Data de Abertura"
                value={data.data_abertura_formatada as string}
              />
              <InfoField
                label="Fim de Atividade"
                value={data.data_fim_atividade_formatada as string}
              />
              <InfoField
                label="Ramo de Atividade"
                value={data.ramo_atividade as string}
              />
              <InfoField
                label="Porte"
                value={data.porte_descricao as string}
              />
              <BooleanField
                label="Orgao Publico"
                value={data.orgao_publico_label as string}
              />
              <StatusField
                label="Situacao CNPJ"
                value={data.situacao_cnpj_receita_descricao as string}
              />
              <InfoField
                label="CPF Responsavel"
                value={data.cpf_responsavel_formatado as string}
              />
              <InfoField
                label="Inscricao Estadual"
                value={data.inscricao_estadual as string}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
