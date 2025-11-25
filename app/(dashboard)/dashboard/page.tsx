import { EnhancedDashboardGrid } from './components/enhanced-dashboard-grid';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Gerencie suas tarefas, notas e links favoritos em um só lugar
        </p>
      </div>
      <EnhancedDashboardGrid />
    </div>
  );
}
