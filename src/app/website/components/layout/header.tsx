"use client";

import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/servicos", label: "Serviços" },
  { href: "/expertise", label: "Especialidades" },
  { href: "/insights", label: "Insights" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-7xl rounded-full border border-outline-variant/20 bg-surface-container-highest/60 backdrop-blur-xl flex justify-between items-center px-4 sm:px-6 md:px-8 py-2.5 md:py-3 z-50 shadow-ambient">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger className="md:hidden p-2 -ml-1 text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Abrir menu">
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="bg-surface-container-highest border-outline-variant/20 w-70">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <Link href="/" className="block mb-2" aria-label="Logo Zattar Advogados">
              <BrandMark variant="dark" size="md" className="object-left" />
            </Link>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors font-headline tracking-tight py-3 px-3 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto p-4">
            <Button asChild className="w-full rounded-full">
              <Link href="/portal">Acessar Portal</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logo */}
      <Link href="/" className="flex border-none outline-none" aria-label="Logo Zattar Advogados">
        <BrandMark
          variant="auto"
          size="custom"
          priority
          className="h-8 sm:h-10 md:h-12 w-auto object-left"
        />
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex gap-8 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors duration-300 font-headline tracking-tight hover:text-primary text-muted-foreground"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* CTA button — hidden on very small screens, visible from sm+ */}
      <Button asChild size="sm" className="hidden sm:inline-flex rounded-full">
        <Link href="/portal">Acessar Portal</Link>
      </Button>
    </nav>
  );
}
