/**
 * Header do Processo
 *
 * Exibe metadados completos do processo: número, partes, tribunal,
 * órgão julgador, datas e responsável.
 */

'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lock, User, Calendar } from 'lucide-react';
import type { Acervo } from '@/backend/types/acervo/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ProcessoHeaderProps {
  processo: Acervo;
}

export function ProcessoHeader({ processo }: ProcessoHeaderProps) {
  const formatarData = (data: string | null) => {
    if (!data) return '—';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '—';
    }
  };

  const getGrauLabel = (grau: string) => {
    return grau === 'primeiro_grau' ? 'Primeiro Grau' : 'Segundo Grau';
  };

  const getOrigemLabel = (origem: string) => {
    return origem === 'acervo_geral' ? 'Acervo Geral' : 'Arquivado';
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Linha 1: Número do Processo e Badges Principais */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {processo.numero_processo}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" tone="neutral">{processo.trt}</Badge>
            <Badge variant="outline" tone="neutral">{getGrauLabel(processo.grau)}</Badge>
            <Badge tone="info" variant="soft">{getOrigemLabel(processo.origem)}</Badge>
            {processo.classe_judicial && (
              <Badge tone="neutral" variant="soft">{processo.classe_judicial}</Badge>
            )}
            {processo.segredo_justica && (
              <Badge tone="danger" variant="solid" className="gap-1">
                <Lock className="h-3 w-3" />
                Segredo de Justiça
              </Badge>
            )}
            {processo.juizo_digital && (
              <Badge tone="success" variant="soft">Juízo Digital</Badge>
            )}
          </div>
        </div>

        {/* Status e Data de Autuação */}
        <div className="text-sm text-muted-foreground space-y-1">
          {processo.codigo_status_processo && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span>{processo.codigo_status_processo}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Autuado em {formatarData(processo.data_autuacao)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Linha 2: Órgão Julgador e Partes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Órgão Julgador */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Órgão Julgador</h3>
          <p className="text-sm">{processo.descricao_orgao_julgador || '—'}</p>
        </div>

        {/* Próxima Audiência */}
        {processo.data_proxima_audiencia && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Próxima Audiência
            </h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                {formatarData(processo.data_proxima_audiencia)}
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Linha 3: Partes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Parte Autora */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Parte Autora</h3>
          <div className="flex items-start gap-2">
            <Badge tone="success" variant="soft">
              {processo.nome_parte_autora}
              {processo.qtde_parte_autora > 1 &&
                ` e outros (${processo.qtde_parte_autora})`}
            </Badge>
          </div>
        </div>

        {/* Parte Ré */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Parte Ré</h3>
          <div className="flex items-start gap-2">
            <Badge tone="danger" variant="soft">
              {processo.nome_parte_re}
              {processo.qtde_parte_re > 1 && ` e outros (${processo.qtde_parte_re})`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Responsável (se houver) */}
      {processo.responsavel_id && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Responsável:</span>
            <span className="font-medium">Usuário #{processo.responsavel_id}</span>
          </div>
        </>
      )}

      {/* Data de Arquivamento (se houver) */}
      {processo.data_arquivamento && (
        <>
          <Separator />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Arquivado em:</span>{' '}
            {formatarData(processo.data_arquivamento)}
          </div>
        </>
      )}
    </Card>
  );
}
