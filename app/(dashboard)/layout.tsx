import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Pedrinho } from "@/components/layout/pedrinho"; // <--- Importe aqui

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-6 overflow-x-hidden">
          {children}
        </div>
        
        {/* Adicione o chatbot aqui no final */}
        <Pedrinho />
        
      </SidebarInset>
    </SidebarProvider>
  );
}