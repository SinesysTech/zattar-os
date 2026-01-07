/**
 * Layout do grupo (dashboard)
 * As páginas neste grupo herdam o layout principal de /app que já contém
 * o SidebarProvider, AppSidebar, Header e CopilotKit.
 * Este layout existe apenas para agrupar rotas de dashboard.
 */
export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
