"use client";

import * as React from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

export interface PublicPageShellProps {
  children: React.ReactNode;
  showAvatar?: boolean;
  avatarInitials?: string;
}

export function PublicPageShell({
  children,
  showAvatar = true,
  avatarInitials = "JD",
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted dark:bg-background">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card dark:bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/logos/logomarca-light-500x200.svg"
              alt="Zattar Advogados"
              width={150}
              height={60}
              className="h-10 w-auto dark:hidden"
              priority
            />
            <Image
              src="/logos/logomarca-light-500x200.svg"
              alt="Zattar Advogados"
              width={150}
              height={60}
              className="h-10 w-auto hidden dark:block"
              priority
            />
          </div>

          {/* Avatar */}
          {showAvatar && (
            <div
              className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium"
              aria-label={`Avatar do usuário: ${avatarInitials}`}
            >
              {avatarInitials}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col items-center justify-start py-6 px-4 md:py-8 md:px-6">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-card dark:bg-card border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Protegido com segurança por Sinesys</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
