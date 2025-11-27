'use client';

import { useState } from 'react';
import { Shield, User, Settings, LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
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
import { UserStatusCards, AdminStatusCards } from './components/status-cards';
import { WidgetProcessosCompact } from './components/widget-processos-compact';
import { WidgetAudienciasProximas } from './components/widget-audiencias-proximas';
import { WidgetPendentesUrgentes } from './components/widget-pendentes-urgentes';
import { WidgetProdutividade } from './components/widget-produtividade';
import { WidgetCargaUsuarios } from './components/widget-carga-usuarios';
import { WidgetMetricasEscritorio } from './components/widget-metricas-escritorio';
import { WidgetStatusCapturas } from './components/widget-status-capturas';
import { WidgetPerformanceAdvogados } from './components/widget-performance-advogados';
import { AdvogadoPerformanceCard, ProdutividadeCard } from './components/performance-card';

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
                <Typography.H2 as="h1">Dashboard</Typography.H2>
                <Badge variant="soft" tone="warning" className="text-xs">
                  Sandbox
                </Badge>
              </div>
              <Typography.Muted className="mt-1">
                {role === 'user'
                  ? 'Acompanhe seus processos, audiências e expedientes'
                  : 'Visão geral do escritório e métricas de performance'}
              </Typography.Muted>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle de Role */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={role === 'user' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => role !== 'user' && handleToggleRole()}
                  className="gap-2 h-8"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuário</span>
                </Button>
                <Button
                  variant={role === 'superadmin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => role !== 'superadmin' && handleToggleRole()}
                  className="gap-2 h-8"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>

              {/* Menu de configurações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Settings className="h-4 w-4" />
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
            <Typography.Small className="text-muted-foreground">
              Visualizando como:{' '}
              <span className="font-medium text-foreground">
                {usuario.nome_exibicao}
              </span>
              {usuario.cargo && (
                <span className="text-muted-foreground"> • {usuario.cargo}</span>
              )}
            </Typography.Small>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-6">
        {role === 'user' ? (
          // ================================================================
          // Dashboard do Usuário
          // ================================================================
          <div className="space-y-6">
            {/* Cards de Status - Resumo Rápido */}
            <section>
              <UserStatusCards
                processos={processosResumo}
                audiencias={audienciasResumo}
                pendentes={pendentesResumo}
              />
            </section>

            {/* Widgets de Detalhe */}
            <section className="space-y-4">
              <Typography.H4 className="text-muted-foreground">Detalhamento</Typography.H4>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Coluna 1: Processos + Audiências */}
                <div className="space-y-6">
                  <WidgetProcessosCompact
                    data={processosResumo}
                    loading={loading}
                  />
                  <WidgetAudienciasProximas
                    audiencias={audienciasUsuario}
                    resumo={audienciasResumo}
                    loading={loading}
                  />
                </div>

                {/* Coluna 2: Pendentes + Produtividade */}
                <div className="space-y-6">
                  <WidgetPendentesUrgentes
                    pendentes={pendentesUsuario}
                    resumo={pendentesResumo}
                    loading={loading}
                  />
                  <WidgetProdutividade
                    data={produtividade}
                    loading={loading}
                  />
                </div>
              </div>
            </section>

            {/* Nova seção: Performance Card (Novo Design) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Typography.H4 className="text-muted-foreground">Produtividade</Typography.H4>
                <Badge variant="soft" tone="info" className="text-[10px]">Novo Design</Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ProdutividadeCard
                  nomeUsuario={usuario.nome_exibicao}
                  baixasHoje={produtividade.ultimoMes[produtividade.ultimoMes.length - 1]?.pendentesResolvidos || 0}
                  baixasSemana={produtividade.ultimoMes.slice(-7).reduce((acc, d) => acc + d.pendentesResolvidos, 0)}
                  baixasMes={produtividade.totalPendentes}
                  mediaDiaria={produtividade.mediaProcessosDia}
                  comparativoSemanaAnterior={12}
                  metaMensal={50}
                  atividadesRecentes={[
                    { id: '1', text: 'Baixou expediente TRT4-0001234', date: 'Hoje', status: 'success' },
                    { id: '2', text: 'Concluiu 3 manifestações', date: 'Ontem', status: 'success' },
                    { id: '3', text: 'Prazo próximo: TRT9-0005678', date: '2 dias', status: 'warning' },
                  ]}
                  onVerDetalhes={() => console.log('Ver detalhes')}
                />
              </div>
            </section>

            {/* Área para Widgets Pessoais */}
            <section className="space-y-4">
              <Typography.H4 className="text-muted-foreground">Meu Espaço</Typography.H4>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Typography.Small className="font-medium">Adicionar Tarefas</Typography.Small>
                    <Typography.Muted className="text-xs mt-1">Lista de afazeres pessoal</Typography.Muted>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Typography.Small className="font-medium">Adicionar Notas</Typography.Small>
                    <Typography.Muted className="text-xs mt-1">Anotações rápidas</Typography.Muted>
                  </CardContent>
                </Card>

                <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Typography.Small className="font-medium">Adicionar Links</Typography.Small>
                    <Typography.Muted className="text-xs mt-1">Atalhos úteis</Typography.Muted>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        ) : (
          // ================================================================
          // Dashboard do Superadmin
          // ================================================================
          <div className="space-y-6">
            {/* Cards de Status - Resumo Rápido */}
            <section>
              <AdminStatusCards
                totalProcessos={metricasEscritorio.totalProcessos}
                totalAudiencias={metricasEscritorio.totalAudiencias}
                totalPendentes={metricasEscritorio.totalPendentes}
                totalUsuarios={metricasEscritorio.totalUsuarios}
                processosAtivos={metricasEscritorio.processosAtivos}
                pendentesVencidos={pendentesResumo.vencidos}
                comparativo={metricasEscritorio.comparativoMesAnterior}
              />
            </section>

            {/* Widgets de Gestão */}
            <section className="space-y-4">
              <Typography.H4 className="text-muted-foreground">Visão Geral do Escritório</Typography.H4>

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
            </section>

            {/* Widgets Operacionais */}
            <section className="space-y-4">
              <Typography.H4 className="text-muted-foreground">Operações</Typography.H4>

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
            </section>

            {/* Nova seção: Performance Cards (Novo Design) */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Typography.H4 className="text-muted-foreground">Performance Individual</Typography.H4>
                <Badge variant="soft" tone="info" className="text-[10px]">Novo Design</Badge>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {performanceAdvogados.slice(0, 3).map((advogado) => (
                  <AdvogadoPerformanceCard
                    key={advogado.usuario.id}
                    nome={advogado.usuario.nome_exibicao}
                    cargo={advogado.usuario.cargo}
                    baixasSemana={advogado.pendentesResolvidos}
                    baixasMes={advogado.audienciasRealizadas * 3}
                    taxaCumprimentoPrazo={Math.round((1 - advogado.tempoMedioResolucao / 10) * 100)}
                    expedientesVencidos={Math.max(0, advogado.tempoMedioResolucao - 3)}
                    trendSemana={advogado.score > 80 ? 15 : -5}
                    trendMes={advogado.score > 70 ? 8 : -3}
                    atividadesRecentes={[
                      { id: '1', text: `Resolveu ${advogado.pendentesResolvidos} expedientes`, date: 'Semana', status: 'success' as const },
                      { id: '2', text: `${advogado.audienciasRealizadas} audiências realizadas`, date: 'Mês', status: 'success' as const },
                      { id: '3', text: advogado.tempoMedioResolucao > 3 ? 'Atenção: prazos acumulados' : 'Performance excelente', date: 'Status', status: advogado.tempoMedioResolucao > 3 ? 'warning' as const : 'success' as const },
                    ]}
                    onVerRelatorio={() => console.log('Ver relatório', advogado.usuario.id)}
                    onAgendar={() => console.log('Agendar', advogado.usuario.id)}
                  />
                ))}
              </div>
            </section>

            {/* Visão Consolidada */}
            <section className="space-y-4">
              <Typography.H4 className="text-muted-foreground">Expedientes e Audiências (Todos)</Typography.H4>

              <div className="grid gap-6 lg:grid-cols-2">
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
            </section>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-6 py-4">
          <Typography.Muted className="text-center text-xs">
            Dashboard Sandbox • Dados mockados para validação de layout •{' '}
            <span className="text-foreground font-medium">
              {role === 'user' ? 'Visão de Usuário' : 'Visão de Administrador'}
            </span>
          </Typography.Muted>
        </div>
      </footer>
    </div>
  );
}
