'use client';

/**
 * Página de visualização de cliente individual
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
import type { Cliente } from '@/app/_lib/types';
import type { Endereco } from '@/backend/types/partes/enderecos-types';

// Extend Cliente to include optional endereco
type ClienteComEndereco = Cliente & {
  endereco?: Endereco | null;
};

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.id as string;

  const [cliente, setCliente] = React.useState<ClienteComEndereco | null>(null);
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
              {cliente.situacao_pje && (
                <Badge
                  tone={cliente.situacao_pje === 'A' ? 'success' : 'neutral'}
                  variant={cliente.situacao_pje === 'A' ? 'soft' : 'outline'}
                >
                  {cliente.situacao_pje === 'A' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
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
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                </div>
                <div className="text-base">{formatarNome(cliente.nome)}</div>
              </div>
              {cliente.nome_social_fantasia && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                  </div>
                  <div className="text-base">{cliente.nome_social_fantasia}</div>
                </div>
              )}
              {isPessoaFisica ? (
                <>
                  {cliente.cpf && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CPF
                      </div>
                      <div className="text-base">{formatarCpf(cliente.cpf)}</div>
                    </div>
                  )}
                  {cliente.rg && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        RG
                      </div>
                      <div className="text-base">{cliente.rg}</div>
                    </div>
                  )}
                  {cliente.data_nascimento && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Data de Nascimento
                      </div>
                      <div className="text-base">
                        {formatarData(cliente.data_nascimento)}
                      </div>
                    </div>
                  )}
                  {cliente.sexo && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Sexo
                      </div>
                      <div className="text-base capitalize">
                        {cliente.sexo.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {cliente.estado_civil && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Estado Civil
                      </div>
                      <div className="text-base capitalize">
                        {cliente.estado_civil.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {cliente.nacionalidade && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Nacionalidade
                      </div>
                      <div className="text-base">{cliente.nacionalidade}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {cliente.cnpj && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CNPJ
                      </div>
                      <div className="text-base">
                        {formatarCnpj(cliente.cnpj)}
                      </div>
                    </div>
                  )}
                  {cliente.inscricao_estadual && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Inscrição Estadual
                      </div>
                      <div className="text-base">
                        {cliente.inscricao_estadual}
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
              {cliente.emails && cliente.emails.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail{cliente.emails.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-base">
                    {cliente.emails.join(', ')}
                  </div>
                </div>
              )}
              {cliente.ddd_residencial && cliente.numero_residencial && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${cliente.ddd_residencial}${cliente.numero_residencial}`)}
                  </div>
                </div>
              )}
              {cliente.ddd_celular && cliente.numero_celular && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Celular
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${cliente.ddd_celular}${cliente.numero_celular}`)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Endereço */}
          {cliente.endereco && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Endereço</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cliente.endereco.logradouro && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Logradouro
                    </div>
                    <div className="text-base">
                      {cliente.endereco.logradouro}
                      {cliente.endereco.numero && `, ${cliente.endereco.numero}`}
                    </div>
                  </div>
                )}
                {cliente.endereco.complemento && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Complemento
                    </div>
                    <div className="text-base">{cliente.endereco.complemento}</div>
                  </div>
                )}
                {cliente.endereco.bairro && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Bairro
                    </div>
                    <div className="text-base">{cliente.endereco.bairro}</div>
                  </div>
                )}
                {cliente.endereco.municipio && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Município
                    </div>
                    <div className="text-base">
                      {cliente.endereco.municipio}
                      {cliente.endereco.estado_sigla && ` - ${cliente.endereco.estado_sigla}`}
                    </div>
                  </div>
                )}
                {cliente.endereco.cep && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      CEP
                    </div>
                    <div className="text-base">{formatarCep(cliente.endereco.cep)}</div>
                  </div>
                )}
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

          {/* Informações do Sistema */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Criação
                </div>
                <div className="text-base">
                  {formatarData(cliente.created_at)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Última Atualização
                </div>
                <div className="text-base">
                  {formatarData(cliente.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
