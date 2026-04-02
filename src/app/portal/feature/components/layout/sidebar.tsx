"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Gavel,
  Calendar,
  CreditCard,
  Settings,
  Plus,
  HelpCircle,
  LogOut,
  Calculator,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "next-themes";

export function PortalSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Processos", href: "/portal/processos", icon: Gavel },
    { name: "Contratos", href: "/portal/contratos", icon: FileText },
    { name: "Agendamentos", href: "/portal/agendamentos", icon: Calendar },
    { name: "Calculadoras", href: "/portal/calculadoras", icon: Calculator },
    { name: "Financeiro", href: "/portal/financeiro", icon: CreditCard },
    { name: "Meu Perfil", href: "/portal/perfil", icon: Settings },
  ];

  const isDark = theme === "dark";

  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 border-r border-border bg-card flex-col py-8 px-4 z-50 shadow-lg font-headline tracking-tight antialiased">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-black tracking-tighter text-primary uppercase">
          Zattar Portal
        </h1>
        <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase mt-1">
          Tech-Legal Elite
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary font-bold border-r-2 border-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 space-y-1">
        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg mb-4 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
          <Plus className="w-5 h-5" />
          <span>Novo Pedido</span>
        </button>

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 font-medium w-full cursor-pointer"
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
        </button>

        <Link
          href="/portal/suporte"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Suporte</span>
        </Link>
        <Link
          href="/portal"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
