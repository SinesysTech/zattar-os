"use client";

import { useState } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import { History } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { cn } from "@/lib/utils";

interface ActionDropdownProps {
  buttonClassName?: string;
}

export function ActionDropdown({ buttonClassName }: ActionDropdownProps) {
  const [showNovoChatDialog, setShowNovoChatDialog] = useState(false);
  const [showCriarGrupoDialog, setShowCriarGrupoDialog] = useState(false);
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={cn("rounded-full", buttonClassName)}>
            <PlusIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowNovoChatDialog(true)}>Novo chat</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowCriarGrupoDialog(true)}>Criar grupo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/chat/historico-chamadas')}>
              <History className="mr-2 h-4 w-4" />
              Histórico de chamadas
            </DropdownMenuItem>
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
