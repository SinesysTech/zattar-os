'use client';

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Expediente } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { format } from 'date-fns';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTimeline } from '@/components/common/audit-log-timeline';
import { useAuditLogs } from '@/lib/domain/audit/hooks/use-audit-logs';
import { Text } from '@/components/ui/typography';

interface ExpedienteDetalhesDialogProps {
  expediente: Expediente | null;
  expedientes?: Expediente[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  onSuccess?: () => void;
}

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    return format(new Date(dataISO), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const getStatusTexto = (baixadoEm: string | null): string => {
  return baixadoEm ? 'Baixado' : 'Pendente';
};

interface PrazoEditorProps {
  exp: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}

const PrazoEditor: React.FC<PrazoEditorProps> = ({ exp, onUpdated, onSuccess }) => {
  const [openEdit, setOpenEdit] = React.useState(false);
  const [dt, setDt] = React.useState<Date | undefined>(undefined);
  const [saving, setSaving] = React.useState(false);

  const salvar = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (dt) {
        formData.append('dataPrazoLegalParte', dt.toISOString());
      }

      const result = await actionAtualizarExpediente(exp.id, null, formData);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar prazo');
      }

      const iso = dt ? dt.toISOString() : null;
      const agora = new Date();
      const fim = iso ? new Date(iso) : null;
      const prazoVencido = !exp.baixadoEm && fim ? fim.getTime() < agora.getTime() : false;

      const atualizado = {
        ...exp,
        dataPrazoLegalParte: iso,
        prazoVencido
      } as Expediente;

      onUpdated(atualizado);
      if (onSuccess) onSuccess();
      setOpenEdit(false);
      setDt(undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (exp.baixadoEm) return null;

  return (
    <div className={cn("flex items-center inline-tight mt-2")}>
      {!openEdit && (
        <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>
          {exp.dataPrazoLegalParte ? 'Alterar prazo' : 'Definir prazo'}
        </Button>
      )}

      {openEdit && (
        <div className={cn("flex items-center inline-tight")}>
          <FormDatePicker
            value={dt ? dt.toISOString() : undefined}
            onChange={(val) => setDt(val ? new Date(val) : undefined)}
            className="w-35"
          />
          <Button size="sm" onClick={salvar} disabled={saving || !dt}>{saving ? '...' : 'OK'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenEdit(false)} disabled={saving}>X</Button>
        </div>
      )}
    </div>
  );
};

function ExpedienteListItem({
  exp,
  onUpdated,
  onSuccess
}: {
  exp: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('expedientes', exp.id);

  return (
    <div className={cn("border rounded-lg inset-card-compact bg-card")}>
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className={cn("flex flex-col stack-medium mt-0")}>
          <div className="flex items-center justify-between">
            <div className={cn( "font-semibold text-body-lg flex items-center inline-tight")}>
              {exp.classeJudicial && <span className={cn("text-muted-foreground text-body-sm uppercase")}>{exp.classeJudicial}</span>}
              {exp.numeroProcesso}
            </div>
            <div className={cn("flex inline-tight")}>
              <SemanticBadge category="expediente_status" value={getStatusTexto(exp.baixadoEm)}>
                {getStatusTexto(exp.baixadoEm)}
              </SemanticBadge>
              <AppBadge variant={exp.prazoVencido ? 'destructive' : 'outline'}>
                {exp.prazoVencido ? 'Vencido' : 'No Prazo'}
              </AppBadge>
            </div>
          </div>

          <div className={cn("grid grid-cols-2 inline-medium text-body-sm")}>
            <div>
              <Text variant="caption">Data de Ciência</Text>
              <div className={cn( "font-medium")}>{formatarData(exp.dataCienciaParte)}</div>
            </div>

            <div>
              <Text variant="caption">Prazo Legal</Text>
              <div className={cn( "font-medium")}>{formatarData(exp.dataPrazoLegalParte)}</div>
            </div>

            <div className="col-span-2">
              <Text variant="caption">Órgão Julgador</Text>
              <div>{exp.descricaoOrgaoJulgador || '-'}</div>
            </div>

            <div>
              <Text variant="caption">Parte Autora</Text>
              <div className="truncate" title={exp.nomeParteAutora || ''}>{exp.nomeParteAutora || '-'}</div>
            </div>

            <div>
              <Text variant="caption">Parte Ré</Text>
              <div className="truncate" title={exp.nomeParteRe || ''}>{exp.nomeParteRe || '-'}</div>
            </div>
          </div>
          <PrazoEditor
            exp={exp}
            onUpdated={onUpdated}
            onSuccess={onSuccess}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-75" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExpedienteSingleDetails({
  expediente,
  onUpdated,
  onSuccess
}: {
  expediente: Expediente;
  onUpdated: (u: Expediente) => void;
  onSuccess?: () => void;
}) {
  const { logs, isLoading: loadingLogs } = useAuditLogs('expedientes', expediente.id);

  return (
    <div className={cn("flex flex-col stack-default")}>
      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className={cn("flex flex-col stack-default mt-0")}>
          <div className="flex items-center justify-between">
            <div>
              <Text variant="caption" className="uppercase font-bold tracking-wider mb-1">Status</Text>
              <div className={cn("flex inline-tight")}>
                <SemanticBadge category="expediente_status" value={getStatusTexto(expediente.baixadoEm)}>
                  {getStatusTexto(expediente.baixadoEm)}
                </SemanticBadge>
                <AppBadge variant={expediente.prazoVencido ? 'destructive' : 'outline'}>
                  {expediente.prazoVencido ? 'Vencido' : 'No Prazo'}
                </AppBadge>
              </div>
            </div>
          </div>

          <div className={cn("flex flex-col border-t pt-4 stack-default")}>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              <div>
                <Text variant="caption">Número do Processo</Text>
                <div className={cn( "font-medium text-body-lg")}>
                  {expediente.numeroProcesso}
                </div>
                {expediente.classeJudicial && <div className={cn("text-body-sm text-muted-foreground")}>{expediente.classeJudicial}</div>}
              </div>
              <div>
                <Text variant="caption">Órgão Julgador</Text>
                <div className={cn( "font-medium")}>{expediente.descricaoOrgaoJulgador || '-'}</div>
              </div>
            </div>

            <div className={cn("grid grid-cols-2 inline-default")}>
              <div className={cn("bg-muted/10 inset-medium rounded-md border")}>
                <Text variant="caption" className="mb-1">Data de Ciência</Text>
                <div className={cn( "font-medium")}>{formatarData(expediente.dataCienciaParte)}</div>
              </div>
              <div className={cn("bg-muted/10 inset-medium rounded-md border")}>
                <Text variant="caption" className="mb-1">Prazo Legal</Text>
                <div className={cn( "font-medium")}>{formatarData(expediente.dataPrazoLegalParte)}</div>
                <PrazoEditor
                  exp={expediente}
                  onUpdated={onUpdated}
                  onSuccess={onSuccess}
                />
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 inline-default")}>
              <div>
                <Text variant="caption">Parte Autora</Text>
                <div className={cn( "font-medium")}>{expediente.nomeParteAutora || '-'}</div>
              </div>
              <div>
                <Text variant="caption">Parte Ré</Text>
                <div className={cn( "font-medium")}>{expediente.nomeParteRe || '-'}</div>
              </div>
            </div>

            {expediente.baixadoEm && (
              <div className={cn("bg-success/5 inset-medium rounded-md border border-success/15")}>
                <div className={cn( "text-body-sm text-success font-semibold mb-1")}>Baixado em</div>
                <div className={cn( "font-medium")}>{formatarData(expediente.baixadoEm)}</div>
                {expediente.justificativaBaixa && (
                  <div className={cn("text-body-sm mt-1 text-muted-foreground")}>&ldquo;{expediente.justificativaBaixa}&rdquo;</div>
                )}
              </div>
            )}

            {expediente.observacoes && (
              <div className={cn("bg-muted inset-medium rounded-md text-body-sm")}>
                <div className={cn( "font-semibold mb-1")}>Observações</div>
                <div className="whitespace-pre-wrap">{expediente.observacoes}</div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <AuditLogTimeline logs={logs || []} isLoading={loadingLogs} className="h-125" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ExpedienteDetalhesDialog({
  expediente,
  expedientes,
  open,
  onOpenChange,
  titulo,
  onSuccess
}: ExpedienteDetalhesDialogProps) {
  const [listaLocal, setListaLocal] = React.useState<Expediente[]>(expedientes || []);
  React.useEffect(() => { setListaLocal(expedientes || []); }, [expedientes]);

  const [expLocal, setExpLocal] = React.useState<Expediente | null>(expediente);
  React.useEffect(() => { setExpLocal(expediente || null); }, [expediente]);

  const exibirLista = listaLocal && listaLocal.length > 0;
  const expedienteUnico = !exibirLista && expLocal;

  const footerButton = (
    <Button variant="outline" onClick={() => onOpenChange(false)}>
      Fechar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-2xl  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>{titulo || (exibirLista ? 'Expedientes do Dia' : 'Detalhes do Expediente')}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <ScrollArea className={cn("max-h-[60vh] pr-4")}>
            {exibirLista ? (
              <div className={cn("flex flex-col stack-default")}>
                {listaLocal.map((exp) => (
                  <ExpedienteListItem
                    key={exp.id}
                    exp={exp}
                    onUpdated={(u) => setListaLocal((prev) => prev.map((p) => (p.id === u.id ? u : p)))}
                    onSuccess={onSuccess}
                  />
                ))}
              </div>
            ) : expedienteUnico ? (
              <ExpedienteSingleDetails
                expediente={expedienteUnico}
                onUpdated={(u) => setExpLocal(u)}
                onSuccess={onSuccess}
              />
            ) : null}
          </ScrollArea>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-end gap-2">
          {footerButton}
        </div>
      </DialogContent>
    </Dialog>
  );
}
