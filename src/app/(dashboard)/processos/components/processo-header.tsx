/**
 * Header do Processo
 *
 * Exibe metadados completos do processo: número, partes, tribunal,
 * órgão julgador, datas e responsável.
 * Suporta exibição de múltiplas instâncias (unificado).
 */

'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lock, User, Calendar, Layers } from 'lucide-react';
import type { Acervo } from '@/backend/types/acervo/types';
import type { GrauProcesso } from '@/types/domain/common';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Informações de instância para exibição
 */
interface InstanciaInfo {
  id: number;
  grau: GrauProcesso;
  trt: string;
  totalItensOriginal: number;
}

interface ProcessoHeaderProps {
  processo: Acervo;
  /** Instâncias do processo (quando usando timeline unificada) */
  instancias?: InstanciaInfo[];
  /** Quantidade de duplicatas removidas na timeline */
  duplicatasRemovidas?: number;
}

export function ProcessoHeader({ processo, instancias, duplicatasRemovidas }: ProcessoHeaderProps) {
  const formatarData = (data: string | null) => {
    if (!data) return '—';
    try {
      return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '—';
    }
  };

  const getGrauLabel = (grau: string) => {
    if (grau === 'primeiro_grau') return '1º Grau';
    if (grau === 'segundo_grau') return '2º Grau';
    if (grau === 'tribunal_superior') return 'Tribunal Superior';
    return grau;
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

      {/* Instâncias do Processo (modo unificado) */}
      {instancias && instancias.length > 1 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Instâncias do Processo ({instancias.length})
              </h3>
              {duplicatasRemovidas !== undefined && duplicatasRemovidas > 0 && (
                <Badge variant="soft" tone="neutral" className="text-xs">
                  {duplicatasRemovidas} eventos duplicados removidos
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {instancias.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  <Badge
                    variant="outline"
                    tone={
                      inst.grau === 'tribunal_superior'
                        ? 'warning'
                        : inst.grau === 'segundo_grau'
                          ? 'info'
                          : 'neutral'
                    }
                  >
                    {getGrauLabel(inst.grau)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {inst.trt}
                  </span>
                  <span className="text-xs font-medium">
                    {inst.totalItensOriginal} eventos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
