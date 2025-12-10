'use client';

/**
 * Página de visualização de parte contrária individual
 * Exibe todos os campos do registro organizados em seções
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarData,
  formatarNome,
  formatarTipoPessoa,
} from '@/core/app/_lib/utils/format-clientes';
import { formatarCep } from '@/core/app/_lib/types';
import type { ParteContraria } from '@/core/app/_lib/types';
import type { Endereco } from '@/backend/types/partes/enderecos-types';

// Extend ParteContraria to include all optional fields from database
type ParteContrariaCompleta = ParteContraria & {
  endereco?: Endereco | null;
  // Campos PF adicionais
  nome_genitora?: string | null;
  uf_nascimento_id_pje?: number | null;
  uf_nascimento_sigla?: string | null;
  uf_nascimento_descricao?: string | null;
  naturalidade_id_pje?: number | null;
  naturalidade_municipio?: string | null;
  naturalidade_estado_id_pje?: number | null;
  naturalidade_estado_sigla?: string | null;
  pais_nascimento_id_pje?: number | null;
  pais_nascimento_codigo?: string | null;
  pais_nascimento_descricao?: string | null;
  escolaridade_codigo?: number | null;
  situacao_cpf_receita_id?: number | null;
  situacao_cpf_receita_descricao?: string | null;
  pode_usar_celular_mensagem?: boolean | null;
  // Campos PJ adicionais
  data_abertura?: string | null;
  data_fim_atividade?: string | null;
  orgao_publico?: boolean | null;
  tipo_pessoa_codigo_pje?: string | null;
  tipo_pessoa_label_pje?: string | null;
  tipo_pessoa_validacao_receita?: string | null;
  ds_tipo_pessoa?: string | null;
  situacao_cnpj_receita_id?: number | null;
  situacao_cnpj_receita_descricao?: string | null;
  ramo_atividade?: string | null;
  cpf_responsavel?: string | null;
  oficial?: boolean | null;
  ds_prazo_expediente_automatico?: string | null;
  porte_codigo?: number | null;
  porte_descricao?: string | null;
  // Campos de contato adicionais
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  // Campos de sistema/IDs
  id_pessoa_pje?: number | null;
  login_pje?: string | null;
  autoridade?: boolean | null;
  ultima_atualizacao_pje?: string | null;
  endereco_id?: number | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
  tipo_documento?: string | null;
  genero?: string | null;
  ativo?: boolean | null;
  dados_anteriores?: unknown | null;
};

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

export default function ParteContrariaPage() {
  const params = useParams();
  const router = useRouter();
  const parteId = params.id as string;

  const [parte, setParte] = React.useState<ParteContrariaCompleta | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchParte() {
      try {
        const response = await fetch(`/api/partes-contrarias/${parteId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar parte contrária');
        }
        const data = await response.json();
        if (data.success) {
          setParte(data.data);
        } else {
          throw new Error(data.error || 'Erro ao carregar parte contrária');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchParte();
  }, [parteId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !parte) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Parte contrária não encontrada'}</p>
        <Button onClick={() => router.push('/partes?tab=partes-contrarias')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Partes Contrárias
        </Button>
      </div>
    );
  }

  const isPessoaFisica = parte.tipo_pessoa === 'pf';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/partes?tab=partes-contrarias')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatarNome(parte.nome)}
              </h1>
              <Badge variant="outline" tone="neutral">
                {formatarTipoPessoa(parte.tipo_pessoa)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Visualização detalhada da parte contrária
            </p>
          </div>
        </div>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Parte Contrária
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-4xl">
          {/* Informações Básicas */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo
                label={isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                value={formatarNome(parte.nome)}
              />
              <Campo
                label={isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                value={parte.nome_social_fantasia}
              />
              {isPessoaFisica ? (
                <>
                  <Campo label="CPF" value={parte.cpf ? formatarCpf(parte.cpf) : null} />
                  <Campo label="RG" value={parte.rg} />
                  <Campo label="Data de Nascimento" value={parte.data_nascimento ? formatarData(parte.data_nascimento) : null} />
                  <Campo label="Sexo" value={parte.sexo?.replace('_', ' ')} />
                  <Campo label="Gênero" value={parte.genero?.replace('_', ' ')} />
                  <Campo label="Estado Civil" value={parte.estado_civil?.replace('_', ' ')} />
                  <Campo label="Nacionalidade" value={parte.nacionalidade} />
                  <Campo label="Nome da Genitora" value={parte.nome_genitora} />
                  <Campo
                    label="Naturalidade"
                    value={parte.naturalidade_municipio ?
                      `${parte.naturalidade_municipio}${parte.naturalidade_estado_sigla ? ` - ${parte.naturalidade_estado_sigla}` : ''}`
                      : null
                    }
                  />
                  <Campo
                    label="UF de Nascimento"
                    value={parte.uf_nascimento_descricao || parte.uf_nascimento_sigla}
                  />
                  <Campo label="País de Nascimento" value={parte.pais_nascimento_descricao} />
                  <Campo label="Escolaridade" value={parte.escolaridade_codigo?.toString()} />
                  <Campo label="Situação CPF na Receita" value={parte.situacao_cpf_receita_descricao} />
                  <CampoBooleano label="Pode usar celular para mensagens" value={parte.pode_usar_celular_mensagem} />
                </>
              ) : (
                <>
                  <Campo label="CNPJ" value={parte.cnpj ? formatarCnpj(parte.cnpj) : null} />
                  <Campo label="Inscrição Estadual" value={parte.inscricao_estadual} />
                  <Campo label="Data de Abertura" value={parte.data_abertura ? formatarData(parte.data_abertura) : null} />
                  <Campo label="Data Fim Atividade" value={parte.data_fim_atividade ? formatarData(parte.data_fim_atividade) : null} />
                  <Campo label="Ramo de Atividade" value={parte.ramo_atividade} />
                  <Campo label="Porte" value={parte.porte_descricao} />
                  <Campo label="CPF do Responsável" value={parte.cpf_responsavel ? formatarCpf(parte.cpf_responsavel) : null} />
                  <Campo label="Tipo de Pessoa (PJE)" value={parte.tipo_pessoa_label_pje || parte.ds_tipo_pessoa} />
                  <Campo label="Situação CNPJ na Receita" value={parte.situacao_cnpj_receita_descricao} />
                  <CampoBooleano label="Órgão Público" value={parte.orgao_publico} />
                  <CampoBooleano label="Oficial" value={parte.oficial} />
                  <Campo label="Prazo Expediente Automático" value={parte.ds_prazo_expediente_automatico} />
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parte.emails && parte.emails.length > 0 && (
                <Campo
                  label={`E-mail${parte.emails.length > 1 ? 's' : ''}`}
                  value={parte.emails.join(', ')}
                />
              )}
              {parte.ddd_residencial && parte.numero_residencial && (
                <Campo
                  label="Telefone Residencial"
                  value={formatarTelefone(`${parte.ddd_residencial}${parte.numero_residencial}`)}
                />
              )}
              {parte.ddd_celular && parte.numero_celular && (
                <Campo
                  label="Celular"
                  value={formatarTelefone(`${parte.ddd_celular}${parte.numero_celular}`)}
                />
              )}
              {parte.ddd_comercial && parte.numero_comercial && (
                <Campo
                  label="Telefone Comercial"
                  value={formatarTelefone(`${parte.ddd_comercial}${parte.numero_comercial}`)}
                />
              )}
            </div>
          </div>

          {/* Endereço */}
          {parte.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Campo
                  label="Logradouro"
                  value={parte.endereco.logradouro ?
                    `${parte.endereco.logradouro}${parte.endereco.numero ? `, ${parte.endereco.numero}` : ''}`
                    : null
                  }
                />
                <Campo label="Complemento" value={parte.endereco.complemento} />
                <Campo label="Bairro" value={parte.endereco.bairro} />
                <Campo
                  label="Município"
                  value={parte.endereco.municipio ?
                    `${parte.endereco.municipio}${parte.endereco.estado_sigla ? ` - ${parte.endereco.estado_sigla}` : ''}`
                    : null
                  }
                />
                <Campo label="CEP" value={parte.endereco.cep ? formatarCep(parte.endereco.cep) : null} />
                <Campo label="País" value={parte.endereco.pais} />
              </div>
            </div>
          )}

          {/* Observações */}
          {parte.observacoes && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Observações</h2>
              <div className="text-base whitespace-pre-wrap">
                {parte.observacoes}
              </div>
            </div>
          )}

          {/* Identificadores e Metadados */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Identificadores e Metadados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="ID" value={parte.id} />
              <Campo label="ID Pessoa PJE" value={parte.id_pessoa_pje} />
              <Campo label="Login PJE" value={parte.login_pje} />
              <CampoBooleano label="Autoridade" value={parte.autoridade} />
              <CampoBooleano label="Ativo" value={parte.ativo} />
              <Campo label="Tipo Documento" value={parte.tipo_documento} />
              <Campo label="Endereço ID" value={parte.endereco_id} />
              <Campo label="Criado por (ID)" value={parte.created_by} />
              <Campo label="Data de Criação" value={formatarData(parte.created_at)} />
              <Campo label="Última Atualização" value={formatarData(parte.updated_at)} />
              <Campo label="Última Atualização PJE" value={parte.ultima_atualizacao_pje ? formatarData(parte.ultima_atualizacao_pje) : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
