/**
 * Header do Processo
 *
 * Layout flat (sem Card) integrado ao design system.
 * Tipografia alinhada ao padrão DataTableToolbar (text-2xl font-heading).
 * Metadados compactados em layout horizontal.
 */

'use client';

import React from 'react';
import { Lock, Layers, RefreshCw, ArrowLeft } from 'lucide-react';
import type { ProcessoUnificado } from '@/features/processos/domain';
import type { GrauProcesso } from '@/features/partes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GrauBadgesSimple } from './grau-badges';
import { CopyButton } from '@/features/partes';
import { ProximaAudienciaPopover } from './proxima-audiencia-popover';
import { GRAU_LABELS } from '@/lib/design-system';
import { actionListarUsuarios } from '@/features/usuarios';
import { ProcessosAlterarResponsavelDialog } from './processos-alterar-responsavel-dialog';
import { SemanticBadge } from '@/components/ui/semantic-badge';

/**
 * Informações de instância para exibição
 */
interface InstanciaInfo {
  id: number;
  grau: GrauProcesso;
  trt: string;
  totalItensOriginal: number;
  totalMovimentosProprios?: number;
}

interface ProcessoHeaderProps {
  processo: ProcessoUnificado;
  instancias?: InstanciaInfo[];
  duplicatasRemovidas?: number;
  onAtualizarTimeline?: () => void;
  isCapturing?: boolean;
  onVoltar?: () => void;
}

function formatarGrau(grau: string): string {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
}

function formatarGrauComOrdinal(grau: GrauProcesso): string {
  switch (grau) {
    case 'tribunal_superior':
      return 'Tribunal Superior';
    case 'segundo_grau':
      return '2º Grau';
    case 'primeiro_grau':
      return '1º Grau';
    default:
      return formatarGrau(grau);
  }
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

function ProcessoResponsavelCell({
  processo,
  usuarios = [],
  onSuccess,
}: {
  processo: ProcessoUnificado;
  usuarios?: Usuario[];
  onSuccess?: (updatedProcesso?: ProcessoUnificado) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [localProcesso, setLocalProcesso] = React.useState(processo);

  React.useEffect(() => {
    setLocalProcesso(processo);
  }, [processo]);

  const responsavel = usuarios.find((u) => u.id === localProcesso.responsavelId);
  const nomeExibicao = responsavel?.nomeExibicao || 'Não atribuído';

  const handleSuccess = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    if (updatedProcesso && updatedProcesso.id === localProcesso.id) {
      setLocalProcesso(updatedProcesso);
    }
    onSuccess?.(updatedProcesso);
  }, [onSuccess, localProcesso.id]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
        className="flex items-center gap-2 text-sm min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer"
        title={responsavel ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={responsavel.avatarUrl || undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{responsavel.nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground text-sm">Não atribuído</span>
        )}
      </button>

      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={localProcesso}
        usuarios={usuarios}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export function ProcessoHeader({
  processo,
  instancias,
  duplicatasRemovidas,
  onAtualizarTimeline,
  isCapturing,
  onVoltar,
}: ProcessoHeaderProps) {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);

  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string; avatarUrl?: string | null }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
            avatarUrl: u.avatarUrl ?? null,
          }));
          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, []);

  const trt = processo.trtOrigem || processo.trt;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = processo.descricaoOrgaoJulgador || '-';
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;
  const isUnificado = !!processo.grausAtivos?.length;
  const parteAutora = processo.nomeParteAutoraOrigem || processo.nomeParteAutora || '-';
  const parteRe = processo.nomeParteReOrigem || processo.nomeParteRe || '-';
  const tituloPartes = parteRe && parteRe !== '-' ? `${parteAutora} vs ${parteRe}` : parteAutora;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Workspace do Processo
          </p>

          <div className="flex items-center gap-3">
            {onVoltar && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onVoltar}
                title="Voltar para Processos"
                className="mt-0.5 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground min-w-0 sm:text-[2rem]">
                  <span className="block truncate">{tituloPartes}</span>
                </h1>
                {segredoJustica && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock className="h-4 w-4 text-destructive shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>Segredo de Justiça</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                {classeJudicial && <span>{classeJudicial}</span>}
                {classeJudicial && <span>•</span>}
                <span className="font-medium text-foreground">{numeroProcesso}</span>
                <CopyButton text={numeroProcesso} label="Copiar número do processo" />
                <span>•</span>
                <span>{orgaoJulgador}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-sm">
                <SemanticBadge category="tribunal" value={trt} className="text-xs">
                  {trt}
                </SemanticBadge>

                {isUnificado && processo.grausAtivos ? (
                  <GrauBadgesSimple grausAtivos={processo.grausAtivos} />
                ) : (
                  processo.grauAtual && (
                    <SemanticBadge category="grau" value={processo.grauAtual} className="text-xs">
                      {formatarGrau(processo.grauAtual)}
                    </SemanticBadge>
                  )
                )}
                <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onAtualizarTimeline && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={onAtualizarTimeline}
                    disabled={isCapturing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isCapturing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar timeline do processo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-muted/25 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Polo Ativo
            </p>
            <p className="text-sm leading-6 text-foreground">{parteAutora}</p>
          </div>

          <div className="rounded-xl border bg-muted/25 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Polo Passivo
            </p>
            <p className="text-sm leading-6 text-foreground">{parteRe}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/25 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Responsável
              </p>
              <div className="mt-2">
                <ProcessoResponsavelCell processo={processo} usuarios={usuarios} onSuccess={() => { }} />
              </div>
            </div>

            {instancias && instancias.length > 1 && (
              <div className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                {instancias.length} instâncias
              </div>
            )}
          </div>

          {instancias && instancias.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap border-t pt-3 text-sm">
              {duplicatasRemovidas !== undefined && duplicatasRemovidas > 0 && (
                <span className="text-xs text-muted-foreground">
                  {duplicatasRemovidas} duplicatas removidas
                </span>
              )}
              {instancias.map((inst) => (
                <div key={inst.id} className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1">
                  <SemanticBadge category="grau" value={inst.grau} className="text-[10px]">
                    {formatarGrauComOrdinal(inst.grau)}
                  </SemanticBadge>
                  <span className="text-xs text-muted-foreground">
                    {inst.totalMovimentosProprios ?? inst.totalItensOriginal} mov.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
