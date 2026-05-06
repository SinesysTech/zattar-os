'use client';

/**
 * AllDetailsSheet — Dialog de detalhes complementares do processo
 * ============================================================================
 * Exibe listas de expedientes, audiências e perícias vinculados ao processo,
 * em tabs dentro de um  centralizado.
 *
 * NOTA: Nome mantido por compatibilidade com consumidor (processo-visualizacao).
 * Estrutura interna foi migrada de DetailSheet para Dialog + GlassPanel.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { FileText, Calendar, Microscope } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { GlassPanel } from '@/components/shared/glass-panel';

import { actionObterDetalhesComplementaresProcesso } from '../../actions';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';
import { Text } from '@/components/ui/typography';

interface AllDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: number;
  numeroProcesso: string;
}

export function AllDetailsSheet({
  open,
  onOpenChange,
  processoId,
  numeroProcesso,
}: AllDetailsSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [pericias, setPericias] = useState<Pericia[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    actionObterDetalhesComplementaresProcesso(processoId, numeroProcesso)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setAudiencias(result.data.audiencias as Audiencia[]);
          setExpedientes(result.data.expedientes as Expediente[]);
          setPericias(result.data.pericias as Pericia[]);
        }
      })
      .catch((err) => console.error('Erro ao carregar detalhes:', err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, processoId, numeroProcesso]);

  const totalAudiencias = audiencias.length;
  const totalExpedientes = expedientes.length;
  const totalPericias = pericias.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes complementares</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className={cn("stack-tight")}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="expedientes">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="expedientes" className={cn("inline-snug text-body-sm")}>
                <FileText className="size-3.5" />
                Expedientes
                {totalExpedientes > 0 && (
                  <SemanticBadge
                    category="status"
                    value={totalExpedientes}
                    variantOverride="secondary"
                    toneOverride="soft"
                    className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "ml-1 text-[10px] px-1.5 py-0")}
                  >
                    {totalExpedientes}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audiencias" className={cn("inline-snug text-body-sm")}>
                <Calendar className="size-3.5" />
                Audiências
                {totalAudiencias > 0 && (
                  <SemanticBadge
                    category="status"
                    value={totalAudiencias}
                    variantOverride="secondary"
                    toneOverride="soft"
                    className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "ml-1 text-[10px] px-1.5 py-0")}
                  >
                    {totalAudiencias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pericias" className={cn("inline-snug text-body-sm")}>
                <Microscope className="size-3.5" />
                Perícias
                {totalPericias > 0 && (
                  <SemanticBadge
                    category="status"
                    value={totalPericias}
                    variantOverride="secondary"
                    toneOverride="soft"
                    className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0 padding direcional sem Inset equiv. */ "ml-1 text-[10px] px-1.5 py-0")}
                  >
                    {totalPericias}
                  </SemanticBadge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expedientes" className="mt-3">
              {totalExpedientes === 0 ? (
                <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-body-sm text-muted-foreground/60 py-6 text-center")}>
                  Nenhum expediente.
                </p>
              ) : (
                <div className={cn(/* design-system-escape: pr-1 padding direcional sem Inset equiv. */ "stack-tight max-h-[60vh] overflow-y-auto pr-1")}>
                  {expedientes.map((exp) => (
                    <GlassPanel key={exp.id} depth={1} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "px-3 py-2.5")}>
                      <Text variant="caption" className="font-medium">Expediente</Text>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {exp.dataCriacaoExpediente
                          ? new Date(exp.dataCriacaoExpediente).toLocaleDateString('pt-BR')
                          : '--'}
                        {exp.dataPrazoLegalParte &&
                          ` · Prazo: ${new Date(exp.dataPrazoLegalParte).toLocaleDateString('pt-BR')}`}
                      </p>
                    </GlassPanel>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audiencias" className="mt-3">
              {totalAudiencias === 0 ? (
                <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-body-sm text-muted-foreground/60 py-6 text-center")}>
                  Nenhuma audiência.
                </p>
              ) : (
                <div className={cn(/* design-system-escape: pr-1 padding direcional sem Inset equiv. */ "stack-tight max-h-[60vh] overflow-y-auto pr-1")}>
                  {audiencias.map((aud) => (
                    <GlassPanel key={aud.id} depth={1} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "px-3 py-2.5")}>
                      <Text variant="caption" className="font-medium">
                        {aud.tipoDescricao || 'Audiência'}
                      </Text>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {new Date(aud.dataInicio).toLocaleDateString('pt-BR')}
                        {aud.salaAudienciaNome && ` · Sala ${aud.salaAudienciaNome}`}
                      </p>
                    </GlassPanel>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pericias" className="mt-3">
              {totalPericias === 0 ? (
                <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-body-sm text-muted-foreground/60 py-6 text-center")}>
                  Nenhuma perícia.
                </p>
              ) : (
                <div className={cn(/* design-system-escape: pr-1 padding direcional sem Inset equiv. */ "stack-tight max-h-[60vh] overflow-y-auto pr-1")}>
                  {pericias.map((per) => (
                    <GlassPanel key={per.id} depth={1} className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "px-3 py-2.5")}>
                      <Text variant="caption" className="font-medium">
                        {per.especialidade?.descricao || 'Perícia'}
                      </Text>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {per.perito?.nome && `Perito: ${per.perito.nome} · `}
                        Prazo:{' '}
                        {per.prazoEntrega
                          ? new Date(per.prazoEntrega).toLocaleDateString('pt-BR')
                          : '--'}
                      </p>
                    </GlassPanel>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
