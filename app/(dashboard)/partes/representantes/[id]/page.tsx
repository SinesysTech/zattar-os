'use client';

/**
 * Página de visualização de representante individual
 * Exibe todos os campos do registro organizados em seções
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import {
  formatarCpf,
  formatarTelefone,
  formatarData,
  formatarNome,
} from '@/app/_lib/utils/format-clientes';
import { formatarCep } from '@/app/_lib/types';
import type { Representante, RepresentanteComEndereco } from '@/backend/types/representantes/representantes-types';

// Componente auxiliar para exibir campo
function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base">{value}</div>
    </div>
  );
}

// Componente auxiliar para exibir campo booleano
function CampoBooleano({ label, value }: { label: string; value: boolean | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-base">{value ? 'Sim' : 'Não'}</div>
    </div>
  );
}

// Helper para formatar tipo de parte
function formatarTipoParte(parteTipo: string): string {
  switch (parteTipo) {
    case 'cliente':
      return 'Cliente';
    case 'parte_contraria':
      return 'Parte Contrária';
    case 'terceiro':
      return 'Terceiro';
    default:
      return parteTipo;
  }
}

// Helper para formatar situação OAB
function formatarSituacaoOAB(situacao: string | null): string | null {
  if (!situacao) return null;
  switch (situacao) {
    case 'REGULAR':
      return 'Regular';
    case 'SUSPENSO':
      return 'Suspenso';
    case 'CANCELADO':
      return 'Cancelado';
    case 'LICENCIADO':
      return 'Licenciado';
    case 'FALECIDO':
      return 'Falecido';
    default:
      return situacao;
  }
}

// Helper para formatar polo
function formatarPolo(polo: string | null): string | null {
  if (!polo) return null;
  switch (polo) {
    case 'ativo':
      return 'Ativo';
    case 'passivo':
      return 'Passivo';
    case 'outros':
      return 'Outros';
    default:
      return polo;
  }
}

export default function RepresentantePage() {
  const params = useParams();
  const router = useRouter();
  const representanteId = params.id as string;

  const [representante, setRepresentante] = React.useState<RepresentanteComEndereco | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchRepresentante() {
      try {
        const response = await fetch(`/api/representantes/${representanteId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar representante');
        }
        const data = await response.json();
        if (data.success) {
          setRepresentante(data.data);
        } else {
          throw new Error(data.error || 'Erro ao carregar representante');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRepresentante();
  }, [representanteId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !representante) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Representante não encontrado'}</p>
        <Button onClick={() => router.push('/partes?tab=representantes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Representantes
        </Button>
      </div>
    );
  }

  const situacaoOAB = representante.situacao_oab;
  const isRegular = situacaoOAB === 'REGULAR';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/partes?tab=representantes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatarNome(representante.nome)}
              </h1>
              {representante.numero_oab && (
                <Badge variant="outline" tone="info">
                  OAB {representante.numero_oab}
                </Badge>
              )}
              {situacaoOAB && (
                <Badge
                  tone={isRegular ? 'success' : 'neutral'}
                  variant={isRegular ? 'soft' : 'outline'}
                >
                  {formatarSituacaoOAB(situacaoOAB)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Visualização detalhada do representante
            </p>
          </div>
        </div>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Representante
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-4xl">
          {/* Contexto Processual */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contexto Processual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="Número do Processo" value={representante.numero_processo} />
              <Campo label="TRT" value={representante.trt} />
              <Campo label="Grau" value={representante.grau === '1' ? '1º Grau' : '2º Grau'} />
              <Campo label="Tipo de Parte Representada" value={formatarTipoParte(representante.parte_tipo)} />
              <Campo label="Polo" value={formatarPolo(representante.polo)} />
              <CampoBooleano label="Principal" value={representante.principal} />
              <Campo label="Ordem" value={representante.ordem} />
            </div>
          </div>

          {/* Informações do Advogado */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações do Advogado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo label="Nome Completo" value={formatarNome(representante.nome)} />
              <Campo label="CPF" value={representante.cpf ? formatarCpf(representante.cpf) : null} />
              <Campo label="Sexo" value={representante.sexo?.replace('_', ' ')} />
              <Campo label="Tipo" value={representante.tipo} />
              <Campo label="Número OAB" value={representante.numero_oab} />
              <Campo label="Situação OAB" value={formatarSituacaoOAB(representante.situacao_oab)} />
              <Campo label="Situação" value={representante.situacao} />
              <Campo label="Status" value={representante.status} />
              <Campo
                label="Data de Habilitação"
                value={representante.data_habilitacao ? formatarData(representante.data_habilitacao.toString()) : null}
              />
              <CampoBooleano label="Endereço Desconhecido" value={representante.endereco_desconhecido} />
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {representante.emails && representante.emails.length > 0 && (
                <Campo
                  label={`E-mail${representante.emails.length > 1 ? 's' : ''}`}
                  value={representante.emails.join(', ')}
                />
              )}
              {representante.email && (
                <Campo label="E-mail Principal" value={representante.email} />
              )}
              {representante.ddd_residencial && representante.numero_residencial && (
                <Campo
                  label="Telefone Residencial"
                  value={formatarTelefone(`${representante.ddd_residencial}${representante.numero_residencial}`)}
                />
              )}
              {representante.ddd_celular && representante.numero_celular && (
                <Campo
                  label="Celular"
                  value={formatarTelefone(`${representante.ddd_celular}${representante.numero_celular}`)}
                />
              )}
              {representante.ddd_comercial && representante.numero_comercial && (
                <Campo
                  label="Telefone Comercial"
                  value={formatarTelefone(`${representante.ddd_comercial}${representante.numero_comercial}`)}
                />
              )}
            </div>
          </div>

          {/* Endereço */}
          {representante.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Campo
                  label="Logradouro"
                  value={representante.endereco.logradouro ?
                    `${representante.endereco.logradouro}${representante.endereco.numero ? `, ${representante.endereco.numero}` : ''}`
                    : null
                  }
                />
                <Campo label="Complemento" value={representante.endereco.complemento} />
                <Campo label="Bairro" value={representante.endereco.bairro} />
                <Campo
                  label="Município"
                  value={representante.endereco.municipio ?
                    `${representante.endereco.municipio}${representante.endereco.estado_sigla ? ` - ${representante.endereco.estado_sigla}` : ''}`
                    : null
                  }
                />
                <Campo label="CEP" value={representante.endereco.cep ? formatarCep(representante.endereco.cep) : null} />
                <Campo label="País" value={representante.endereco.pais} />
              </div>
            </div>
          )}

          {/* Identificadores e Metadados */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Identificadores e Metadados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="ID" value={representante.id} />
              <Campo label="ID PJE" value={representante.id_pje} />
              <Campo label="ID Pessoa PJE" value={representante.id_pessoa_pje} />
              <Campo label="ID Tipo Parte PJE" value={representante.id_tipo_parte} />
              <Campo label="Parte ID (FK)" value={representante.parte_id} />
              <Campo label="Endereço ID" value={representante.endereco_id} />
              <Campo label="Data de Criação" value={formatarData(representante.created_at.toString())} />
              <Campo label="Última Atualização" value={formatarData(representante.updated_at.toString())} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
