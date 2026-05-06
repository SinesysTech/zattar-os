"use client";

import { cn } from '@/lib/utils';
import { useState, useCallback } from "react";

import { Pencil } from "lucide-react";
import { Nav } from "./nav";
import { ComposeMailDialog } from "./compose-mail-dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMailStore } from "../hooks/use-mail";
import { buildFolderLinks } from "../utils/constants";

export function NavMobile() {
  const { folders, selectedFolder, setSelectedFolder } = useMailStore();
  const [open, setOpen] = useState(false);
  const folderLinks = buildFolderLinks(folders, selectedFolder);

  const handleSelect = useCallback(
    (folder: string) => {
      setSelectedFolder(folder);
      setOpen(false);
    },
    [setSelectedFolder]
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu">
          <HamburgerMenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-auto [&>button:first-of-type]:hidden">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Navegação</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "flex h-13 items-center justify-center px-4")}>
          <span className={cn( "text-body-sm font-semibold")}>E-mail</span>
        </div>

        <Separator />

        <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "px-2 py-2")}>
          <ComposeMailDialog>
            <Button variant="default" className={cn("w-full inline-tight")}>
              <Pencil className="h-4 w-4" />
              Novo E-mail
            </Button>
          </ComposeMailDialog>
        </div>

        <Separator />

        <Nav
          isCollapsed={false}
          links={folderLinks}
          onSelect={handleSelect}
        />
      </SheetContent>
    </Sheet>
  );
}
