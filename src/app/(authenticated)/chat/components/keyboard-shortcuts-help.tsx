import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { action: "Alternar Microfone", keys: ["M", "Ctrl + D"] },
    { action: "Alternar Câmera", keys: ["V", "Ctrl + E"] },
    { action: "Compartilhar Tela", keys: ["S", "Ctrl + Shift + S"] },
    { action: "Gravar Reunião", keys: ["R", "Ctrl + Shift + R"] },
    { action: "Ver Transcrição", keys: ["T", "Ctrl + Shift + T"] },
    { action: "Lista de Participantes", keys: ["P", "Ctrl + Shift + P"] },
    { action: "Sair da Chamada", keys: ["Esc"] },
    { action: "Ajuda (este menu)", keys: ["?"] },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-video-surface border-video-border text-video-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow className="border-video-border hover:bg-video-surface-hover/50">
              <TableHead className="text-video-muted">Ação</TableHead>
              <TableHead className="text-right text-video-muted">Atalho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortcuts.map((shortcut) => (
              <TableRow key={shortcut.action} className="border-video-border hover:bg-video-surface-hover/50">
                <TableCell className="font-medium">{shortcut.action}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="px-2 py-1 text-xs font-semibold text-video-text bg-video-surface-hover border border-video-surface-hover rounded-md"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
