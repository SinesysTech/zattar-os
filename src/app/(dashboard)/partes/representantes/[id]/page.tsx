'use client';

/**
 * Página de visualização de representante individual
 * Exibe todos os campos do registro organizados em seções
 * 
 * NOTA: Na nova estrutura, representantes são únicos por CPF.
 * O vínculo com processos/partes é feito via processo_partes.
 * id_pessoa_pje foi movido para cadastros_pje.
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
import type { RepresentanteComEndereco } from '@/backend/types/representantes/representantes-types';

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

  // Pegar a primeira OAB para exibição no header
  const primeiraOab = representante.oabs?.[0];
  const isRegular = primeiraOab?.situacao === 'REGULAR';

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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">
                {formatarNome(representante.nome)}
              </h1>
              {representante.oabs?.map((oab, index) => (
                <Badge key={index} variant="outline" tone="info">
                  OAB {oab.uf} {oab.numero.replace(/^[A-Z]{2}/, '')}
                </Badge>
              ))}
              {primeiraOab?.situacao && (
                <Badge
                  tone={isRegular ? 'success' : 'neutral'}
                  variant={isRegular ? 'soft' : 'outline'}
                >
                  {formatarSituacaoOAB(primeiraOab.situacao)}
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
          {/* Informações do Advogado */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Informações do Advogado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Campo label="Nome Completo" value={formatarNome(representante.nome)} />
              <Campo label="CPF" value={representante.cpf ? formatarCpf(representante.cpf) : null} />
              <Campo label="Sexo" value={representante.sexo?.replace('_', ' ')} />
              <Campo label="Tipo" value={representante.tipo} />
            </div>
          </div>

          {/* Inscrições na OAB */}
          {representante.oabs && representante.oabs.length > 0 && (
            <div className="rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Inscrições na OAB ({representante.oabs.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {representante.oabs.map((oab, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                    <Badge variant="outline" tone="info">
                      {oab.uf}
                    </Badge>
                    <span className="font-medium">{oab.numero.replace(/^[A-Z]{2}/, '')}</span>
                    <Badge
                      tone={oab.situacao === 'REGULAR' ? 'success' : 'neutral'}
                      variant={oab.situacao === 'REGULAR' ? 'soft' : 'outline'}
                      className="ml-auto"
                    >
                      {formatarSituacaoOAB(oab.situacao)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contato */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {representante.email && (
                <Campo label="E-mail" value={representante.email} />
              )}
              {representante.emails && Array.isArray(representante.emails) && representante.emails.length > 0 && (
                <Campo
                  label="E-mails Adicionais"
                  value={(representante.emails as string[]).join(', ')}
                />
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

          {/* Metadados do Sistema */}
          <div className="rounded-lg border p-6 space-y-4">
            <h2 className="text-xl font-semibold">Metadados do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Campo label="ID" value={representante.id} />
              <Campo label="Endereço ID" value={representante.endereco_id} />
              <Campo label="Data de Criação" value={representante.created_at ? formatarData(representante.created_at.toString()) : null} />
              <Campo label="Última Atualização" value={representante.updated_at ? formatarData(representante.updated_at.toString()) : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
