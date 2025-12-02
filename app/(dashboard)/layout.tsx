import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Script from "next/script";

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
        <Script
          id="dify-chatbot-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.difyChatbotConfig = {
  token: '7LF2csja50lSYUzQ',
  inputs: {},
  systemVariables: {},
  userVariables: {},
};`,
          }}
        />
        <Script
          src="https://udify.app/embed.min.js"
          id="7LF2csja50lSYUzQ"
          strategy="afterInteractive"
        />
        <style>{`
  #dify-chatbot-bubble-button { background-color: #1C64F2 !important; }
  #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
`}</style>
      </SidebarInset>
    </SidebarProvider>
  );
}
