"use client";

import React, { useEffect, useState } from "react";
import { CommandIcon, SearchIcon, LayoutDashboard, Users, FileText, Scale, Calendar, FolderOpen, Bell, Handshake, Wallet, Database, PenTool, FileEdit, MessageSquare, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

// Nav Principal - Funcionalidades core do escritório
const navPrincipal = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Partes",
    url: "/partes",
    icon: Users,
    items: [
      { title: "Clientes", url: "/partes/clientes" },
      { title: "Partes Contrárias", url: "/partes/partes-contrarias" },
      { title: "Terceiros", url: "/partes/terceiros" },
      { title: "Representantes", url: "/partes/representantes" },
    ],
  },
  {
    title: "Contratos",
    url: "/contratos",
    icon: FileText,
  },
  {
    title: "Processos",
    url: "/processos",
    icon: Scale,
  },
  {
    title: "Audiências",
    url: "/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/expedientes",
    icon: FolderOpen,
  },
  {
    title: "ComunicaCNJ",
    url: "/comunica-cnj",
    icon: Bell,
  },
  {
    title: "Obrigações",
    url: "/acordos-condenacoes/lista",
    icon: Handshake,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: Wallet,
    items: [
      { title: "Orçamentos", url: "/financeiro/orcamentos" },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar" },
      { title: "Contas a Receber", url: "/financeiro/contas-receber" },
      { title: "Plano de Contas", url: "/financeiro/plano-contas" },
      { title: "Obrigações Financeiras", url: "/financeiro/obrigacoes" },
    ],
  },
  {
    title: "Captura",
    url: "/captura",
    icon: Database,
    items: [
      { title: "Histórico", url: "/captura/historico" },
      { title: "Agendamentos", url: "/captura/agendamentos" },
      { title: "Credenciais", url: "/captura/credenciais" },
      { title: "Tribunais", url: "/captura/tribunais" },
    ],
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    title: "Assinatura Digital",
    url: "/assinatura-digital/assinatura",
    icon: PenTool,
    items: [
      { title: "Fluxo de Assinatura", url: "/assinatura-digital/assinatura" },
      { title: "Templates", url: "/assinatura-digital/templates" },
      { title: "Formulários", url: "/assinatura-digital/formularios" },
    ],
  },
  {
    title: "Documentos",
    url: "/documentos",
    icon: FileEdit,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Assistentes",
    url: "/assistentes",
    icon: Bot,
  },
]

export default function Search() {
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const onSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  if (!mounted) {
    return (
      <div className="lg:flex-1">
        <div className="relative hidden max-w-sm flex-1 lg:block">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
            placeholder="Busca rápida..."
            type="search"
            readOnly
          />
          <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
            <CommandIcon className="size-3" />
            <span>k</span>
          </div>
        </div>
        <div className="block lg:hidden">
          <Button size="icon" variant="ghost">
            <SearchIcon />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:flex-1">
      <div className="relative hidden max-w-sm flex-1 lg:block">
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          className="h-9 w-full cursor-pointer rounded-md border pr-4 pl-10 text-sm shadow-xs"
          placeholder="Busca rápida..."
          type="search"
          onFocus={() => setOpen(true)}
          readOnly
        />
        <div className="absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded-sm bg-zinc-200 p-1 font-mono text-xs font-medium sm:flex dark:bg-neutral-700">
          <CommandIcon className="size-3" />
          <span>k</span>
        </div>
      </div>
      <div className="block lg:hidden">
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
          <SearchIcon />
        </Button>
      </div>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Busca rápida"
        description="Pesquise por comandos ou navegue pelo sistema"
      >
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Principal">
            {navPrincipal.map((item) => (
              <React.Fragment key={item.url}>
                <CommandItem onSelect={() => onSelect(item.url)}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </CommandItem>
                {item.items?.map((subItem) => (
                  <CommandItem key={subItem.url} onSelect={() => onSelect(subItem.url)} className="pl-8">
                    <span>{subItem.title}</span>
                  </CommandItem>
                ))}
              </React.Fragment>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Serviços">
            {navServicos.map((item) => (
              <React.Fragment key={item.url}>
                <CommandItem onSelect={() => onSelect(item.url)}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  <span>{item.title}</span>
                </CommandItem>
                {item.items?.map((subItem) => (
                  <CommandItem key={subItem.url} onSelect={() => onSelect(subItem.url)} className="pl-8">
                    <span>{subItem.title}</span>
                  </CommandItem>
                ))}
              </React.Fragment>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
