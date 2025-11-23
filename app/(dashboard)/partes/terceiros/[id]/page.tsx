'use client';

/**
 * Página de visualização de terceiro individual
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
import { getTipoParteLabel, getPoloLabel } from '@/lib/types/partes/terceiros';
import type { Terceiro } from '@/lib/types/partes';

export default function TerceiroPage() {
  const params = useParams();
  const router = useRouter();
  const terceiroId = params.id as string;

  const [terceiro, setTerceiro] = React.useState<Terceiro | null>(null);
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
              {terceiro.situacao && (
                <Badge
                  tone={terceiro.situacao === 'A' ? 'success' : 'neutral'}
                  variant={terceiro.situacao === 'A' ? 'soft' : 'outline'}
                >
                  {terceiro.situacao === 'A' ? 'Ativo' : 'Inativo'}
                </Badge>
              )}
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
        <Button disabled>
          <Pencil className="mr-2 h-4 w-4" />
          Editar Terceiro
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 max-w-4xl">
          {/* Informações do Processo */}
          {(terceiro.polo || terceiro.tipo_parte) && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Informações do Processo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {terceiro.tipo_parte && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Tipo de Parte
                    </div>
                    <div className="text-base">{getTipoParteLabel(terceiro.tipo_parte)}</div>
                  </div>
                )}
                {terceiro.polo && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Polo Processual
                    </div>
                    <div className="text-base">{getPoloLabel(terceiro.polo)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {isPessoaFisica ? 'Nome Completo' : 'Razão Social'}
                </div>
                <div className="text-base">{formatarNome(terceiro.nome)}</div>
              </div>
              {terceiro.nome_social && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {isPessoaFisica ? 'Nome Social' : 'Nome Fantasia'}
                  </div>
                  <div className="text-base">{terceiro.nome_social}</div>
                </div>
              )}
              {!isPessoaFisica && terceiro.nome_fantasia && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Nome Fantasia
                  </div>
                  <div className="text-base">{terceiro.nome_fantasia}</div>
                </div>
              )}
              {isPessoaFisica ? (
                <>
                  {terceiro.cpf && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CPF
                      </div>
                      <div className="text-base">{formatarCpf(terceiro.cpf)}</div>
                    </div>
                  )}
                  {terceiro.numero_rg && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        RG
                      </div>
                      <div className="text-base">{terceiro.numero_rg}</div>
                    </div>
                  )}
                  {terceiro.data_nascimento && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Data de Nascimento
                      </div>
                      <div className="text-base">
                        {formatarData(terceiro.data_nascimento)}
                      </div>
                    </div>
                  )}
                  {terceiro.sexo && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Sexo
                      </div>
                      <div className="text-base capitalize">
                        {terceiro.sexo.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {terceiro.estado_civil && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Estado Civil
                      </div>
                      <div className="text-base capitalize">
                        {terceiro.estado_civil.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {terceiro.nacionalidade && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Nacionalidade
                      </div>
                      <div className="text-base">{terceiro.nacionalidade}</div>
                    </div>
                  )}
                  {terceiro.profissao && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Profissão
                      </div>
                      <div className="text-base">{terceiro.profissao}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {terceiro.cnpj && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        CNPJ
                      </div>
                      <div className="text-base">
                        {formatarCnpj(terceiro.cnpj)}
                      </div>
                    </div>
                  )}
                  {terceiro.inscricao_estadual && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Inscrição Estadual
                      </div>
                      <div className="text-base">
                        {terceiro.inscricao_estadual}
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
              {terceiro.emails && terceiro.emails.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    E-mail{terceiro.emails.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-base">
                    {terceiro.emails.join(', ')}
                  </div>
                </div>
              )}
              {terceiro.ddd_telefone && terceiro.numero_telefone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Telefone
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${terceiro.ddd_telefone}${terceiro.numero_telefone}`)}
                  </div>
                </div>
              )}
              {terceiro.ddd_celular && terceiro.numero_celular && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Celular
                  </div>
                  <div className="text-base">
                    {formatarTelefone(`${terceiro.ddd_celular}${terceiro.numero_celular}`)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {terceiro.observacoes && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Observações</h2>
              <div className="text-base whitespace-pre-wrap">
                {terceiro.observacoes}
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
                  {formatarData(terceiro.created_at)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Última Atualização
                </div>
                <div className="text-base">
                  {formatarData(terceiro.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
