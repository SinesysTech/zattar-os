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
import { cn } from "@/lib/utils";
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

interface NavDesktopProps {
  isCollapsed: boolean;
}

export function NavDesktop({ isCollapsed }: NavDesktopProps) {
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
    <>
      <div
        className={cn(
          "flex h-13 items-center justify-center",
          isCollapsed ? "h-13" : "px-4"
        )}>
        <span className={cn("text-sm font-semibold", isCollapsed && "hidden")}>
          E-mail
        </span>
      </div>

      <Separator />

      <Nav
        isCollapsed={isCollapsed}
        links={folderLinks}
        onSelect={setSelectedFolder}
      />
    </>
  );
}
