"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  CreditCard,
  FileText,
  Gavel,
  Settings,
  User,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

/**
 * Command Menu Global (Cmd/Ctrl+K)
 *
 * Menu de comandos acessível de qualquer lugar do sistema.
 * Permite navegação rápida entre páginas e execução de ações comuns.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  /**
   * Executa uma ação e fecha o dialog
   */
  const run = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {/* Acesso Rápido */}
        <CommandGroup heading="Acesso Rápido">
          <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/processos"))}>
            <Gavel className="mr-2 h-4 w-4" />
            <span>Processos</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/financeiro"))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Financeiro</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Ações */}
        <CommandGroup heading="Ações">
          <CommandItem
            onSelect={() =>
              run(() => {
                // TODO: Implementar modal de novo processo
                console.log("Novo Processo");
              })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Novo Processo</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                // TODO: Implementar modal de novo cliente
                console.log("Novo Cliente");
              })
            }
          >
            <User className="mr-2 h-4 w-4" />
            <span>Novo Cliente</span>
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Sistema */}
        <CommandGroup heading="Sistema">
          <CommandItem onSelect={() => run(() => router.push("/configuracoes"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
