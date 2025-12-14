"use client";

import { FileText, Scale, DollarSign, AudioLines, LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "./navigation-menu";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboard } from "../../contexts/DashboardContext";

// Função para formatar o nome do cliente
const formatarNomeCliente = (nomeCompleto?: string): string => {
  if (!nomeCompleto) return '';
  
  // Divide o nome em partes e remove espaços extras
  const partes = nomeCompleto.trim().split(/\s+/);
  
  // Pega o primeiro e último nome
  const primeiroNome = partes[0] || '';
  const ultimoNome = partes.length > 1 ? partes[partes.length - 1] : '';
  
  // Capitaliza as iniciais
  const primeiroFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();
  const ultimoFormatado = ultimoNome ? ' ' + ultimoNome.charAt(0).toUpperCase() + ultimoNome.slice(1).toLowerCase() : '';
  
  return primeiroFormatado + ultimoFormatado;
};

export const DashboardNavbar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cpf = searchParams?.get("cpf") ?? "";

  const handleLogout = () => {
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    // Redirect to home page
    router.push('/');
  };

  const { data } = useDashboard();
  
  // Obtém o nome do cliente do primeiro contrato disponível
  const nomeCliente = (Array.isArray(data?.contratos) && data.contratos.length > 0)
    ? formatarNomeCliente(data.contratos[0].cliente_nome)
    : '';

  const navItems = [
    { title: "Início", url: `/dashboard?cpf=${cpf}`, icon: LayoutGrid },
    { title: "Contratos", url: `/dashboard/contratos?cpf=${cpf}`, icon: FileText },
    { title: "Processos", url: `/dashboard/processos?cpf=${cpf}`, icon: Scale },
    { title: "Audiências", url: `/dashboard/audiencias?cpf=${cpf}`, icon: AudioLines },
    { title: "Pagamentos", url: `/dashboard/pagamentos?cpf=${cpf}`, icon: DollarSign },
  ];

  const getIsActive = (item: typeof navItems[0]) => {
    if (item.title === "Início") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(item.url.split("?")[0]);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-6 inset-x-4 h-16 bg-background border dark:border-slate-700/70 max-w-[90%] w-[1400px] mx-auto rounded-lg z-50 hidden md:block">
        <div className="h-full flex items-center justify-between mx-auto px-6 relative">
          {/* Logo */}
          <Link href={`/dashboard?cpf=${cpf}`} className="flex items-center space-x-2">
            <div className="w-9 h-9 flex items-center justify-center">
              <Image 
                src="/logo_pz.png" 
                alt="Logo Meu Processo" 
                width={36}
                height={36}
                className="h-9 w-auto object-contain" 
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <TooltipProvider>
              <NavigationMenu>
              <NavigationMenuList className="gap-2 space-x-0">
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.url}
                            className={`nav-item ${getIsActive(item) ? 'active' : ''}`}
                          >
                            <item.icon className="nav-icon" />
                          </Link>
                        </NavigationMenuLink>
                      </TooltipTrigger>
                      <TooltipContent className="custom-tooltip" arrowColor="#5523eb">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
              </NavigationMenu>
            </TooltipProvider>
          </div>

          {/* Client Name and Logout */}
          {nomeCliente && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {nomeCliente}
              </span>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Top Bar - Client Name and Logout */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b dark:border-slate-700/70 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo */}
          <Link href={`/dashboard?cpf=${cpf}`} className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image 
                src="/logo_pz.png" 
                alt="Logo Meu Processo" 
                width={32}
                height={32}
                className="h-8 w-auto object-contain" 
              />
            </div>
          </Link>

          {/* Client Name and Logout */}
          {nomeCliente && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-foreground">
                {nomeCliente}
              </span>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t dark:border-slate-700/70 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${
                getIsActive(item)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">
                {item.title.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};
