import type { ReactNode } from "react";
import { SidebarLogo } from "@/components/layout/sidebar/sidebar-logo";
import { UserNav } from "@/app/app/tarefas/components/user-nav";
import { SignatureWorkflowStepper } from "../../../../feature/components/workflow/signature-workflow-stepper";

export function EditorPageLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            {/* Header Fixo */}
            <header className="h-16 border-b bg-surface flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <SidebarLogo />
                    <div className="w-px h-6 bg-border" />
                    <SignatureWorkflowStepper />
                </div>
                <div className="flex items-center gap-4">
                    {/* Placeholder para botão de ajuda se necessário */}
                    <UserNav />
                </div>
            </header>

            {/* Main Content (Canvas com Sidebar flutuante) */}
            <main className="flex-1 min-h-0 relative flex">
                {children}
            </main>
        </div>
    );
}
