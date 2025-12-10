import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CopilotProviderWrapper } from "@/lib/copilotkit/components";
import { SkipLink } from "@/components/shared/skip-link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SkipLink />
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset id="main-content">
          {/* CopilotKit - Configurações e Actions em @/lib/copilotkit */}
          <CopilotProviderWrapper>
            {children}
          </CopilotProviderWrapper>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}