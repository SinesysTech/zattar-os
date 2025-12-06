import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui"; // Importar a UI Sidebar
import "@copilotkit/react-ui/styles.css";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      {/* Sidebar do Shadcn (Esquerda) */}
      <AppSidebar />
      
      <SidebarInset>
        {/* O Provider carrega o cérebro da IA */}
        <CopilotKit runtimeUrl="/api/copilotkit">
          
          {/* A UI Sidebar envolve o conteúdo para poder "espremê-lo" */}
          <CopilotSidebar
            defaultOpen={false} // Começa fechada para não poluir
            instructions="Você é um assistente jurídico experiente."
            labels={{
              title: "Pedrinho",
            }}
          >
            {/* O conteúdo da sua dashboard fica AQUI DENTRO */}
            <div className="flex flex-1 flex-col gap-4 p-6 overflow-x-hidden">
               {children}
            </div>

          </CopilotSidebar>

        </CopilotKit>
      </SidebarInset>
    </SidebarProvider>
  );
}