'use client';

import { Banknote } from 'lucide-react';
import { ObrigacaoListRow, type POCAcordo } from '../obrigacao-list-row';

export interface ObrigacoesListaViewProps {
  obrigacoes: POCAcordo[];
  onViewDetail?: (obrigacao: POCAcordo) => void;
  search?: string;
}

export function ObrigacoesListaView({
  obrigacoes,
  onViewDetail,
  search,
}: ObrigacoesListaViewProps) {
  if (obrigacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Banknote className="size-8 text-muted-foreground/45 mb-3" />
        <p className="text-sm font-medium text-muted-foreground/50">Nenhuma obrigação encontrada</p>
        <p className="text-xs text-muted-foreground/55 mt-1">
          {search ? 'Tente ajustar a busca' : 'Tente ajustar os filtros'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {obrigacoes.map((a) => (
        <ObrigacaoListRow key={a.id} obrigacao={a} onClick={onViewDetail} />
      ))}
    </div>
  );
}
