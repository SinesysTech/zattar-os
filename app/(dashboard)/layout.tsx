import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CopilotProviderWrapper } from "@/lib/copilotkit/components";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        {/* CopilotKit - Configurações e Actions em @/lib/copilotkit */}
        <CopilotProviderWrapper>
          {children}
        </CopilotProviderWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}