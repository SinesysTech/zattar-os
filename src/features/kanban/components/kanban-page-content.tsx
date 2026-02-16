"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataShell } from "@/components/shared/data-shell";
import { DataTableToolbar } from "@/components/shared/data-shell/data-table-toolbar";

import type {
  KanbanBoardData,
  KanbanBoardDef,
  SystemBoardData,
} from "../domain";
import { BoardSelector } from "./board-selector";
import { SystemBoardView } from "./system-board-view";
import CustomBoardView from "./custom-board-view";
import {
  actionObterQuadroSistema,
  actionObterQuadroCustom,
  actionCriarQuadroCustom,
} from "../actions/quadro-actions";

interface KanbanPageContentProps {
  boards: KanbanBoardDef[];
  initialBoardId: string;
  initialBoardData: KanbanBoardData | SystemBoardData;
  initialBoardType: "system" | "custom";
}

export function KanbanPageContent({
  boards: initialBoards,
  initialBoardId,
  initialBoardData,
  initialBoardType,
}: KanbanPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [boards, setBoards] = React.useState(initialBoards);
  const [activeBoardId, setActiveBoardId] = React.useState(initialBoardId);
  const [boardData, setBoardData] = React.useState<KanbanBoardData | SystemBoardData>(initialBoardData);
  const [boardType, setBoardType] = React.useState<"system" | "custom">(initialBoardType);
  const [isLoading, setIsLoading] = React.useState(false);

  // Dialog para criar novo quadro
  const [isNewBoardOpen, setIsNewBoardOpen] = React.useState(false);
  const [newBoardTitle, setNewBoardTitle] = React.useState("");

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  const handleBoardChange = async (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    setIsLoading(true);
    setActiveBoardId(boardId);
    setBoardType(board.tipo);

    try {
      if (board.tipo === "system" && board.source) {
        const result = await actionObterQuadroSistema({ source: board.source });
        if (result.success) {
          setBoardData(result.data as SystemBoardData);
        }
      } else {
        const result = await actionObterQuadroCustom({ boardId: board.id });
        if (result.success) {
          setBoardData(result.data as KanbanBoardData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshSystemBoard = () => {
    if (activeBoard?.tipo === "system" && activeBoard.source) {
      handleBoardChange(activeBoard.id);
    }
  };

  const handleCreateBoard = () => {
    if (!newBoardTitle.trim()) return;

    startTransition(async () => {
      const result = await actionCriarQuadroCustom({ titulo: newBoardTitle.trim() });
      if (result.success) {
        const newBoard = result.data as KanbanBoardDef;
        setBoards((prev) => [...prev, newBoard]);
        setNewBoardTitle("");
        setIsNewBoardOpen(false);
        handleBoardChange(newBoard.id);
      }
    });
  };

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Kanban"
            filtersSlot={
              <BoardSelector
                boards={boards}
                value={activeBoardId}
                onValueChange={handleBoardChange}
                onCreateBoard={() => setIsNewBoardOpen(true)}
              />
            }
            actionSlot={
              boardType === "custom" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => router.refresh()}
                >
                  Atualizar
                </Button>
              ) : null
            }
          />
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : boardType === "system" && activeBoard?.source ? (
          <SystemBoardView
            data={boardData as SystemBoardData}
            source={activeBoard.source}
            onRefresh={handleRefreshSystemBoard}
          />
        ) : (
          <CustomBoardView initialBoard={boardData as KanbanBoardData} />
        )}
      </DataShell>

      <Dialog open={isNewBoardOpen} onOpenChange={setIsNewBoardOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Novo Quadro</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Input
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              placeholder="Nome do quadro..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newBoardTitle.trim()) {
                  handleCreateBoard();
                }
              }}
            />
            <Button
              size="icon"
              disabled={isPending || !newBoardTitle.trim()}
              onClick={handleCreateBoard}
            >
              <CheckIcon />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
