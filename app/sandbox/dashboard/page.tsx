'use client';

import { useState } from 'react';
import { Shield, User, Settings, LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/app/_lib/utils/utils';

// Widgets
import { WidgetProcessosResumo } from './components/widget-processos-resumo';
import { WidgetAudienciasProximas } from './components/widget-audiencias-proximas';
import { WidgetPendentesUrgentes } from './components/widget-pendentes-urgentes';
import { WidgetProdutividade } from './components/widget-produtividade';
import { WidgetCargaUsuarios } from './components/widget-carga-usuarios';
import { WidgetMetricasEscritorio } from './components/widget-metricas-escritorio';
import { WidgetStatusCapturas } from './components/widget-status-capturas';
import { WidgetPerformanceAdvogados } from './components/widget-performance-advogados';

// Mock data
import {
  mockUsuarioAtual,
  mockSuperadmin,
  mockAudiencias,
  mockPendentes,
  getProcessosResumo,
  getAudienciasResumo,
  getPendentesResumo,
  getProdutividadeResumo,
  getCargaUsuarios,
  getMetricasEscritorio,
  getStatusCapturas,
  getPerformanceAdvogados,
} from './data/mock-data';

type UserRole = 'user' | 'superadmin';

export default function SandboxDashboardPage() {
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  const usuario = role === 'superadmin' ? mockSuperadmin : mockUsuarioAtual;

  // Dados do usuário (filtrados pelo responsável)
  const processosResumo = getProcessosResumo(role === 'user' ? usuario.id : undefined);
  const audienciasResumo = getAudienciasResumo(role === 'user' ? usuario.id : undefined);
  const pendentesResumo = getPendentesResumo(role === 'user' ? usuario.id : undefined);
  const produtividade = getProdutividadeResumo(usuario.id);

  // Dados de admin
  const cargaUsuarios = getCargaUsuarios();
  const metricasEscritorio = getMetricasEscritorio();
  const statusCapturas = getStatusCapturas();
  const performanceAdvogados = getPerformanceAdvogados();

  // Audiências e pendentes filtrados
  const audienciasUsuario = role === 'user'
    ? mockAudiencias.filter((a) => a.responsavel_id === usuario.id)
    : mockAudiencias;
  const pendentesUsuario = role === 'user'
    ? mockPendentes.filter((p) => p.responsavel_id === usuario.id)
    : mockPendentes;

  const handleToggleRole = () => {
    setLoading(true);
    setTimeout(() => {
      setRole(role === 'user' ? 'superadmin' : 'user');
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard Sandbox</h1>
                <Badge variant="soft" tone="warning" className="text-xs">
                  Preview
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Visualização com dados mockados para validação do layout
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle de Role */}
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={role === 'user' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => role !== 'user' && handleToggleRole()}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Usuário
                </Button>
                <Button
                  variant={role === 'superadmin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => role !== 'superadmin' && handleToggleRole()}
                  className="gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </div>

              {/* Menu de configurações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Personalização</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Editar Layout
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Widget
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Info do usuário atual */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                role === 'superadmin' ? 'bg-amber-500' : 'bg-emerald-500'
              )}
            />
            <span className="text-sm text-muted-foreground">
              Visualizando como:{' '}
              <span className="font-medium text-foreground">
                {usuario.nome_completo}
              </span>
              {usuario.cargo && (
                <span className="text-muted-foreground"> ({usuario.cargo})</span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-6">
        {role === 'user' ? (
          // Dashboard do Usuário
          <div className="space-y-6">
            {/* Linha 1: Stats principais */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <WidgetProcessosResumo
                data={processosResumo}
                loading={loading}
              />
              <WidgetAudienciasProximas
                audiencias={audienciasUsuario}
                resumo={audienciasResumo}
                loading={loading}
              />
              <WidgetPendentesUrgentes
                pendentes={pendentesUsuario}
                resumo={pendentesResumo}
                loading={loading}
              />
            </div>

            {/* Linha 2: Produtividade */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WidgetProdutividade
                data={produtividade}
                loading={loading}
              />
              {/* Placeholder para widgets pessoais */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Widget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Clique para adicionar tarefas, notas ou links
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">Tarefas</Button>
                      <Button variant="outline" size="sm">Notas</Button>
                      <Button variant="outline" size="sm">Links</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Dashboard do Superadmin
          <div className="space-y-6">
            {/* Linha 1: Métricas gerais */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WidgetMetricasEscritorio
                data={metricasEscritorio}
                loading={loading}
              />
              <WidgetCargaUsuarios
                data={cargaUsuarios}
                loading={loading}
              />
            </div>

            {/* Linha 2: Capturas e Performance */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WidgetStatusCapturas
                data={statusCapturas}
                loading={loading}
              />
              <WidgetPerformanceAdvogados
                data={performanceAdvogados}
                loading={loading}
              />
            </div>

            {/* Linha 3: Visão consolidada (pendentes e audiências de todos) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <WidgetProcessosResumo
                data={processosResumo}
                loading={loading}
              />
              <WidgetAudienciasProximas
                audiencias={audienciasUsuario}
                resumo={audienciasResumo}
                loading={loading}
              />
              <WidgetPendentesUrgentes
                pendentes={pendentesUsuario}
                resumo={pendentesResumo}
                loading={loading}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-6 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Dashboard Sandbox - Dados mockados para validação de layout.
            Esta página não está conectada ao banco de dados real.
          </p>
        </div>
      </footer>
    </div>
  );
}
