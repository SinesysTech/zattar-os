"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import * as Kanban from "@/components/ui/kanban";

import type { SystemBoardData, UnifiedKanbanCard as CardType, KanbanBoardSource } from "../domain";
import { UnifiedKanbanCard } from "./unified-kanban-card";
import { actionAtualizarStatusEntidade } from "../actions/quadro-actions";

interface SystemBoardViewProps {
  data: SystemBoardData;
  source: KanbanBoardSource;
  onRefresh?: () => void;
}

export function SystemBoardView({ data, source, onRefresh }: SystemBoardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [syncError, setSyncError] = React.useState<string | null>(null);

  // Converter SystemBoardData para o formato que Kanban.Root espera: Record<string, CardType[]>
  const columnOrder = data.columns.map((c: { id: string; title: string; statusKey: string }) => c.id);

  const [columns, setColumns] = React.useState<Record<string, CardType[]>>(() => {
    const initial: Record<string, CardType[]> = {};
    for (const col of data.columns) {
      initial[col.id] = data.cardsByColumn[col.id] ?? [];
    }
    return initial;
  });

  const columnTitles = React.useMemo(() => {
    const titles: Record<string, string> = {};
    for (const col of data.columns) {
      titles[col.id] = col.title;
    }
    return titles;
  }, [data.columns]);

  // Re-sync quando data muda (ex: troca de board)
  React.useEffect(() => {
    const next: Record<string, CardType[]> = {};
    for (const col of data.columns) {
      next[col.id] = data.cardsByColumn[col.id] ?? [];
    }
    setColumns(next);
  }, [data]);

  const handleBoardValueChange = (next: Record<string, CardType[]>) => {
    // Detectar qual card mudou de coluna (DnD bidirecional)
    for (const colId of Object.keys(next)) {
      const newCards = next[colId] ?? [];
      const oldCards = columns[colId] ?? [];

      for (const card of newCards) {
        const wasInColumn = oldCards.some((c) => c.id === card.id);
        if (!wasInColumn && card.columnId !== colId) {
          // Card movido para nova coluna → atualizar status no módulo de origem
          startTransition(async () => {
            const result = await actionAtualizarStatusEntidade({
              source,
              entityId: card.sourceEntityId!,
              targetColumnId: colId,
            });
            if (!result.success) {
              setSyncError(result.message || result.error || "Falha ao atualizar status.");
              // Reverter
              setColumns((prev) => {
                const reverted: Record<string, CardType[]> = {};
                for (const c of data.columns) {
                  reverted[c.id] = data.cardsByColumn[c.id] ?? [];
                }
                return reverted;
              });
              return;
            }
            setSyncError(null);
            // Atualizar columnId local no card
            card.columnId = colId;
            onRefresh?.();
          });
          break;
        }
      }
    }

    setColumns(next);
  };

  return (
    <div className="space-y-4">
      {syncError && (
        <div className="text-sm text-destructive" role="alert">
          {syncError}
        </div>
      )}

      <Kanban.Root
        value={columns}
        onValueChange={handleBoardValueChange}
        getItemValue={(item) => item.id}
      >
        <Kanban.Board className="flex w-full gap-4 overflow-x-auto pb-4">
          {columnOrder.map((columnValue: string) => {
            const cards = columns[columnValue] ?? [];
            return (
              <Kanban.Column
                key={columnValue}
                value={columnValue}
                className="w-[340px] min-w-[340px] rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold">{columnTitles[columnValue]}</span>
                  <Badge variant="outline">{cards.length}</Badge>
                </div>
                {cards.length > 0 ? (
                  <div className="flex flex-col gap-2 p-0.5">
                    {cards.map((card) => (
                      <Kanban.Item key={card.id} value={card.id} asHandle asChild>
                        <div>
                          <UnifiedKanbanCard card={card} />
                        </div>
                      </Kanban.Item>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center gap-4 pt-4">
                    <div className="text-muted-foreground text-sm text-center">
                      Nenhum item nesta coluna.
                    </div>
                  </div>
                )}
              </Kanban.Column>
            );
          })}
        </Kanban.Board>
        <Kanban.Overlay>
          <div className="bg-primary/10 size-full rounded-md" />
        </Kanban.Overlay>
      </Kanban.Root>
    </div>
  );
}
