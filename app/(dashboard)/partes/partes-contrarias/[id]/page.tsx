'use client';

/**
 * Página de visualização de parte contrária individual
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarData,
  formatarNome,
  formatarTipoPessoa,
} from '@/app/_lib/utils/format-clientes';
import { formatarCep } from '@/app/_lib/types';
import type { ParteContraria } from '@/app/_lib/types';
import type { Endereco } from '@/backend/types/partes/enderecos-types';

// Extend ParteContraria to include optional endereco
type ParteContrariaComEndereco = ParteContraria & {
  endereco?: Endereco | null;
};

export default function ParteContrariaPage() {
  const params = useParams();
  const router = useRouter();
  const parteId = params.id as string;

  const [parte, setParte] = React.useState<ParteContrariaComEndereco | null>(null);
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
              {parte.situacao_pje && (
                <Badge
                  tone={parte.situacao_pje === 'A' ? 'success' : 'neutral'}
                  variant={parte.situacao_pje === 'A' ? 'soft' : 'outline'}
                >
                  {parte.situacao_pje === 'A' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
              <Badge variant="outline" tone="neutral">
                {formatarTipoPessoa(parte.tipo_pessoa)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Visualização detalhada da parte contrária
            </p>
          </div>
        </div>
        <Button disabled>
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
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                </div>
                <div className="text-base">{formatarNome(parte.nome)}</div>
              </div>
              {parte.nome_social_fantasia && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                  </div>
                  <div className="text-base">{parte.nome_social_fantasia}</div>
                </div>
              )}
              {isPessoaFisica ? (
                <>
                  {parte.cpf && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CPF
                      </div>
                      <div className="text-base">{formatarCpf(parte.cpf)}</div>
                    </div>
                  )}
                  {parte.rg && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        RG
                      </div>
                      <div className="text-base">{parte.rg}</div>
                    </div>
                  )}
                  {parte.data_nascimento && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Data de Nascimento
                      </div>
                      <div className="text-base">
                        {formatarData(parte.data_nascimento)}
                      </div>
                    </div>
                  )}
                  {parte.sexo && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Sexo
                      </div>
                      <div className="text-base capitalize">
                        {parte.sexo.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {parte.estado_civil && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Estado Civil
                      </div>
                      <div className="text-base capitalize">
                        {parte.estado_civil.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {parte.nacionalidade && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Nacionalidade
                      </div>
                      <div className="text-base">{parte.nacionalidade}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {parte.cnpj && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CNPJ
                      </div>
                      <div className="text-base">
                        {formatarCnpj(parte.cnpj)}
                      </div>
                    </div>
                  )}
                  {parte.inscricao_estadual && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Inscrição Estadual
                      </div>
                      <div className="text-base">
                        {parte.inscricao_estadual}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parte.emails && parte.emails.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail{parte.emails.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-base">
                    {parte.emails.join(', ')}
                  </div>
                </div>
              )}
              {parte.ddd_residencial && parte.numero_residencial && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${parte.ddd_residencial}${parte.numero_residencial}`)}
                  </div>
                </div>
              )}
              {parte.ddd_celular && parte.numero_celular && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Celular
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${parte.ddd_celular}${parte.numero_celular}`)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          {parte.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parte.endereco.logradouro && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Logradouro
                    </div>
                    <div className="text-base">
                      {parte.endereco.logradouro}
                      {parte.endereco.numero && `, ${parte.endereco.numero}`}
                    </div>
                  </div>
                )}
                {parte.endereco.complemento && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Complemento
                    </div>
                    <div className="text-base">{parte.endereco.complemento}</div>
                  </div>
                )}
                {parte.endereco.bairro && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Bairro
                    </div>
                    <div className="text-base">{parte.endereco.bairro}</div>
                  </div>
                )}
                {parte.endereco.municipio && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Município
                    </div>
                    <div className="text-base">
                      {parte.endereco.municipio}
                      {parte.endereco.estado_sigla && ` - ${parte.endereco.estado_sigla}`}
                    </div>
                  </div>
                )}
                {parte.endereco.cep && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      CEP
                    </div>
                    <div className="text-base">{formatarCep(parte.endereco.cep)}</div>
                  </div>
                )}
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

          {/* Informações do Sistema */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Criação
                </div>
                <div className="text-base">
                  {formatarData(parte.created_at)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Última Atualização
                </div>
                <div className="text-base">
                  {formatarData(parte.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
