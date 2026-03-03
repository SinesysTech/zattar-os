"use client";

import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  LucideIcon,
  Send,
  Trash2
} from "lucide-react";

import { Nav } from "./nav";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useMailStore } from "../use-mail";

const FOLDER_ICONS: Record<string, LucideIcon> = {
  INBOX: Inbox,
  Drafts: File,
  Sent: Send,
  Junk: ArchiveX,
  Trash: Trash2,
  Archive: Archive,
};

const FOLDER_LABELS: Record<string, string> = {
  INBOX: "Inbox",
  Drafts: "Rascunhos",
  Sent: "Enviados",
  Junk: "Lixo eletrônico",
  Trash: "Lixeira",
  Archive: "Arquivo",
};

export function NavMobile() {
  const { folders, selectedFolder, setSelectedFolder } = useMailStore();

  const folderLinks = folders.length > 0
    ? folders.map((folder) => ({
        title: FOLDER_LABELS[folder.path] ?? folder.name,
        label: folder.unread > 0 ? String(folder.unread) : "",
        icon: FOLDER_ICONS[folder.path] ?? Inbox,
        variant: (folder.path === selectedFolder ? "default" : "ghost") as "default" | "ghost",
        folder: folder.path,
      }))
    : [
        { title: "Inbox", label: "", icon: Inbox, variant: "default" as const, folder: "INBOX" },
        { title: "Rascunhos", label: "", icon: File, variant: "ghost" as const, folder: "Drafts" },
        { title: "Enviados", label: "", icon: Send, variant: "ghost" as const, folder: "Sent" },
        { title: "Lixo eletrônico", label: "", icon: ArchiveX, variant: "ghost" as const, folder: "Junk" },
        { title: "Lixeira", label: "", icon: Trash2, variant: "ghost" as const, folder: "Trash" },
        { title: "Arquivo", label: "", icon: Archive, variant: "ghost" as const, folder: "Archive" },
      ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <HamburgerMenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-auto [&>button:first-of-type]:hidden">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>Navegação</DialogTitle>
          </DialogHeader>
        </VisuallyHidden>

        <div className="flex h-[52px] items-center justify-center px-4">
          <span className="text-sm font-semibold">E-mail</span>
        </div>

        <Separator />

        <Nav
          isCollapsed={false}
          links={folderLinks}
          onSelect={setSelectedFolder}
        />
      </SheetContent>
    </Sheet>
  );
}
