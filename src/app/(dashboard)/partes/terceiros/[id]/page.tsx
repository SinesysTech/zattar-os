'use client';

/**
 * Página de visualização de terceiro individual
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
} from '@/app/_lib/utils/format-clientes';
import { formatarCep } from '@/core/app/_lib/types';
import { getTipoParteLabel, getPoloLabel } from '@/core/app/_lib/types/terceiros';
import type { Terceiro } from '@/core/app/_lib/types';
import type { Endereco } from '@/backend/types/partes/enderecos-types';

// Extend Terceiro to include all optional fields from database
type TerceiroCompleto = Terceiro & {
  endereco?: Endereco | null;
  // Campos de identificação PJE
  id_pje?: number | null;
  id_pessoa_pje?: number | null;
  id_tipo_parte?: number | null;
  tipo_documento?: string | null;
  // Campos de processo
  principal?: boolean | null;
  ordem?: number | null;
  endereco_desconhecido?: boolean | null;
  // Campos PF adicionais
  rg?: string | null;
  genero?: string | null;
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
  inscricao_estadual?: string | null;
  // Campos de contato adicionais
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  // Campos de sistema/IDs
  login_pje?: string | null;
  autoridade?: boolean | null;
  ultima_atualizacao_pje?: string | null;
  endereco_id?: number | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
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

export default function TerceiroPage() {
  const params = useParams();
  const router = useRouter();
  const terceiroId = params.id as string;

  const [terceiro, setTerceiro] = React.useState<TerceiroCompleto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchTerceiro() {
      try {
        const response = await fetch(`/api/partes/terceiros/${terceiroId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar terceiro');
        }
        const data = await response.json();
        if (data.success) {
          setTerceiro(data.data);
        } else {
          throw new Error(data.error || 'Erro ao carregar terceiro');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTerceiro();
  }, [terceiroId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !terceiro) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Terceiro não encontrado'}</p>
        <Button onClick={() => router.push('/partes?tab=terceiros')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Terceiros
        </Button>
      </div>
    );
  }

  const isPessoaFisica = terceiro.tipo_pessoa === 'pf';

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/partes?tab=terceiros')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatarNome(terceiro.nome)}
              </h1>
              <Badge variant="outline" tone="neutral">
                {formatarTipoPessoa(terceiro.tipo_pessoa)}
              </Badge>
              {terceiro.tipo_parte && (
                <Badge variant="outline" tone="info">
                  {getTipoParteLabel(terceiro.tipo_parte)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Visualização detalhada do terceiro
            </p>
          </div>
        </div>
        <Button>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Terceiro
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-4xl">
          {/* Informações do Processo */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações do Processo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo label="Tipo de Parte" value={terceiro.tipo_parte ? getTipoParteLabel(terceiro.tipo_parte) : null} />
              <Campo label="Polo Processual" value={terceiro.polo ? getPoloLabel(terceiro.polo) : null} />
              <CampoBooleano label="Parte Principal" value={terceiro.principal} />
              <Campo label="Ordem" value={terceiro.ordem} />
              <CampoBooleano label="Endereço Desconhecido" value={terceiro.endereco_desconhecido} />
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo
                label={isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                value={formatarNome(terceiro.nome)}
              />
              <Campo
                label={isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                value={terceiro.nome_fantasia}
              />
              {isPessoaFisica ? (
                <>
                  <Campo label="CPF" value={terceiro.cpf ? formatarCpf(terceiro.cpf) : null} />
                  <Campo label="RG" value={terceiro.rg} />
                  <Campo label="Data de Nascimento" value={terceiro.data_nascimento ? formatarData(terceiro.data_nascimento) : null} />
                  <Campo label="Sexo" value={terceiro.sexo?.replace('_', ' ')} />
                  <Campo label="Gênero" value={terceiro.genero?.replace('_', ' ')} />
                  <Campo label="Estado Civil" value={terceiro.estado_civil?.replace('_', ' ')} />
                  <Campo label="Nacionalidade" value={terceiro.nacionalidade} />
                  <Campo label="Nome da Genitora" value={terceiro.nome_genitora} />
                  <Campo
                    label="Naturalidade"
                    value={terceiro.naturalidade_municipio ?
                      `${terceiro.naturalidade_municipio}${terceiro.naturalidade_estado_sigla ? ` - ${terceiro.naturalidade_estado_sigla}` : ''}`
                      : null
                    }
                  />
                  <Campo
                    label="UF de Nascimento"
                    value={terceiro.uf_nascimento_descricao || terceiro.uf_nascimento_sigla}
                  />
                  <Campo label="País de Nascimento" value={terceiro.pais_nascimento_descricao} />
                  <Campo label="Escolaridade" value={terceiro.escolaridade_codigo?.toString()} />
                  <Campo label="Situação CPF na Receita" value={terceiro.situacao_cpf_receita_descricao} />
                  <CampoBooleano label="Pode usar celular para mensagens" value={terceiro.pode_usar_celular_mensagem} />
                </>
              ) : (
                <>
                  <Campo label="CNPJ" value={terceiro.cnpj ? formatarCnpj(terceiro.cnpj) : null} />
                  <Campo label="Inscrição Estadual" value={terceiro.inscricao_estadual} />
                  <Campo label="Data de Abertura" value={terceiro.data_abertura ? formatarData(terceiro.data_abertura) : null} />
                  <Campo label="Data Fim Atividade" value={terceiro.data_fim_atividade ? formatarData(terceiro.data_fim_atividade) : null} />
                  <Campo label="Ramo de Atividade" value={terceiro.ramo_atividade} />
                  <Campo label="Porte" value={terceiro.porte_descricao} />
                  <Campo label="CPF do Responsável" value={terceiro.cpf_responsavel ? formatarCpf(terceiro.cpf_responsavel) : null} />
                  <Campo label="Tipo de Pessoa (PJE)" value={terceiro.tipo_pessoa_label_pje || terceiro.ds_tipo_pessoa} />
                  <Campo label="Situação CNPJ na Receita" value={terceiro.situacao_cnpj_receita_descricao} />
                  <CampoBooleano label="Órgão Público" value={terceiro.orgao_publico} />
                  <CampoBooleano label="Oficial" value={terceiro.oficial} />
                  <Campo label="Prazo Expediente Automático" value={terceiro.ds_prazo_expediente_automatico} />
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {terceiro.emails && terceiro.emails.length > 0 && (
                <Campo
                  label={`E-mail${terceiro.emails.length > 1 ? 's' : ''}`}
                  value={terceiro.emails.join(', ')}
                />
              )}
              {terceiro.ddd_residencial && terceiro.numero_residencial && (
                <Campo
                  label="Telefone Residencial"
                  value={formatarTelefone(`${terceiro.ddd_residencial}${terceiro.numero_residencial}`)}
                />
              )}
              {terceiro.ddd_celular && terceiro.numero_celular && (
                <Campo
                  label="Celular"
                  value={formatarTelefone(`${terceiro.ddd_celular}${terceiro.numero_celular}`)}
                />
              )}
              {terceiro.ddd_comercial && terceiro.numero_comercial && (
                <Campo
                  label="Telefone Comercial"
                  value={formatarTelefone(`${terceiro.ddd_comercial}${terceiro.numero_comercial}`)}
                />
              )}
            </div>
          </div>

          {/* Endereço */}
          {terceiro.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Campo
                  label="Logradouro"
                  value={terceiro.endereco.logradouro ?
                    `${terceiro.endereco.logradouro}${terceiro.endereco.numero ? `, ${terceiro.endereco.numero}` : ''}`
                    : null
                  }
                />
                <Campo label="Complemento" value={terceiro.endereco.complemento} />
                <Campo label="Bairro" value={terceiro.endereco.bairro} />
                <Campo
                  label="Município"
                  value={terceiro.endereco.municipio ?
                    `${terceiro.endereco.municipio}${terceiro.endereco.estado_sigla ? ` - ${terceiro.endereco.estado_sigla}` : ''}`
                    : null
                  }
                />
                <Campo label="CEP" value={terceiro.endereco.cep ? formatarCep(terceiro.endereco.cep) : null} />
                <Campo label="País" value={terceiro.endereco.pais} />
              </div>
            </div>
          )}

          {/* Observações */}
          {terceiro.observacoes && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Observações</h2>
              <div className="text-base whitespace-pre-wrap">
                {terceiro.observacoes}
              </div>
            </div>
          )}

          {/* Identificadores e Metadados */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Identificadores e Metadados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="ID" value={terceiro.id} />
              <Campo label="ID PJE" value={terceiro.id_pje} />
              <Campo label="ID Pessoa PJE" value={terceiro.id_pessoa_pje} />
              <Campo label="ID Tipo Parte PJE" value={terceiro.id_tipo_parte} />
              <Campo label="Login PJE" value={terceiro.login_pje} />
              <CampoBooleano label="Autoridade" value={terceiro.autoridade} />
              <CampoBooleano label="Ativo" value={terceiro.ativo} />
              <Campo label="Tipo Documento" value={terceiro.tipo_documento} />
              <Campo label="Endereço ID" value={terceiro.endereco_id} />
              <Campo label="Data de Criação" value={formatarData(terceiro.created_at)} />
              <Campo label="Última Atualização" value={formatarData(terceiro.updated_at)} />
              <Campo label="Última Atualização PJE" value={terceiro.ultima_atualizacao_pje ? formatarData(terceiro.ultima_atualizacao_pje) : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
