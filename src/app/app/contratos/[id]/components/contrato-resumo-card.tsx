'use client';

import { FileText, Mail, MapPin, PhoneCall, User, Users, FolderOpen } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type {
  Contrato,
  ClienteDetalhado,
  ResponsavelDetalhado,
  ContratoCompletoStats,
} from '@/features/contratos';
import { getStatusVariant, formatarStatusContrato } from '@/features/contratos';

interface ContratoResumoCardProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  stats: ContratoCompletoStats;
}

function getInitials(nome: string): string {
  const parts = nome.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(ddd: string | null, numero: string | null): string | null {
  if (!numero) return null;
  if (ddd) return `(${ddd}) ${numero}`;
  return numero;
}

function formatEndereco(endereco: ClienteDetalhado['endereco']): string | null {
  if (!endereco) return null;
  const parts: string[] = [];
  if (endereco.municipio) parts.push(endereco.municipio);
  if (endereco.estadoSigla) parts.push(endereco.estadoSigla);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function ContratoResumoCard({
  contrato,
  cliente,
  responsavel,
  stats,
}: ContratoResumoCardProps) {
  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;
  const clienteInitials = getInitials(clienteNome);
  const statusVariant = getStatusVariant(contrato.status);
  const statusLabel = formatarStatusContrato(contrato.status);

  const email = cliente?.emails?.[0] ?? null;
  const telefone = formatPhone(cliente?.dddCelular ?? null, cliente?.numeroCelular ?? null);
  const localizacao = formatEndereco(cliente?.endereco ?? null);

  return (
    <Card className="relative">
      <CardContent>
        <div className="space-y-8">
          {/* Avatar e identificação */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="size-20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {clienteInitials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h5 className="flex items-center justify-center gap-2 text-xl font-semibold">
                {clienteNome}
              </h5>
              <div className="mt-1">
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
              {cliente?.cpfCnpj && (
                <div className="text-muted-foreground text-sm mt-1">
                  {cliente.tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}: {cliente.cpfCnpj}
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-muted grid grid-cols-3 divide-x rounded-md border text-center *:py-3">
            <div>
              <h5 className="text-lg font-semibold">{stats.totalPartes}</h5>
              <div className="text-muted-foreground text-sm">Partes</div>
            </div>
            <div>
              <h5 className="text-lg font-semibold">{stats.totalProcessos}</h5>
              <div className="text-muted-foreground text-sm">Processos</div>
            </div>
            <div>
              <h5 className="text-lg font-semibold">{stats.totalDocumentos}</h5>
              <div className="text-muted-foreground text-sm">Documentos</div>
            </div>
          </div>

          {/* Informações de contato */}
          <div className="flex flex-col gap-y-4">
            {email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {telefone && (
              <div className="flex items-center gap-3 text-sm">
                <PhoneCall className="text-muted-foreground size-4 shrink-0" />
                {telefone}
              </div>
            )}
            {localizacao && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="text-muted-foreground size-4 shrink-0" />
                {localizacao}
              </div>
            )}
            {responsavel && (
              <div className="flex items-center gap-3 text-sm">
                <User className="text-muted-foreground size-4 shrink-0" />
                <span>
                  <span className="text-muted-foreground">Responsável:</span> {responsavel.nome}
                </span>
              </div>
            )}
            {stats.totalLancamentos > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <FolderOpen className="text-muted-foreground size-4 shrink-0" />
                <span>
                  <span className="text-muted-foreground">Lançamentos:</span> {stats.totalLancamentos}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
