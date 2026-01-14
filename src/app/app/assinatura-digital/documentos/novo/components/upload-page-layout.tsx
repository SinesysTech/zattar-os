"use client";

import Link from "next/link";
import { HelpCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignatureWorkflowStepper } from "@/app/app/assinatura-digital/feature/components/workflow/signature-workflow-stepper";
import { SidebarLogo } from "@/components/layout/sidebar/sidebar-logo";

interface UploadPageLayoutProps {
    children: React.ReactNode;
}

export function UploadPageLayout({ children }: UploadPageLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header Fixo */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-surface-light px-4 dark:bg-surface-dark dark:border-border lg:px-8 backdrop-blur-md bg-opacity-90">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                        <SidebarLogo />
                        <span className="hidden font-heading text-lg font-bold lg:block">SignFlow</span>
                    </Link>

                    <div className="h-6 w-px bg-border mx-2 hidden md:block" />

                    <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground hover:text-foreground hidden md:block transition-colors"
                    >
                        Voltar ao Dashboard
                    </Link>
                </div>

                {/* Stepper Centralizado */}
                <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <SignatureWorkflowStepper />
                </div>

                {/* User Actions */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <HelpCircle className="size-5" />
                    </Button>

                    <Avatar className="size-8 border border-border">
                        {/* Placeholder for user avatar - in a real app would come from auth context */}
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="size-4" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}
