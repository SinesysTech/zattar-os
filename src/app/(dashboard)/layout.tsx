import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={false}
        instructions={SYSTEM_PROMPT}
        labels={{
          title: "Pedrinho",
          initial: "Olá! Como posso ajudar você hoje?",
        }}
      >
        <SidebarProvider>
          <AppSidebar />

          {/* 
          FRAME PRINCIPAL (App Shell)
          - h-screen: Ocupa 100% da altura da janela (viewport).
          - overflow-hidden: Impede que a tela inteira role. O scroll fica restrito ao filho.
          - flex flex-col: Organiza os filhos (Header + Conteúdo) em uma coluna vertical.
        */}
          <SidebarInset className="h-screen overflow-hidden flex flex-col">

            {/*
            CABEÇALHO FIXO
            - h-16: Altura fixa de 64px (4rem). Estável, sem animação de mudança.
            - shrink-0: Garante que o header nunca encolha, mesmo se faltar espaço.
            - border-b: Linha separadora sutil na parte inferior.
            - bg-card: Fundo sólido (Branco no Light Mode) para sobrepor conteúdo ao rolar (se fosse sticky).
            - px-4: Padding horizontal interno.
          */}
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-card px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Search />
              </div>
              <div className="flex items-center gap-2">
                <Notifications />
              </div>
            </header>

            {/*
            ÁREA DE CONTEÚDO ROLÁVEL
            - flex-1: Ocupa todo o espaço vertical restante abaixo do Header.
            - overflow-y-auto: Adiciona barra de rolagem APENAS neste container quando necessário.
            - flex-col gap-4: Espaçamento padrão entre elementos filhos diretos.
            - p-6: Padding uniforme de 24px em volta do conteúdo.
          */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              {children}
            </div>

          </SidebarInset>
        </SidebarProvider>
      </CopilotSidebar>
    </CopilotKit>
  )
}