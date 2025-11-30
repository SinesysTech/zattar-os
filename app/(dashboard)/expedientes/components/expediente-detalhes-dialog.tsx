'use client';

// Componente Dialog para exibir detalhes de expediente(s)

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';

/**
 * Formata data ISO para formato brasileiro
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Retorna variante do badge de status
 */
const getStatusBadgeStyle = (baixadoEm: string | null): { tone: 'info' | 'success'; variant: 'soft' } => {
  return baixadoEm ? { tone: 'success', variant: 'soft' } : { tone: 'info', variant: 'soft' };
};

/**
 * Retorna texto do status
 */
const getStatusTexto = (baixadoEm: string | null): string => {
  return baixadoEm ? 'Baixado' : 'Pendente';
};

interface ExpedienteDetalhesDialogProps {
  expediente: PendenteManifestacao | null;
  expedientes?: PendenteManifestacao[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
}

export function ExpedienteDetalhesDialog({
  expediente,
  expedientes,
  open,
  onOpenChange,
  titulo,
}: ExpedienteDetalhesDialogProps) {
  const [listaLocal, setListaLocal] = React.useState<PendenteManifestacao[]>(expedientes || []);
  React.useEffect(() => { setListaLocal(expedientes || []); }, [expedientes]);
  const [expLocal, setExpLocal] = React.useState<PendenteManifestacao | null>(expediente);
  React.useEffect(() => { setExpLocal(expediente || null); }, [expediente]);
  const exibirLista = listaLocal && listaLocal.length > 0;
  const expedienteUnico = !exibirLista && expLocal;

  const PrazoEditor: React.FC<{ exp: PendenteManifestacao; onUpdated: (u: PendenteManifestacao) => void }> = ({ exp, onUpdated }) => {
    const [openEdit, setOpenEdit] = React.useState(false);
    const [dt, setDt] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const salvar = async () => {
      setSaving(true);
      try {
        const iso = dt ? new Date(dt).toISOString() : '';
        const r = await fetch(`/api/pendentes-manifestacao/${exp.id}/prazo-legal`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataPrazoLegal: iso }) });
        if (!r.ok) {
          const ed = await r.json().catch(() => ({ error: 'Erro' }));
          throw new Error(ed.error || 'Erro');
        }
        const agora = new Date();
        const fim = new Date(iso);
        const atualizado: PendenteManifestacao = { ...exp, data_prazo_legal_parte: iso, prazo_vencido: !exp.baixado_em && fim.getTime() < agora.getTime() };
        onUpdated(atualizado);
        setOpenEdit(false);
        setDt('');
      } finally {
        setSaving(false);
      }
    };
    if (exp.baixado_em || exp.data_prazo_legal_parte) return null;
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>Definir Prazo</Button>
        {openEdit && (
          <div className="flex items-center gap-2">
            <input type="date" className="border rounded p-1 text-sm" value={dt} onChange={(e) => setDt(e.target.value)} aria-label="Data do prazo" />
            <Button size="sm" onClick={salvar} disabled={saving || !dt}>{saving ? 'Salvando...' : 'Salvar'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{titulo || (exibirLista ? 'Expedientes do Dia' : 'Detalhes do Expediente')}</DialogTitle>
          <DialogDescription>
            {exibirLista
              ? `${expedientes?.length ?? 0} expediente${(expedientes?.length ?? 0) > 1 ? 's' : ''} para este dia`
              : 'Informações completas do expediente'
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {exibirLista ? (
            <div className="space-y-4">
              {listaLocal.map((exp) => (
                <div key={exp.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg">
                      {exp.classe_judicial} {exp.numero_processo}
                    </div>
                    <div className="flex gap-2">
                      <Badge {...getStatusBadgeStyle(exp.baixado_em)}>
                        {getStatusTexto(exp.baixado_em)}
                      </Badge>
                      <Badge variant={exp.prazo_vencido ? 'destructive' : 'default'}>
                        {exp.prazo_vencido ? 'Vencido' : 'No Prazo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Data de Ciência</div>
                      <div className="font-medium">{formatarData(exp.data_ciencia_parte)}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Prazo Legal</div>
                      <div className="font-medium">{formatarData(exp.data_prazo_legal_parte)}</div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-muted-foreground">Órgão Julgador</div>
                      <div>{exp.descricao_orgao_julgador || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Autora</div>
                      <div className="truncate">{exp.nome_parte_autora || '-'}</div>
                    </div>

                    <div>
                      <div className="text-muted-foreground">Parte Ré</div>
                      <div className="truncate">{exp.nome_parte_re || '-'}</div>
                    </div>
                  </div>
                  <PrazoEditor exp={exp} onUpdated={(u) => setListaLocal((prev) => prev.map((p) => (p.id === u.id ? u : p)))} />
                </div>
              ))}
            </div>
          ) : expedienteUnico ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="flex gap-2 mt-1">
                    <Badge {...getStatusBadgeStyle(expedienteUnico.baixado_em)}>
                      {getStatusTexto(expedienteUnico.baixado_em)}
                    </Badge>
                    <Badge variant={expedienteUnico.prazo_vencido ? 'destructive' : 'default'}>
                      {expedienteUnico.prazo_vencido ? 'Vencido' : 'No Prazo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Número do Processo</div>
                  <div className="font-medium">
                    {expedienteUnico.classe_judicial && `${expedienteUnico.classe_judicial} `}
                    {expedienteUnico.numero_processo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Data de Ciência</div>
                    <div className="font-medium">{formatarData(expedienteUnico.data_ciencia_parte)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prazo Legal</div>
                    <div className="font-medium">{formatarData(expedienteUnico.data_prazo_legal_parte)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Órgão Julgador</div>
                  <div>{expedienteUnico.descricao_orgao_julgador || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Autora</div>
                    <div className="font-medium">{expedienteUnico.nome_parte_autora || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Parte Ré</div>
                    <div className="font-medium">{expedienteUnico.nome_parte_re || '-'}</div>
                  </div>
                </div>

                {expedienteUnico.baixado_em && (
                  <div>
                    <div className="text-sm text-muted-foreground">Data de Baixa</div>
                    <div>{formatarData(expedienteUnico.baixado_em)}</div>
                  </div>
                )}
                <PrazoEditor exp={expedienteUnico} onUpdated={(u) => setExpLocal(u)} />
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
