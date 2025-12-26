'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Expediente } from '../domain';
import { actionAtualizarExpediente } from '../actions';
import { format } from 'date-fns';
import { DialogFormShell } from '@/components/shared/dialog-shell';

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

const getStatusBadgeStyle = (baixadoEm: string | null): { variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
  return baixadoEm ? { variant: 'secondary' } : { variant: 'default' };
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

      // Update local state optimistically or based on result
      const iso = dt ? dt.toISOString() : null;
      const agora = new Date();
      const fim = iso ? new Date(iso) : null;
      const prazoVencido = !exp.baixadoEm && fim ? fim.getTime() < agora.getTime() : false;

      // We cast because result.data might not match exactly if fields are missing, but for UI updates typically it's enough
      // Ideally action returns full object.
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
      // Toast error?
    } finally {
      setSaving(false);
    }
  };

  if (exp.baixadoEm) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {!openEdit && (
        <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>
          {exp.dataPrazoLegalParte ? 'Alterar Prazo' : 'Definir Prazo'}
        </Button>
      )}

      {openEdit && (
        <div className="flex items-center gap-2">
          <FormDatePicker
            value={dt ? dt.toISOString() : undefined}
            onChange={(val) => setDt(val ? new Date(val) : undefined)}
            className="w-[140px]"
          />
          <Button size="sm" onClick={salvar} disabled={saving || !dt}>{saving ? '...' : 'OK'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpenEdit(false)} disabled={saving}>X</Button>
        </div>
      )}
    </div>
  );
};

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
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={titulo || (exibirLista ? 'Expedientes do Dia' : 'Detalhes do Expediente')}
      description={exibirLista
        ? `${expedientes?.length ?? 0} expediente${(expedientes?.length ?? 0) > 1 ? 's' : ''} para este dia`
        : 'Informações detalhadas do expediente'
      }
      maxWidth="2xl"
      footer={footerButton}
    >
      <ScrollArea className="max-h-[60vh] pr-4">
        {exibirLista ? (
          <div className="space-y-4">
            {listaLocal.map((exp) => (
              <div key={exp.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {exp.classeJudicial && <span className="text-muted-foreground text-sm uppercase">{exp.classeJudicial}</span>}
                    {exp.numeroProcesso}
                  </div>
                  <div className="flex gap-2">
                    <Badge {...getStatusBadgeStyle(exp.baixadoEm)}>
                      {getStatusTexto(exp.baixadoEm)}
                    </Badge>
                    <Badge variant={exp.prazoVencido ? 'destructive' : 'outline'}>
                      {exp.prazoVencido ? 'Vencido' : 'No Prazo'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Data de Ciência</div>
                    <div className="font-medium">{formatarData(exp.dataCienciaParte)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Prazo Legal</div>
                    <div className="font-medium">{formatarData(exp.dataPrazoLegalParte)}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Órgão Julgador</div>
                    <div>{exp.descricaoOrgaoJulgador || '-'}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Parte Autora</div>
                    <div className="truncate" title={exp.nomeParteAutora || ''}>{exp.nomeParteAutora || '-'}</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Parte Ré</div>
                    <div className="truncate" title={exp.nomeParteRe || ''}>{exp.nomeParteRe || '-'}</div>
                  </div>
                </div>
                <PrazoEditor
                  exp={exp}
                  onUpdated={(u) => setListaLocal((prev) => prev.map((p) => (p.id === u.id ? u : p)))}
                  onSuccess={onSuccess}
                />
              </div>
            ))}
          </div>
        ) : expedienteUnico ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Status</div>
                <div className="flex gap-2">
                  <Badge {...getStatusBadgeStyle(expedienteUnico.baixadoEm)}>
                    {getStatusTexto(expedienteUnico.baixadoEm)}
                  </Badge>
                  <Badge variant={expedienteUnico.prazoVencido ? 'destructive' : 'outline'}>
                    {expedienteUnico.prazoVencido ? 'Vencido' : 'No Prazo'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Número do Processo</div>
                  <div className="font-medium text-lg">
                    {expedienteUnico.numeroProcesso}
                  </div>
                  {expedienteUnico.classeJudicial && <div className="text-sm text-muted-foreground">{expedienteUnico.classeJudicial}</div>}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Órgão Julgador</div>
                  <div className="font-medium">{expedienteUnico.descricaoOrgaoJulgador || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/10 p-3 rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">Data de Ciência</div>
                  <div className="font-medium">{formatarData(expedienteUnico.dataCienciaParte)}</div>
                </div>
                <div className="bg-muted/10 p-3 rounded-md border">
                  <div className="text-xs text-muted-foreground mb-1">Prazo Legal</div>
                  <div className="font-medium">{formatarData(expedienteUnico.dataPrazoLegalParte)}</div>
                  <PrazoEditor
                    exp={expedienteUnico}
                    onUpdated={(u) => setExpLocal(u)}
                    onSuccess={onSuccess}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Parte Autora</div>
                  <div className="font-medium">{expedienteUnico.nomeParteAutora || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Parte Ré</div>
                  <div className="font-medium">{expedienteUnico.nomeParteRe || '-'}</div>
                </div>
              </div>

              {expedienteUnico.baixadoEm && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-700 dark:text-green-400 font-semibold mb-1">Baixado em</div>
                  <div className="font-medium">{formatarData(expedienteUnico.baixadoEm)}</div>
                  {expedienteUnico.justificativaBaixa && (
                    <div className="text-sm mt-1 text-muted-foreground">&ldquo;{expedienteUnico.justificativaBaixa}&rdquo;</div>
                  )}
                </div>
              )}

              {expedienteUnico.observacoes && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="font-semibold mb-1">Observações</div>
                  <div className="whitespace-pre-wrap">{expedienteUnico.observacoes}</div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </ScrollArea>
    </DialogFormShell>
  );
}
