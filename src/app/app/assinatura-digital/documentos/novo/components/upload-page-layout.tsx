"use client";



interface UploadPageLayoutProps {
    children: React.ReactNode;
}

export function UploadPageLayout({ children }: UploadPageLayoutProps) {
    return (
        <div className="h-screen w-full flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Header Fixo - Simplificado para mostrar apenas o Stepper */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-center bg-surface-light px-4 dark:bg-surface-dark dark:border-border lg:px-8 backdrop-blur-md bg-opacity-90">

            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
        </div>
    );
}
