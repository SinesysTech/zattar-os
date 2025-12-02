import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DifyChatbot } from "@/components/chat/dify-chatbot"

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
      </SidebarInset>
      <DifyChatbot />
    </SidebarProvider>
  );
}
