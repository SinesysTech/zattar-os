"use client";

import { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { NovoChatDialog } from "./novo-chat-dialog";
import { CriarGrupoDialog } from "./criar-grupo-dialog";

export function ActionDropdown() {
  const [showNovoChatDialog, setShowNovoChatDialog] = useState(false);
  const [showCriarGrupoDialog, setShowCriarGrupoDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <PlusIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowNovoChatDialog(true)}>Novo chat</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCriarGrupoDialog(true)}>Criar grupo</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <NovoChatDialog
        open={showNovoChatDialog}
        onOpenChange={setShowNovoChatDialog}
      />

      <CriarGrupoDialog
        open={showCriarGrupoDialog}
        onOpenChange={setShowCriarGrupoDialog}
      />
    </>
  );
}
