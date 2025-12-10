'use client';

/**
 * Página de visualização de cliente individual
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
import type { Cliente } from '@/core/app/_lib/types';
import type { Endereco } from '@/backend/types/partes/enderecos-types';

// Extend Cliente to include all optional fields from database
type ClienteCompleto = Cliente & {
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

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.id as string;

  const [cliente, setCliente] = React.useState<ClienteCompleto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchCliente() {
      try {
        const response = await fetch(`/api/clientes/${clienteId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar cliente');
        }
        const data = await response.json();
        if (data.success) {
          setCliente(data.data);
        } else {
          throw new Error(data.error || 'Erro ao carregar cliente');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCliente();
  }, [clienteId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Cliente não encontrado'}</p>
        <Button onClick={() => router.push('/partes?tab=clientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  const isPessoaFisica = cliente.tipo_pessoa === 'pf';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/partes?tab=clientes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatarNome(cliente.nome)}
              </h1>
              <Badge variant="outline" tone="neutral">
                {formatarTipoPessoa(cliente.tipo_pessoa)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Visualização detalhada do cliente
            </p>
          </div>
        </div>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Cliente
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
                value={formatarNome(cliente.nome)}
              />
              <Campo
                label={isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                value={cliente.nome_social_fantasia}
              />
              {isPessoaFisica ? (
                <>
                  <Campo label="CPF" value={cliente.cpf ? formatarCpf(cliente.cpf) : null} />
                  <Campo label="RG" value={cliente.rg} />
                  <Campo label="Data de Nascimento" value={cliente.data_nascimento ? formatarData(cliente.data_nascimento) : null} />
                  <Campo label="Sexo" value={cliente.sexo?.replace('_', ' ')} />
                  <Campo label="Estado Civil" value={cliente.estado_civil?.replace('_', ' ')} />
                  <Campo label="Nacionalidade" value={cliente.nacionalidade} />
                  <Campo label="Nome da Genitora" value={cliente.nome_genitora} />
                  <Campo
                    label="Naturalidade"
                    value={cliente.naturalidade_municipio ?
                      `${cliente.naturalidade_municipio}${cliente.naturalidade_estado_sigla ? ` - ${cliente.naturalidade_estado_sigla}` : ''}`
                      : null
                    }
                  />
                  <Campo
                    label="UF de Nascimento"
                    value={cliente.uf_nascimento_descricao || cliente.uf_nascimento_sigla}
                  />
                  <Campo label="País de Nascimento" value={cliente.pais_nascimento_descricao} />
                  <Campo label="Escolaridade" value={cliente.escolaridade_codigo?.toString()} />
                  <Campo label="Situação CPF na Receita" value={cliente.situacao_cpf_receita_descricao} />
                  <CampoBooleano label="Pode usar celular para mensagens" value={cliente.pode_usar_celular_mensagem} />
                </>
              ) : (
                <>
                  <Campo label="CNPJ" value={cliente.cnpj ? formatarCnpj(cliente.cnpj) : null} />
                  <Campo label="Inscrição Estadual" value={cliente.inscricao_estadual} />
                  <Campo label="Data de Abertura" value={cliente.data_abertura ? formatarData(cliente.data_abertura) : null} />
                  <Campo label="Data Fim Atividade" value={cliente.data_fim_atividade ? formatarData(cliente.data_fim_atividade) : null} />
                  <Campo label="Ramo de Atividade" value={cliente.ramo_atividade} />
                  <Campo label="Porte" value={cliente.porte_descricao} />
                  <Campo label="CPF do Responsável" value={cliente.cpf_responsavel ? formatarCpf(cliente.cpf_responsavel) : null} />
                  <Campo label="Tipo de Pessoa (PJE)" value={cliente.tipo_pessoa_label_pje || cliente.ds_tipo_pessoa} />
                  <Campo label="Situação CNPJ na Receita" value={cliente.situacao_cnpj_receita_descricao} />
                  <CampoBooleano label="Órgão Público" value={cliente.orgao_publico} />
                  <CampoBooleano label="Oficial" value={cliente.oficial} />
                  <Campo label="Prazo Expediente Automático" value={cliente.ds_prazo_expediente_automatico} />
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cliente.emails && cliente.emails.length > 0 && (
                <Campo
                  label={`E-mail${cliente.emails.length > 1 ? 's' : ''}`}
                  value={cliente.emails.join(', ')}
                />
              )}
              {cliente.ddd_residencial && cliente.numero_residencial && (
                <Campo
                  label="Telefone Residencial"
                  value={formatarTelefone(`${cliente.ddd_residencial}${cliente.numero_residencial}`)}
                />
              )}
              {cliente.ddd_celular && cliente.numero_celular && (
                <Campo
                  label="Celular"
                  value={formatarTelefone(`${cliente.ddd_celular}${cliente.numero_celular}`)}
                />
              )}
              {cliente.ddd_comercial && cliente.numero_comercial && (
                <Campo
                  label="Telefone Comercial"
                  value={formatarTelefone(`${cliente.ddd_comercial}${cliente.numero_comercial}`)}
                />
              )}
            </div>
          </div>

          {/* Endereço */}
          {cliente.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Campo
                  label="Logradouro"
                  value={cliente.endereco.logradouro ?
                    `${cliente.endereco.logradouro}${cliente.endereco.numero ? `, ${cliente.endereco.numero}` : ''}`
                    : null
                  }
                />
                <Campo label="Complemento" value={cliente.endereco.complemento} />
                <Campo label="Bairro" value={cliente.endereco.bairro} />
                <Campo
                  label="Município"
                  value={cliente.endereco.municipio ?
                    `${cliente.endereco.municipio}${cliente.endereco.estado_sigla ? ` - ${cliente.endereco.estado_sigla}` : ''}`
                    : null
                  }
                />
                <Campo label="CEP" value={cliente.endereco.cep ? formatarCep(cliente.endereco.cep) : null} />
                <Campo label="País" value={cliente.endereco.pais} />
              </div>
            </div>
          )}

          {/* Observações */}
          {cliente.observacoes && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Observações</h2>
              <div className="text-base whitespace-pre-wrap">
                {cliente.observacoes}
              </div>
            </div>
          )}

          {/* Identificadores e Metadados */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Identificadores e Metadados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="ID" value={cliente.id} />
              <Campo label="ID Pessoa PJE" value={cliente.id_pessoa_pje} />
              <Campo label="Login PJE" value={cliente.login_pje} />
              <CampoBooleano label="Autoridade" value={cliente.autoridade} />
              <Campo label="Endereço ID" value={cliente.endereco_id} />
              <Campo label="Criado por (ID)" value={cliente.created_by} />
              <Campo label="Data de Criação" value={formatarData(cliente.created_at)} />
              <Campo label="Última Atualização" value={formatarData(cliente.updated_at)} />
              <Campo label="Última Atualização PJE" value={cliente.ultima_atualizacao_pje ? formatarData(cliente.ultima_atualizacao_pje) : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
